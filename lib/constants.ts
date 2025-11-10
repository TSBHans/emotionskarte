import type { Metric, MetricGroupKey, Place } from "./types";

export const METRIC_GROUPS: Record<Exclude<MetricGroupKey, "daten">, Metric[]> = {
  emotionen: ["Stress", "Happy", "Loneliness", "Anxiety", "Energy"],
  umwelt: [
    "EnvBeauty",
    "EnvInteresting",
    "EnvSafety",
    "EnvCrowded",
    "EnvironmentGreeness"
  ]
};

export const PLACE_LABELS: Record<Place, string> = {
  drinnen: "Drinnen",
  draussen: "Draußen",
  oepnv: "ÖPNV"
};

export const METRIC_LABELS: Record<Metric, string> = {
  Stress: "Stress",
  Happy: "Glücklichsein",
  Loneliness: "Einsamkeit",
  Anxiety: "Angst",
  Energy: "Energie",
  EnvBeauty: "Umwelt: Schönheit",
  EnvInteresting: "Umwelt: Interessant",
  EnvSafety: "Umwelt: Sicherheit",
  EnvCrowded: "Umwelt: Andrang",
  EnvironmentGreeness: "Umwelt: Grünflächen"
};

export const DEFAULT_METRIC: Metric = "Happy";

export const PMTILES_BASE_PATH = "pmtiles:///berlin-h3-res9.pmtiles/berlin-h3-res9.pmtiles";
export const H3_SOURCE_ID = "h3";
export const H3_POLYGON_LAYER = "h3";
export const H3_CENTROID_LAYER = "h3_centroids";

export const MAP_INITIAL_VIEW = {
  center: [13.404954, 52.520008] as [number, number],
  zoom: 10
};

export const COLOR_RAMP: { value: number; color: string }[] = [
  { value: 1, color: "#e6f7f7" },
  { value: 2, color: "#9de1e0" },
  { value: 3, color: "#52c7c4" },
  { value: 4, color: "#19b3ab" },
  { value: 5, color: "#009a92" }
];
