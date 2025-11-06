"use client";

import type { TooltipData } from "@/types";
import { METRIC_LABELS, PLACE_LABELS } from "@/lib/constants";

interface TooltipProps {
  tooltip: TooltipData | null;
}

export function Tooltip({ tooltip }: TooltipProps) {
  if (!tooltip) return null;

  return (
    <div
      className="pointer-events-none absolute z-30 w-64 rounded-2xl border border-white/20 bg-slate-950/95 p-4 text-sm text-slate-200 shadow-lg"
      style={{ left: tooltip.pageX + 16, top: tooltip.pageY + 16 }}
    >
      <h3 className="text-sm font-semibold text-white">Hexagon {tooltip.hexId}</h3>
      <p className="mt-2 text-xs text-slate-300">{METRIC_LABELS[tooltip.metric]}</p>
      <div className="mt-3 flex items-center justify-between text-sm text-white">
        <span>Wert</span>
        <span>{tooltip.value !== null ? tooltip.value.toFixed(2) : "n/a"}</span>
      </div>
      <div className="mt-1 flex items-center justify-between text-xs text-slate-400">
        <span>Teilnehmende</span>
        <span>{tooltip.n}</span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-[11px] uppercase tracking-widest text-primary-100">
        {tooltip.places.map((place) => (
          <span key={place}>{PLACE_LABELS[place]}</span>
        ))}
      </div>
    </div>
  );
}
