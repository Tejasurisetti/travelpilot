import type {
  BackupOption,
  Day,
  OpeningHoursEntry,
  Trip,
  TripItem,
  TripItemType,
} from "./types";

const EARTH_RADIUS_KM = 6371;
const DEFAULT_TRAVEL_SPEED_KMH = 30;
const BUFFER_MINUTES = 15;
const ROUGH_LOCATION_KM = 5;

export type ConflictKind = "overlap" | "insufficient_travel_time";

export interface ScheduleConflict {
  kind: ConflictKind;
  itemIds: [string, string];
  startTime: string;
  endTime: string;
  message: string;
}

export interface BudgetBreakdown {
  daily: Record<string, number>;
  byCategory: Record<TripItemType, number>;
  total: number;
}

function minutesFromDateTime(value: string): number {
  const [date, time] = value.split("T");
  const [year, month, day] = date.split("-").map(Number);
  const [hours, minutes] = time.split(":").map(Number);
  return Date.UTC(year, month - 1, day, hours, minutes) / 60000;
}

function minutesFromTime(value: string): number {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function weekdayForDate(value: string): string {
  const [year, month, day] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", { weekday: "long", timeZone: "UTC" })
    .format(new Date(Date.UTC(year, month - 1, day)))
    .toLowerCase();
}

function haversineDistanceKm(first: TripItem, second: TripItem): number {
  const latitudeDelta = ((second.location.lat - first.location.lat) * Math.PI) / 180;
  const longitudeDelta = ((second.location.lng - first.location.lng) * Math.PI) / 180;
  const firstLatitude = (first.location.lat * Math.PI) / 180;
  const secondLatitude = (second.location.lat * Math.PI) / 180;
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(firstLatitude) * Math.cos(secondLatitude) * Math.sin(longitudeDelta / 2) ** 2;

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(haversine));
}

function estimatedTravelMinutes(first: TripItem, second: TripItem): number {
  return Math.ceil((haversineDistanceKm(first, second) / DEFAULT_TRAVEL_SPEED_KMH) * 60);
}

function openingStart(item: TripItem): number {
  const openingEntry = item.openingHours?.find(
    (entry: OpeningHoursEntry) =>
      entry.day === weekdayForDate(item.startTime.slice(0, 10)) && !entry.closed,
  );

  return openingEntry?.open ? minutesFromTime(openingEntry.open) : minutesFromDateTime(item.startTime);
}

function compareItems(first: TripItem, second: TripItem): number {
  return (
    minutesFromDateTime(first.startTime) - minutesFromDateTime(second.startTime) ||
    first.id.localeCompare(second.id)
  );
}

/** Groups items into geographic clusters using the haversine distance. */
export function clusterByLocation(items: TripItem[], maxDistanceKm: number): TripItem[][] {
  if (maxDistanceKm < 0) {
    throw new Error("maxDistanceKm must be non-negative");
  }

  const clusters: TripItem[][] = [];
  for (const item of items) {
    const cluster = clusters.find((candidate) =>
      candidate.some((member) => haversineDistanceKm(member, item) <= maxDistanceKm),
    );

    if (cluster) {
      cluster.push(item);
    } else {
      clusters.push([item]);
    }
  }

  return clusters.map((cluster) => [...cluster].sort(compareItems));
}

/** Orders a cluster with opening hours first, then the shortest feasible travel leg. */
export function orderByHoursAndTravelTime(cluster: TripItem[]): TripItem[] {
  const remaining = [...cluster].sort(
    (first, second) => openingStart(first) - openingStart(second) || compareItems(first, second),
  );
  const ordered: TripItem[] = [];

  while (remaining.length > 0) {
    if (ordered.length === 0) {
      ordered.push(remaining.shift()!);
      continue;
    }

    const previous = ordered[ordered.length - 1];
    const previousEnd = minutesFromDateTime(previous.endTime);
    const feasible = remaining.filter((item) => {
      const requiredGap = estimatedTravelMinutes(previous, item) + BUFFER_MINUTES;
      return minutesFromDateTime(item.startTime) >= previousEnd + requiredGap;
    });
    const candidates = feasible.length > 0 ? feasible : remaining;

    candidates.sort(
      (first, second) =>
        estimatedTravelMinutes(previous, first) - estimatedTravelMinutes(previous, second) ||
        openingStart(first) - openingStart(second) ||
        compareItems(first, second),
    );
    const next = candidates[0];
    ordered.push(next);
    remaining.splice(remaining.indexOf(next), 1);
  }

  return ordered;
}

/** Finds overlaps and gaps that are too short for travel plus the standard buffer. */
export function detectConflicts(day: Day): ScheduleConflict[] {
  const ordered = [...day.items].sort(compareItems);
  const conflicts: ScheduleConflict[] = [];

  for (let index = 1; index < ordered.length; index += 1) {
    const previous = ordered[index - 1];
    const current = ordered[index];
    const previousEnd = minutesFromDateTime(previous.endTime);
    const currentStart = minutesFromDateTime(current.startTime);

    if (currentStart < previousEnd) {
      conflicts.push({
        kind: "overlap",
        itemIds: [previous.id, current.id],
        startTime: current.startTime,
        endTime: previous.endTime,
        message: `${current.name} overlaps ${previous.name}`,
      });
      continue;
    }

    const requiredGap = estimatedTravelMinutes(previous, current) + BUFFER_MINUTES;
    if (currentStart - previousEnd < requiredGap) {
      conflicts.push({
        kind: "insufficient_travel_time",
        itemIds: [previous.id, current.id],
        startTime: previous.endTime,
        endTime: current.startTime,
        message: `There is not enough time to travel from ${previous.name} to ${current.name}`,
      });
    }
  }

  return conflicts;
}

