"use client";

import { COLOR_RAMP } from "@/lib/constants";

const SIZE_STOPS: [number, number][] = [
  [5, 4],
  [10, 8],
  [25, 14],
  [50, 18],
];

export function Legend() {
  return (
    <div className="pointer-events-none absolute bottom-6 right-6 z-20 w-72 rounded-3xl border border-white/10 bg-slate-950/90 p-4 text-sm text-slate-200 shadow-lg">
      <div>
        <h3 className="text-base font-semibold text-white">Werteskala</h3>
        <div className="mt-3 h-3 w-full overflow-hidden rounded-full">
          <div className="flex h-full">
            {COLOR_RAMP.map(([_, color]) => (
              <div key={color} className="h-full flex-1" style={{ backgroundColor: color }} />
            ))}
          </div>
        </div>
        <div className="mt-2 flex justify-between text-xs text-slate-400">
          <span>1</span>
          <span>3</span>
          <span>5</span>
        </div>
      </div>
      <div className="mt-5">
        <h3 className="text-base font-semibold text-white">Teilnehmende</h3>
        <div className="mt-3 flex items-end gap-5">
          {SIZE_STOPS.map(([value, size]) => (
            <div key={value} className="flex flex-col items-center gap-2">
              <span className="text-xs text-slate-400">{value}</span>
              <div
                className="rounded-full border border-white/20 bg-primary-200/20"
                style={{ width: size, height: size }}
              />
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
          <span className="inline-block h-3 w-3 rounded-full bg-white/40" />
          <span>Keine Daten</span>
        </div>
      </div>
    </div>
  );
}
