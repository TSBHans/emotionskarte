"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import clsx from "clsx";
import maplibregl, { Map as MapLibreMap, MapMouseEvent } from "maplibre-gl";
import { registerProtocol } from "pmtiles";
import { useEffect, useMemo, useRef, useState } from "react";
import createBaseMapStyle from "../lib/mapStyle";
import {
  H3_CENTROID_LAYER,
  H3_POLYGON_LAYER,
  H3_SOURCE_ID,
  MAP_INITIAL_VIEW,
  PMTILES_BASE_PATH,
  PLACE_LABELS
} from "../lib/constants";
import type { Filters } from "../lib/aggregation";
import type { HexAggregated, Metric, Place } from "../lib/types";

let protocolRegistered = false;
let featureStateWarningShown = false;

const COLOR_EXPRESSION: maplibregl.ExpressionSpecification = [
  "case",
  ["==", ["feature-state", "value"], null],
  "#B0B0B0",
  [
    "interpolate",
    ["linear"],
    ["feature-state", "value"],
    1,
    "#e6f7f7",
    2,
    "#9de1e0",
    3,
    "#52c7c4",
    4,
    "#19b3ab",
    5,
    "#009a92"
  ]
];

const CIRCLE_RADIUS_EXPRESSION: maplibregl.ExpressionSpecification = [
  "interpolate",
  ["linear"],
  ["coalesce", ["feature-state", "n"], 0],
  0,
  0,
  5,
  4,
  10,
  8,
  25,
  14,
  50,
  18
];

type MapViewProps = {
  mapData: Record<string, HexAggregated>;
  filters: Filters;
  metric: Metric;
  activePlaces: Place[];
  loading: boolean;
  error?: string | null;
};

type TooltipState = {
  hexId: string;
  x: number;
  y: number;
  info: HexAggregated;
};

