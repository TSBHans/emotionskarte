"use client";

import { useCallback, useMemo, useState } from "react";
import { IntroModal } from "@/components/IntroModal";
import { Sidebar } from "@/components/Sidebar";
import { MapView } from "@/components/MapView";
import { Legend } from "@/components/Legend";
import { Tooltip } from "@/components/Tooltip";
import {
  DEFAULT_SELECTION,
  METRICS_BY_TAB,
  PLACE_LABELS,
} from "@/lib/constants";
import { loadAllData } from "@/lib/data";
import type {
  ClickedHexData,
  HexData,
  SelectionState,
  SidebarTab,
  TooltipData,
} from "@/types";
import { useEffectOnce } from "@/lib/use-effect-once";

export default function HomePage() {
  const [selection, setSelection] = useState<SelectionState>(DEFAULT_SELECTION);
  const [hexData, setHexData] = useState<HexData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const [clickedHex, setClickedHex] = useState<ClickedHexData | null>(null);
  const [showIntro, setShowIntro] = useState(true);
  const [tilesError, setTilesError] = useState<string | null>(null);
  const [mapResetKey, setMapResetKey] = useState(0);

  useEffectOnce(() => {
    loadAllData()
      .then((data) => {
        setHexData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError("Daten konnten nicht geladen werden.");
        setLoading(false);
      });
  });

  const handleSelectionChange = useCallback((next: Partial<SelectionState>) => {
    setSelection((prev) => ({ ...prev, ...next }));
  }, []);

  const handleTabChange = useCallback((tab: SidebarTab) => {
    setSelection((prev) => {
      if (tab === "daten") {
        return { ...prev, tab };
      }
      const metrics = METRICS_BY_TAB[tab === "emotionen" ? "emotionen" : "umwelt"];
      const metric = metrics.includes(prev.metric) ? prev.metric : metrics[0];
      return { ...prev, tab, metric };
    });
  }, []);

  const placesLabel = useMemo(
    () => selection.places.map((place) => PLACE_LABELS[place]).join(" · "),
    [selection.places]
  );

  const handleRetryTiles = () => {
    setTilesError(null);
    setMapResetKey((key) => key + 1);
  };

  return (
    <div className="relative flex h-screen w-screen overflow-hidden bg-slate-950">
      <Sidebar
        selection={selection}
        onSelectionChange={handleSelectionChange}
        onTabChange={handleTabChange}
        clickedHex={clickedHex}
        loading={loading}
        error={error ?? undefined}
      />
      <div className="relative h-full flex-1">
        <MapView
          key={mapResetKey}
          data={hexData}
          selection={selection}
          onTooltip={setTooltip}
          onHexClick={setClickedHex}
          onTilesError={setTilesError}
        />
        <Legend />
        <Tooltip tooltip={tooltip} />
        {selection.tab !== "daten" && (
          <div className="pointer-events-none absolute left-6 top-6 z-10 rounded-full bg-black/40 px-4 py-2 text-xs uppercase tracking-widest text-slate-200">
            {placesLabel}
          </div>
        )}
        {tilesError && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/70">
            <div className="rounded-3xl border border-white/10 bg-slate-900/90 p-8 text-center text-slate-200 shadow-2xl">
              <p className="text-base">{tilesError}</p>
              <button
                onClick={handleRetryTiles}
                className="mt-5 inline-flex items-center justify-center rounded-full bg-primary-300 px-5 py-2 text-sm font-semibold text-slate-900 transition hover:bg-primary-400"
              >
                Erneut versuchen
              </button>
            </div>
          </div>
        )}
      </div>
      {showIntro && <IntroModal onClose={() => setShowIntro(false)} />}
    </div>
  );
}