function replacementScore(
  backup: BackupOption,
  changedItem: TripItem,
): number | undefined {
  if (backup.type !== changedItem.type) {
    return undefined;
  }

  const cost = backup.estimatedCost ?? changedItem.cost;
  if (cost > changedItem.cost) {
    return undefined;
  }

  const distance = backup.location
    ? haversineDistanceKm(
        changedItem,
        { ...changedItem, location: backup.location },
      )
    : ROUGH_LOCATION_KM;
  if (distance > ROUGH_LOCATION_KM) {
    return undefined;
  }

  return distance * 100 + cost;
}

function makeReplacement(backup: BackupOption, changedItem: TripItem, reason: string): TripItem {
  return {
    id: backup.id,
    type: backup.type,
    name: backup.name,
    location: backup.location ?? changedItem.location,
    startTime: changedItem.startTime,
    endTime: changedItem.endTime,
    cost: backup.estimatedCost ?? changedItem.cost,
    status: "tentative",
    notes: `${reason}${backup.reason ? `; ${backup.reason}` : ""}`,
  };
}

/** Returns compatible backups ordered by location proximity, then cost and id. */
export function findAlternatives(
  changedItem: TripItem,
  backups: BackupOption[],
): BackupOption[] {
  return backups
    .map((backup) => ({ backup, score: replacementScore(backup, changedItem) }))
    .filter((candidate): candidate is { backup: BackupOption; score: number } => candidate.score !== undefined)
    .sort((first, second) => first.score - second.score || first.backup.id.localeCompare(second.backup.id))
    .map(({ backup }) => backup);
}

/** Flags the changed item, selects a compatible backup, then reorders the day. */
export function rebuildDay(
  day: Day,
  changedItemId: string,
  reason: string,
  backups: BackupOption[],
): Day {
  const changedItem = day.items.find((item: TripItem) => item.id === changedItemId);
  if (!changedItem) {
    return { ...day, items: [...day.items] };
  }

  const flaggedItem: TripItem = {
    ...changedItem,
    status: "cancelled",
    notes: [changedItem.notes, reason].filter(Boolean).join("; "),
  };
  const alternatives = findAlternatives(changedItem, backups);
  const replacement = alternatives[0]
    ? makeReplacement(alternatives[0], changedItem, reason)
    : undefined;
  const items = day.items.map((item: TripItem) =>
    item.id === changedItemId ? flaggedItem : item,
  );
  if (replacement) {
    items.push(replacement);
  }

  const clusters = clusterByLocation(items, ROUGH_LOCATION_KM);
  const orderedItems = clusters.flatMap(orderByHoursAndTravelTime);
  return { ...day, items: orderedItems };
}

/** Calculates daily, category, and total estimates, excluding cancelled items. */
export function calculateBudget(trip: Trip): BudgetBreakdown {
  const daily: Record<string, number> = {};
  const byCategory: Record<TripItemType, number> = {
    activity: 0,
    transport: 0,
    accommodation: 0,
  };

  for (const day of trip.days) {
    const amount = day.items.reduce((dayTotal: number, item: TripItem) => {
      if (item.status === "cancelled") {
        return dayTotal;
      }
      byCategory[item.type] += item.cost;
      return dayTotal + item.cost;
    }, 0);
    daily[day.date] = amount;
  }

  const total = Object.values(byCategory).reduce((sum, amount) => sum + amount, 0);
  return { daily, byCategory, total };
}

// Small manual sanity checks. These are data-only examples and do not run on import.
const exampleItem = (id: string, name: string, startTime: string, endTime: string): TripItem => ({
  id,
  type: "activity",
  name,
  location: { lat: 26.9239, lng: 75.8267 },
  startTime,
  endTime,
  cost: 20,
  status: "confirmed",
});

export const schedulerExamples = {
  clusters: clusterByLocation(
    [
      exampleItem("hawa-mahal", "Hawa Mahal", "2026-09-19T09:00", "2026-09-19T10:00"),
      exampleItem("city-palace", "City Palace", "2026-09-19T10:30", "2026-09-19T12:00"),
    ],
    1,
  ),
  conflicts: detectConflicts({
    date: "2026-09-19",
    items: [
      exampleItem("amber-fort", "Amber Fort", "2026-09-19T09:00", "2026-09-19T11:00"),
      exampleItem("jantar-mantar", "Jantar Mantar", "2026-09-19T10:30", "2026-09-19T12:00"),
    ],
  }),
  budget: calculateBudget({
    id: "example-trip",
    destination: "Jaipur",
    startDate: "2026-09-19",
    endDate: "2026-09-19",
    budget: 100,
    interests: [],
    preferences: {
      pace: "moderate",
      dietaryRestrictions: [],
      accessibilityNeeds: [],
      preferredTransportModes: [],
    },
    days: [
      {
        date: "2026-09-19",
        items: [exampleItem("city-palace", "City Palace", "2026-09-19T09:00", "2026-09-19T11:00")],
      },
    ],
    backups: [],
  }),
};