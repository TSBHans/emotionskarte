"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { PMTiles, Protocol } from "pmtiles";
import type {
  ClickedHexData,
  HexData,
  SelectionState,
  TooltipData,
} from "@/types";
import {
  COLOR_RAMP,
  H3_CENTROID_LAYER,
  H3_HEX_LAYER,
  H3_SOURCE_NAME,
  PLACE_LABELS,
  PMTILES_ARCHIVE,
  PMTILES_ARCHIVE_PATH,
} from "@/lib/constants";
import { aggregateHex } from "@/lib/data";
import { useDebouncedValue } from "@/lib/hooks";

const INITIAL_VIEW: [number, number, number] = [13.404954, 52.520008, 10];

let protocol: Protocol | null = null;

function ensureProtocol() {
  if (!protocol) {
    protocol = new Protocol();
    maplibregl.addProtocol("pmtiles", protocol.tile);
  }
  return protocol;
}

interface MapViewProps {
  data: HexData | null;
  selection: SelectionState;
  onTooltip: (tooltip: TooltipData | null) => void;
  onHexClick: (hex: ClickedHexData | null) => void;
  onTilesError: (message: string | null) => void;
}

export function MapView({
  data,
  selection,
  onTooltip,
  onHexClick,
  onTilesError,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const debouncedSelection = useDebouncedValue(selection, 150);
  const hoverTimeout = useRef<number | null>(null);
  const dataRef = useRef<HexData | null>(null);
  const selectionRef = useRef(selection);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  useEffect(() => {
    selectionRef.current = selection;
  }, [selection]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
      center: [INITIAL_VIEW[0], INITIAL_VIEW[1]],
      zoom: INITIAL_VIEW[2],
      attributionControl: false,
    });

    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "top-left");
    map.addControl(new maplibregl.AttributionControl({ compact: true }));

    map.on("error", (event) => {
      if (event?.sourceId === H3_SOURCE_NAME || event?.error?.status === 404) {
        onTilesError("Vektorkacheln konnten nicht geladen werden.");
      }
    });

    map.on("load", () => {
      const proto = ensureProtocol();
      proto.add(new PMTiles(`/${PMTILES_ARCHIVE_PATH}`));

      if (!map.getSource(H3_SOURCE_NAME)) {
        map.addSource(H3_SOURCE_NAME, {
          type: "vector",
          url: PMTILES_ARCHIVE,
        });
      }

      const colorExpression: any = [
        "case",
        ["==", ["feature-state", "value"], null],
        "rgba(176,176,176,0.3)",
        [
          "interpolate",
          ["linear"],
          ["feature-state", "value"],
          ...COLOR_RAMP.flat(),
        ],
      ];

      const opacityExpression: any = [
        "case",
        ["boolean", ["feature-state", "visible"], false],
        [
          "case",
          ["==", ["feature-state", "value"], null],
          0.18,
          0.8,
        ],
        0.02,
      ];

      if (!map.getLayer("h3-fill")) {
        map.addLayer({
          id: "h3-fill",
          type: "fill",
          source: H3_SOURCE_NAME,
          "source-layer": H3_HEX_LAYER,
          paint: {
            "fill-color": colorExpression,
            "fill-opacity": opacityExpression,
          },
        });
      }

      if (!map.getLayer("h3-outline")) {
        map.addLayer({
          id: "h3-outline",
          type: "line",
          source: H3_SOURCE_NAME,
          "source-layer": H3_HEX_LAYER,
          paint: {
            "line-color": "rgba(255,255,255,0.1)",
            "line-width": 0.5,
          },
        });
      }

      if (!map.getLayer("h3-centroids")) {
        map.addLayer({
          id: "h3-centroids",
          type: "circle",
          source: H3_SOURCE_NAME,
          "source-layer": H3_CENTROID_LAYER,
          paint: {
            "circle-color": colorExpression,
            "circle-opacity": [
              "case",
              ["boolean", ["feature-state", "visible"], false],
              1,
              0,
            ],
            "circle-radius": [
              "case",
              ["boolean", ["feature-state", "visible"], false],
              [
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
                18,
              ],
              0,
            ],
            "circle-stroke-width": 1,
            "circle-stroke-color": "rgba(0,0,0,0.4)",
          },
        });
      }

      map.on("mousemove", "h3-fill", (event) => {
        if (!event.features?.length) return;
        const feature = event.features[0];
        const hexId = (feature.id ?? feature.properties?.hex_id) as string;
        if (!hexId) return;

        if (hoverTimeout.current) {
          window.clearTimeout(hoverTimeout.current);
        }

        hoverTimeout.current = window.setTimeout(() => {
          const state = map.getFeatureState({
            source: H3_SOURCE_NAME,
            sourceLayer: H3_HEX_LAYER,
            id: hexId,
          }) as { value?: number | null; n?: number; visible?: boolean };

          const pageX = event.originalEvent?.pageX ?? event.point.x;
          const pageY = event.originalEvent?.pageY ?? event.point.y;

          onTooltip({
            hexId,
            value: state?.value ?? null,
            n: state?.n ?? 0,
            metric: selectionRef.current.metric,
            places: selectionRef.current.places,
            pageX,
            pageY,
          });
        }, 120);
      });

      map.on("mouseleave", "h3-fill", () => {
        if (hoverTimeout.current) {
          window.clearTimeout(hoverTimeout.current);
        }
        onTooltip(null);
        map.getCanvas().style.cursor = "";
      });

      map.on("mouseenter", "h3-fill", () => {
        map.getCanvas().style.cursor = "pointer";
      });

      map.on("click", "h3-fill", (event) => {
        const feature = event.features?.[0];
        if (!feature) return;
        const hexId = (feature.id ?? feature.properties?.hex_id) as string;
        const dataset = dataRef.current;
        if (!hexId || !dataset) return;
        const entry = dataset[hexId];
        if (!entry) return;

        const byPlace = Object.fromEntries(
          Object.keys(PLACE_LABELS).map((place) => {
            const metrics = entry[place as keyof typeof PLACE_LABELS];
            const currentSelection = selectionRef.current;
            return [
              place,
              {
                value: metrics?.metrics?.[currentSelection.metric] ?? null,
                n: metrics?.n ?? null,
              },
            ];
          })
        );

        const aggregateState = aggregateHex(selectionRef.current, dataset, hexId);
        onHexClick({
          hexId,
          byPlace: byPlace as ClickedHexData["byPlace"],
          aggregate: { value: aggregateState.value, n: aggregateState.n },
        });
      });

      map.on("click", (event) => {
        const features = map.queryRenderedFeatures(event.point, { layers: ["h3-fill"] });
        if (!features.length) {
          onHexClick(null);
        }
      });

      onTilesError(null);
      setMapLoaded(true);
    });

    mapRef.current = map;

    return () => {
      if (hoverTimeout.current) {
        window.clearTimeout(hoverTimeout.current);
      }
      map.remove();
      mapRef.current = null;
    };
  }, [onHexClick, onTilesError, onTooltip]);

  useEffect(() => {
    if (!mapRef.current || !mapLoaded || !data) return;
    const map = mapRef.current;
    const hexIds = Object.keys(data);

    hexIds.forEach((hexId) => {
      const state = aggregateHex(debouncedSelection, data, hexId);
      const baseState = {
        value: state.value,
        n: state.n,
        visible: state.visible,
      };

      map.setFeatureState(
        {
          source: H3_SOURCE_NAME,
          sourceLayer: H3_HEX_LAYER,
          id: hexId,
        },
        baseState
      );
      map.setFeatureState(
        {
          source: H3_SOURCE_NAME,
          sourceLayer: H3_CENTROID_LAYER,
          id: hexId,
        },
        baseState
      );
    });
  }, [data, debouncedSelection, mapLoaded]);

  const mapStyle = useMemo(
    () => ({
      background: "#0f172a",
    }),
    []
  );

  return <div ref={containerRef} className="relative h-full w-full" style={mapStyle} />;
}
