export type Metric =
  | "Stress"
  | "Happy"
  | "Loneliness"
  | "Anxiety"
  | "Energy"
  | "EnvBeauty"
  | "EnvInteresting"
  | "EnvSafety"
  | "EnvCrowded"
  | "EnvironmentGreeness";

export type Place = "drinnen" | "draussen" | "oepnv";

export type HexPlaceMetrics = {
  metrics: Record<Metric, number | null>;
  n: number | null;
};

export type HexData = Record<string, Record<Place, HexPlaceMetrics>>;

export type SidebarTab = "emotionen" | "umwelt" | "daten";

export interface SelectionState {
  tab: SidebarTab;
  metric: Metric;
  places: Place[];
  minValue: number;
  maxValue: number;
  minParticipants: number;
  hideNoData: boolean;
}

export interface AggregatedHexState {
  value: number | null;
  n: number;
  hasData: boolean;
  visible: boolean;
}

export interface TooltipData {
  hexId: string;
  value: number | null;
  n: number;
  metric: Metric;
  places: Place[];
  pageX: number;
  pageY: number;
}

export interface ClickedHexData {
  hexId: string;
  byPlace: Record<Place, { value: number | null; n: number | null }>;
  aggregate: { value: number | null; n: number };
}
