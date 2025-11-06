import Papa from "papaparse";
import type {
  HexData,
  HexPlaceMetrics,
  Metric,
  Place,
  SelectionState,
  AggregatedHexState,
} from "@/types";
import { PLACE_FILES } from "./constants";

interface CsvRow {
  hex_id: string;
  DataPointCount: string;
  [key: string]: string;
}

export async function loadCsv(place: Place): Promise<Map<string, HexPlaceMetrics>> {
  const response = await fetch(PLACE_FILES[place]);
  if (!response.ok) {
    throw new Error(`CSV konnte nicht geladen werden: ${PLACE_FILES[place]}`);
  }

  const text = await response.text();

  return new Promise((resolve, reject) => {
    Papa.parse<CsvRow>(text, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        if (result.errors.length > 0) {
          reject(result.errors[0]);
          return;
        }
        const map = new Map<string, HexPlaceMetrics>();
        for (const row of result.data) {
          if (!row || !row.hex_id) continue;
          const metrics: Record<Metric, number | null> = {
            Stress: parseNullable(row.Stress),
            Happy: parseNullable(row.Happy),
            Loneliness: parseNullable(row.Loneliness),
            Anxiety: parseNullable(row.Anxiety),
            Energy: parseNullable(row.Energy),
            EnvBeauty: parseNullable(row.EnvBeauty),
            EnvInteresting: parseNullable(row.EnvInteresting),
            EnvSafety: parseNullable(row.EnvSafety),
            EnvCrowded: parseNullable(row.EnvCrowded),
            EnvironmentGreeness: parseNullable(row.EnvironmentGreeness),
          };
          const n = parseNullable(row.DataPointCount, true);
          map.set(row.hex_id, { metrics, n: n ?? null });
        }
        resolve(map);
      },
      error: (error) => reject(error),
    });
  });
}

function parseNullable(value?: string, isInt = false): number | null {
  if (value === undefined || value === null || value.trim() === "") return null;
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return null;
  return isInt ? Math.round(parsed) : parsed;
}

export async function loadAllData(): Promise<HexData> {
  const places: Place[] = ["drinnen", "draussen", "oepnv"];
  const datasets = await Promise.all(
    places.map(async (place) => {
      const map = await loadCsv(place);
      return [place, map] as const;
    })
  );

  const hexData: HexData = {};
  for (const [place, map] of datasets) {
    for (const [hexId, metrics] of map.entries()) {
      hexData[hexId] ||= {
        drinnen: emptyMetrics(),
        draussen: emptyMetrics(),
        oepnv: emptyMetrics(),
      };
      hexData[hexId][place] = metrics;
    }
  }

  return hexData;
}

function emptyMetrics(): HexPlaceMetrics {
  return {
    metrics: {
      Stress: null,
      Happy: null,
      Loneliness: null,
      Anxiety: null,
      Energy: null,
      EnvBeauty: null,
      EnvInteresting: null,
      EnvSafety: null,
      EnvCrowded: null,
      EnvironmentGreeness: null,
    },
    n: null,
  };
}

export function aggregateHex(
  selection: SelectionState,
  data: HexData,
  hexId: string
): AggregatedHexState {
  const entry = data[hexId];
  if (!entry) {
    return {
      value: null,
      n: 0,
      hasData: false,
      visible: false,
    };
  }
  let sum = 0;
  let count = 0;
  let participants = 0;
  for (const place of selection.places) {
    const metrics = entry[place];
    if (!metrics) continue;
    const value = metrics.metrics[selection.metric];
    if (value !== null && value !== undefined) {
      sum += value;
      count += 1;
    }
    if (typeof metrics.n === "number") {
      participants += metrics.n;
    }
  }
  const hasData = count > 0;
  const average = hasData ? sum / count : null;
  const meetsParticipants = participants >= selection.minParticipants;
  const inRange =
    average === null
      ? !selection.hideNoData
      : average >= selection.minValue && average <= selection.maxValue;

  return {
    value: average,
    n: participants,
    hasData,
    visible: hasData ? meetsParticipants && inRange : !selection.hideNoData,
  };
}

export function describeValue(value: number | null): string {
  if (value === null || Number.isNaN(value)) return "n/a";
  return value.toFixed(2);
}
