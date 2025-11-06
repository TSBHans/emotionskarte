"use client";

import { Fragment } from "react";
import type { ClickedHexData, Metric, SelectionState, SidebarTab } from "@/types";
import { METRIC_LABELS, METRICS_BY_TAB, PLACE_LABELS } from "@/lib/constants";
import clsx from "clsx";

interface SidebarProps {
  selection: SelectionState;
  onSelectionChange: (next: Partial<SelectionState>) => void;
  onTabChange: (tab: SidebarTab) => void;
  clickedHex?: ClickedHexData | null;
  loading: boolean;
  error?: string | null;
}

export function Sidebar({
  selection,
  onSelectionChange,
  onTabChange,
  clickedHex,
  loading,
  error,
}: SidebarProps) {
  const metricOptions =
    selection.tab === "daten"
      ? ([] as Metric[])
      : METRICS_BY_TAB[selection.tab === "emotionen" ? "emotionen" : "umwelt"];

  return (
    <aside className="relative z-10 flex h-full w-full max-w-[420px] flex-col overflow-hidden bg-slate-950/85 backdrop-blur">
      <div className="flex flex-col gap-6 border-b border-white/10 p-6">
        <div>
          <h1 className="text-2xl font-semibold">Deine Emotionale Stadt</h1>
          <p className="mt-2 text-sm text-slate-300">
            Entdecke Emotionen und Umweltwahrnehmungen in Berlin. Nutze die Filter, um
            Muster im Stadtraum sichtbar zu machen.
          </p>
        </div>
        <div className="flex gap-2">
          <TabButton
            tab="emotionen"
            label="Emotionen"
            active={selection.tab === "emotionen"}
            onClick={() => onTabChange("emotionen")}
          />
          <TabButton
            tab="umwelt"
            label="Umweltwahrnehmung"
            active={selection.tab === "umwelt"}
            onClick={() => onTabChange("umwelt")}
          />
          <TabButton
            tab="daten"
            label="Daten"
            active={selection.tab === "daten"}
            onClick={() => onTabChange("daten")}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {selection.tab === "daten" ? (
          <DataTab />
        ) : (
          <div className="space-y-8">
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                Kennzahl
              </h2>
              <div className="mt-3 grid grid-cols-1 gap-2">
                {metricOptions.map((metric) => (
                  <button
                    key={metric}
                    onClick={() => onSelectionChange({ metric })}
                    className={clsx(
                      "flex items-center justify-between rounded-2xl border px-4 py-3 text-left transition",
                      selection.metric === metric
                        ? "border-primary-300 bg-white/5"
                        : "border-white/10 bg-transparent hover:border-primary-100/60 hover:bg-white/5"
                    )}
                  >
                    <span className="text-base font-medium">
                      {METRIC_LABELS[metric]}
                    </span>
                  </button>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                Orte
              </h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {Object.entries(PLACE_LABELS).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => togglePlace(selection, key as keyof typeof PLACE_LABELS, onSelectionChange)}
                    className={clsx(
                      "rounded-full border px-4 py-2 text-sm font-medium transition",
                      selection.places.includes(key as any)
                        ? "border-primary-200 bg-primary-200/10 text-white"
                        : "border-white/10 bg-white/5 text-slate-200 hover:border-primary-100/60"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </section>

            <section className="grid gap-6">
              <div>
                <label className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                  Wertebereich
                </label>
                <div className="mt-3 space-y-4">
                  <RangeInput
                    label="Minimum"
                    value={selection.minValue}
                    min={1}
                    max={5}
                    step={0.5}
                    onChange={(value) =>
                      onSelectionChange({ minValue: Math.min(value, selection.maxValue) })
                    }
                  />
                  <RangeInput
                    label="Maximum"
                    value={selection.maxValue}
                    min={1}
                    max={5}
                    step={0.5}
                    onChange={(value) =>
                      onSelectionChange({ maxValue: Math.max(value, selection.minValue) })
                    }
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                  Mindestanzahl Teilnehmende
                </label>
                <RangeInput
                  className="mt-3"
                  label={`Mindestens ${selection.minParticipants}`}
                  value={selection.minParticipants}
                  min={0}
                  max={50}
                  step={1}
                  onChange={(value) => onSelectionChange({ minParticipants: value })}
                />
              </div>

              <label className="flex items-center gap-3 text-sm text-slate-200">
                <input
                  type="checkbox"
                  checked={selection.hideNoData}
                  onChange={(event) =>
                    onSelectionChange({ hideNoData: event.currentTarget.checked })
                  }
                  className="h-4 w-4 rounded border-white/30 bg-slate-900 text-primary-300 focus:ring-primary-200"
                />
                Bereiche ohne Daten ausblenden
              </label>
            </section>
          </div>
        )}
      </div>

      <div className="border-t border-white/10 p-6 text-sm text-slate-300">
        {loading && <p>Daten werden geladen…</p>}
        {error && <p className="text-red-300">{error}</p>}
        {clickedHex && !loading && (
          <ClickedHexCard clickedHex={clickedHex} selection={selection} />
        )}
      </div>
    </aside>
  );
}

interface RangeInputProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  className?: string;
  onChange: (value: number) => void;
}

function RangeInput({ label, value, min, max, step, onChange, className }: RangeInputProps) {
  return (
    <div className={clsx("flex flex-col gap-2", className)}>
      <div className="flex items-center justify-between text-sm text-slate-300">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-1 w-full cursor-pointer appearance-none rounded-full bg-white/10"
      />
    </div>
  );
}

interface TabButtonProps {
  tab: SidebarTab;
  label: string;
  active: boolean;
  onClick: () => void;
}

function TabButton({ label, active, onClick }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "flex-1 rounded-full border px-4 py-2 text-sm font-medium transition",
        active
          ? "border-primary-200 bg-primary-200/20 text-white"
          : "border-white/10 bg-white/5 text-slate-300 hover:border-primary-100/50"
      )}
    >
      {label}
    </button>
  );
}

function togglePlace(
  selection: SelectionState,
  place: keyof typeof PLACE_LABELS,
  onSelectionChange: (next: Partial<SelectionState>) => void
) {
  const nextPlaces = selection.places.includes(place as any)
    ? selection.places.filter((p) => p !== place)
    : [...selection.places, place];
  if (nextPlaces.length === 0) {
    return;
  }
  onSelectionChange({ places: nextPlaces as SelectionState["places"] });
}

function ClickedHexCard({
  clickedHex,
  selection,
}: {
  clickedHex: ClickedHexData;
  selection: SelectionState;
}) {
  return (
    <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">Hexagon {clickedHex.hexId}</h3>
        <span className="text-xs uppercase tracking-widest text-slate-400">
          {METRIC_LABELS[selection.metric]}
        </span>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span>Durchschnitt</span>
        <span>{clickedHex.aggregate.value?.toFixed(2) ?? "n/a"}</span>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span>Teilnehmende</span>
        <span>{clickedHex.aggregate.n}</span>
      </div>
      <div className="mt-2 space-y-1 text-xs text-slate-300">
        {Object.entries(clickedHex.byPlace).map(([key, item]) => (
          <Fragment key={key}>
            <div className="flex items-center justify-between">
              <span>{PLACE_LABELS[key as keyof typeof PLACE_LABELS]}</span>
              <span>{item.value !== null ? item.value.toFixed(2) : "n/a"}</span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Anzahl</span>
              <span>{item.n ?? 0}</span>
            </div>
          </Fragment>
        ))}
      </div>
    </div>
  );
}

function DataTab() {
  return (
    <div className="space-y-6 text-sm leading-relaxed text-slate-200">
      <section>
        <h2 className="text-lg font-semibold text-white">Über die Daten</h2>
        <p>
          Die Emotionale Stadt basiert auf einer Studie zur Wahrnehmung urbaner Räume
          in Berlin. Freiwillige teilten über eine App ihre Eindrücke zu verschiedenen
          Orten. Die Daten wurden anonymisiert und in hexagonale Räume aggregiert.
        </p>
      </section>
      <section>
        <h2 className="text-lg font-semibold text-white">Variablen &amp; Skalen</h2>
        <p>
          Alle Skalen reichen von 1 (niedrig) bis 5 (hoch). Die Umweltindikatoren
          spiegeln Schönheit, Sicherheit, Gedränge, Interessantheit und Grünanteil
          wider.
        </p>
      </section>
      <section>
        <h2 className="text-lg font-semibold text-white">Downloads</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <a href="/berlin_drinnen.csv" className="underline hover:text-white">
              berlin_drinnen.csv
            </a>
          </li>
          <li>
            <a href="/berlin_draussen.csv" className="underline hover:text-white">
              berlin_draussen.csv
            </a>
          </li>
          <li>
            <a href="/berlin_oepnv.csv" className="underline hover:text-white">
              berlin_oepnv.csv
            </a>
          </li>
          <li>
            <a
              href="/berlin-h3-res9.pmtiles/berlin-h3-res9.pmtiles"
              className="underline hover:text-white"
            >
              berlin-h3-res9.pmtiles
            </a>
          </li>
        </ul>
      </section>
      <section>
        <h2 className="text-lg font-semibold text-white">Methodik</h2>
        <p>
          Die Datenerhebung erfolgte mittels Standortabfragen und Fragebögen, die von
          Teilnehmenden unterwegs beantwortet wurden. Alle Werte wurden auf H3-
          Hexagone der Auflösung 9 aggregiert.
        </p>
      </section>
      <section>
        <h2 className="text-lg font-semibold text-white">Datenschutz</h2>
        <p>
          Personenbezogene Angaben wurden nicht erhoben. Alle Datenpunkte sind
          vollständig anonymisiert.
        </p>
      </section>
      <section>
        <h2 className="text-lg font-semibold text-white">Lizenz &amp; Kontakt</h2>
        <p>
          Die Datensätze stehen unter CC BY 4.0. Fragen? Schreibe uns an
          <a href="mailto:info@citylab-berlin.org" className="ml-1 underline">
            info@citylab-berlin.org
          </a>
          .
        </p>
      </section>
    </div>
  );
}