export default function MapView({ mapData, filters, metric, activePlaces, loading, error }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const hoverTimeout = useRef<NodeJS.Timeout | null>(null);
  const dataRef = useRef(mapData);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [tileError, setTileError] = useState<string | null>(null);

  dataRef.current = mapData;

  useEffect(() => {
    if (!protocolRegistered) {
      registerProtocol();
      protocolRegistered = true;
    }
  }, []);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) {
      return;
    }

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: createBaseMapStyle(),
      center: MAP_INITIAL_VIEW.center,
      zoom: MAP_INITIAL_VIEW.zoom,
      attributionControl: true
    });

    mapRef.current = map;

    map.on("load", () => {
      map.addSource(H3_SOURCE_ID, {
        type: "vector",
        url: PMTILES_BASE_PATH
      });

      map.addLayer({
        id: "h3-fill",
        type: "fill",
        source: H3_SOURCE_ID,
        "source-layer": H3_POLYGON_LAYER,
        paint: {
          "fill-color": COLOR_EXPRESSION,
          "fill-opacity": getOpacityExpression(filters.hideNoData)
        }
      });

      map.addLayer({
        id: "h3-outline",
        type: "line",
        source: H3_SOURCE_ID,
        "source-layer": H3_POLYGON_LAYER,
        paint: {
          "line-color": "#222",
          "line-opacity": 0.3,
          "line-width": 0.5
        }
      });

      map.addLayer({
        id: "h3-centroids",
        type: "circle",
        source: H3_SOURCE_ID,
        "source-layer": H3_CENTROID_LAYER,
        paint: {
          "circle-color": COLOR_EXPRESSION,
          "circle-opacity": getOpacityExpression(filters.hideNoData),
          "circle-radius": CIRCLE_RADIUS_EXPRESSION,
          "circle-stroke-width": 0.4,
          "circle-stroke-color": "#0f172a"
        }
      });

      updateFeatureStates(map, dataRef.current);
      setupInteractions(map);
    });

    map.on("error", (event) => {
      if (event?.error) {
        setTileError("Kartendaten konnten nicht geladen werden.");
      }
    });

    return () => {
      popupRef.current?.remove();
      map.remove();
      mapRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) {
      return;
    }
    const timeout = setTimeout(() => {
      updateFeatureStates(map, mapData);
    }, 150);
    return () => clearTimeout(timeout);
  }, [mapData]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const opacity = getOpacityExpression(filters.hideNoData);
    if (map.getLayer("h3-fill")) {
      map.setPaintProperty("h3-fill", "fill-opacity", opacity);
    }
    if (map.getLayer("h3-centroids")) {
      map.setPaintProperty("h3-centroids", "circle-opacity", opacity);
    }
  }, [filters.hideNoData]);

  const activePlacesLabel = useMemo(
    () =>
      activePlaces
        .map((place) => PLACE_LABELS[place])
        .join(", ") || "Alle Orte",
    [activePlaces]
  );

  const setupInteractions = (map: MapLibreMap) => {
    map.on("mousemove", "h3-centroids", (event) => handleHover(event));
    map.on("mousemove", "h3-fill", (event) => handleHover(event));
    map.on("mouseleave", "h3-fill", () => setTooltip(null));
    map.on("mouseleave", "h3-centroids", () => setTooltip(null));

    map.on("click", "h3-fill", (event) => handleClick(event));
    map.on("click", "h3-centroids", (event) => handleClick(event));
  };

  const handleHover = (event: MapMouseEvent & maplibregl.EventData) => {
    if (hoverTimeout.current) {
      clearTimeout(hoverTimeout.current);
    }
    hoverTimeout.current = setTimeout(() => {
      const features = event.features ?? [];
      const feature = features[0];
      if (!feature?.id) {
        setTooltip(null);
        return;
      }
      const hexId = String(feature.id);
      const info = dataRef.current[hexId];
      if (!info) {
        setTooltip(null);
        return;
      }
      setTooltip({
        hexId,
        x: event.point.x,
        y: event.point.y,
        info
      });
    }, 150);
  };

  const handleClick = (event: MapMouseEvent & maplibregl.EventData) => {
    const feature = event.features?.[0];
    if (!feature?.id) {
      return;
    }
    const hexId = String(feature.id);
    const info = dataRef.current[hexId];
    if (!info) {
      return;
    }
    const popup = popupRef.current ?? new maplibregl.Popup({ closeOnClick: true, closeButton: true });
    popupRef.current = popup;

    const tableRows = (Object.keys(info.places) as Place[])
      .map((place) => {
        const entry = info.places[place];
        const value = entry.value != null ? entry.value.toFixed(2) : "n/a";
        const n = entry.n != null ? entry.n : "n/a";
        return `<tr><td>${PLACE_LABELS[place]}</td><td class="text-right">${value}</td><td class="text-right">${n}</td></tr>`;
      })
      .join("");

    popup
      .setLngLat(event.lngLat)
      .setHTML(`
        <div class="min-w-[220px] text-sm">
          <h3 class="text-base font-semibold">Hex ${hexId}</h3>
          <p class="mt-1">${metric} · Teilnehmer:innen: ${info.n}</p>
          <p class="mt-1">Durchschnitt: ${info.value != null ? info.value.toFixed(2) : "n/a"}</p>
          <table class="mt-3 w-full border-collapse text-xs">
            <thead>
              <tr>
                <th class="text-left">Ort</th>
                <th class="text-right">Wert</th>
                <th class="text-right">Teiln.</th>
              </tr>
            </thead>
            <tbody>${tableRows}</tbody>
          </table>
        </div>
      `)
      .addTo(mapRef.current!);
  };

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="absolute inset-0" />
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-night-950/70 text-sm uppercase tracking-[0.4em] text-slate-200">
          Daten werden geladen …
        </div>
      )}
      {(error || tileError) && (
        <div className="absolute inset-0 z-20 flex items-center justify-center">
          <div className="rounded-3xl border border-red-500/40 bg-night-900/90 px-6 py-4 text-sm text-red-300 shadow-glow">
            {error ?? tileError}
          </div>
        </div>
      )}
      {tooltip && (
        <div
          className={clsx(
            "pointer-events-none absolute z-20 w-60 rounded-3xl border border-white/10 bg-night-900/85 p-4 text-xs text-slate-100 shadow-glow backdrop-blur"
          )}
          style={{ left: tooltip.x + 12, top: tooltip.y + 12 }}
        >
          <p className="text-[11px] uppercase tracking-[0.35em] text-primary-100">{metric}</p>
          <p className="mt-2 text-sm font-semibold">Hex {tooltip.hexId}</p>
          <p className="mt-1 text-xs text-slate-300">
            Durchschnitt: {tooltip.info.value != null ? tooltip.info.value.toFixed(2) : "n/a"}
          </p>
          <p className="text-xs text-slate-300">
            Teilnehmer:innen: {tooltip.info.hasData ? tooltip.info.n : "n/a"}
          </p>
          <p className="mt-3 text-[11px] uppercase tracking-[0.35em] text-slate-500">Aktive Orte</p>
          <p className="text-xs text-slate-200">{activePlacesLabel}</p>
        </div>
      )}
    </div>
  );
}

function updateFeatureStates(map: MapLibreMap, entries: Record<string, HexAggregated>) {
  for (const [hexId, info] of Object.entries(entries)) {
    const state = {
      value: info.value,
      n: info.n,
      hasData: info.hasData ? 1 : 0,
      passesFilter: info.passesFilter ? 1 : 0
    };
    try {
      map.setFeatureState({ source: H3_SOURCE_ID, sourceLayer: H3_POLYGON_LAYER, id: hexId }, state);
      map.setFeatureState({ source: H3_SOURCE_ID, sourceLayer: H3_CENTROID_LAYER, id: hexId }, state);
    } catch (error) {
      if (!featureStateWarningShown) {
        console.warn("Feature state update failed", error);
        featureStateWarningShown = true;
      }
    }
  }
}

function getOpacityExpression(hideNoData: boolean): maplibregl.ExpressionSpecification {
  return [
    "case",
    ["==", ["feature-state", "hasData"], 1],
    ["case", ["==", ["feature-state", "passesFilter"], 1], 0.8, 0.15],
    hideNoData ? 0 : 0.1
  ];
}
