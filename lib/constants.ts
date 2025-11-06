import type { Metric, Place, SidebarTab } from "@/types";

export const METRIC_LABELS: Record<Metric, string> = {
  Stress: "Stress",
  Happy: "Glück",
  Loneliness: "Einsamkeit",
  Anxiety: "Angst",
  Energy: "Energie",
  EnvBeauty: "Schönheit",
  EnvInteresting: "Interessant",
  EnvSafety: "Sicherheit",
  EnvCrowded: "Gedränge",
  EnvironmentGreeness: "Grünanteil",
};

export const METRICS_BY_TAB: Record<Exclude<SidebarTab, "daten">, Metric[]> = {
  emotionen: ["Stress", "Happy", "Loneliness", "Anxiety", "Energy"],
  umwelt: [
    "EnvBeauty",
    "EnvInteresting",
    "EnvSafety",
    "EnvCrowded",
    "EnvironmentGreeness",
  ],
};

export const PLACE_LABELS: Record<Place, string> = {
  drinnen: "Drinnen",
  draussen: "Draußen",
  oepnv: "ÖPNV",
};

export const PLACE_FILES: Record<Place, string> = {
  drinnen: "/berlin_drinnen.csv",
  draussen: "/berlin_draussen.csv",
  oepnv: "/berlin_oepnv.csv",
};

export const PMTILES_ARCHIVE_PATH = "berlin-h3-res9.pmtiles/berlin-h3-res9.pmtiles";
export const PMTILES_ARCHIVE = `pmtiles:///${PMTILES_ARCHIVE_PATH}`;

export const H3_SOURCE_NAME = "h3";
export const H3_HEX_LAYER = "h3";
export const H3_CENTROID_LAYER = "h3_centroids";

export const COLOR_RAMP: [number, string][] = [
  [1, "#e6f7f7"],
  [2, "#9de1e0"],
  [3, "#52c7c4"],
  [4, "#19b3ab"],
  [5, "#009a92"],
];

export const DEFAULT_SELECTION: SelectionPreset = {
  tab: "emotionen",
  metric: "Energy",
  places: ["drinnen", "draussen", "oepnv"],
  minValue: 1,
  maxValue: 5,
  minParticipants: 1,
  hideNoData: false,
};

export interface SelectionPreset {
  tab: SidebarTab;
  metric: Metric;
  places: Place[];
  minValue: number;
  maxValue: number;
  minParticipants: number;
  hideNoData: boolean;
}
