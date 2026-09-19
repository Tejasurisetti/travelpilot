import { z } from "zod";
import {
  AVAILABLE_DESTINATIONS,
  getCityDataset,
  type AccommodationOption,
  type PlaceCatalogItem,
} from "./indiaMockData";
import { clusterByLocation, orderByHoursAndTravelTime } from "./scheduler";
import {
  TripPreferencesSchema,
  TripSchema,
  type Day,
  type OpeningHours,
  type Trip,
  type TripItem,
} from "./types";

export interface PlanConstraints {
  destination: string;
  startDate: string;
  endDate: string;
  budget: number;
  interests: string[];
  preferences?: z.infer<typeof TripPreferencesSchema>;
}

const MINUTES_PER_DAY = 24 * 60;
const ACTIVITIES_PER_DAY = 3;
const DEFAULT_START_MINUTES = 9 * 60;
const WEEKDAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

type Weekday = (typeof WEEKDAYS)[number];

function dateRange(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const current = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);
  while (current <= end) {
    dates.push(current.toISOString().slice(0, 10));
    current.setUTCDate(current.getUTCDate() + 1);
  }
  return dates;
}

function weekdayForDate(date: string): Weekday {
  const [year, month, day] = date.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", { weekday: "long", timeZone: "UTC" })
    .format(new Date(Date.UTC(year, month - 1, day)))
    .toLowerCase() as Weekday;
}

function minutesFromTime(value: string): number {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function dateTime(date: string, minutes: number): string {
  const hours = Math.floor(minutes / 60) % 24;
  const minute = minutes % 60;
  return `${date}T${String(hours).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function openingHoursForItem(value: string): OpeningHours {
  if (value === "24hours") {
    return WEEKDAYS.map((day) => ({ day, open: "00:00", close: "23:59", closed: false }));
  }

  const slots = value.split(",").map((slot) => slot.split("-"));
  const open = slots[0]?.[0] ?? "09:00";
  const close = slots.at(-1)?.[1] ?? "17:00";
  return WEEKDAYS.map((day) => ({ day, open, close, closed: false }));
}

function openingMinutes(place: PlaceCatalogItem): number {
  if (place.openingHours === "24hours") return 0;
  return minutesFromTime(place.openingHours.split(",")[0].split("-")[0]);
}

function isOpenOnDate(place: PlaceCatalogItem, _date: string): boolean {
  return place.openingHours !== "";
}

function interestMatches(place: PlaceCatalogItem, interests: string[]): boolean {
  if (interests.length === 0) return true;
  const searchableText = `${place.name} ${place.category} ${place.notes}`.toLowerCase();
  return interests.some((interest) => searchableText.includes(interest.toLowerCase().trim()));
}

function buildActivityItem(place: PlaceCatalogItem, date: string, index: number): TripItem {
  const startMinutes = Math.max(
    DEFAULT_START_MINUTES + index * 180,
    openingMinutes(place) || DEFAULT_START_MINUTES,
  );
  const endMinutes = Math.min(startMinutes + place.visitDurationMinutes, MINUTES_PER_DAY - 1);
  return {
    id: `${date}-${place.id}`,
    type: "activity",
    name: place.name,
    location: place.location,
    startTime: dateTime(date, startMinutes),
    endTime: dateTime(date, Math.max(startMinutes, endMinutes)),
    cost: place.cost,
    status: "tentative",
    openingHours: openingHoursForItem(place.openingHours),
    notes: `${place.category}; ${place.notes}`,
  };
}

function buildAccommodationItem(
  accommodation: AccommodationOption,
  startDate: string,
  nights: number,
): TripItem {
  return {
    id: `accommodation-${accommodation.id}`,
    type: "accommodation",
    name: accommodation.name,
    location: accommodation.location,
    startTime: dateTime(startDate, 15 * 60),
    endTime: dateTime(startDate, 16 * 60),
    cost: accommodation.costPerNight * nights,
    status: "tentative",
    notes: `${accommodation.tier}; ${accommodation.notes}; ${nights} night(s)`,
  };
}

function buildDay(date: string, places: PlaceCatalogItem[]): Day {
  const initialItems = places.map((place, index) => buildActivityItem(place, date, index));
  const clusters = clusterByLocation(initialItems, 3);
  return { date, items: clusters.flatMap((cluster) => orderByHoursAndTravelTime(cluster)) };
}

function buildBackups(places: PlaceCatalogItem[], selectedIds: Set<string>) {
  return places
    .filter((place) => !selectedIds.has(place.id))
    .slice(0, 8)
    .map((place) => ({
      id: `backup-${place.id}`,
      type: "activity" as const,
      name: place.name,
      location: place.location,
      estimatedCost: place.cost,
      reason: `Backup ${place.category} option in the ${place.cluster} cluster`,
    }));
}

export function generateTrip(constraints: PlanConstraints): Trip {
  const cityDataset = getCityDataset(constraints.destination);
  if (!cityDataset) {
    throw new Error(
      `Unsupported destination "${constraints.destination}". Choose one of: ${AVAILABLE_DESTINATIONS.join(", ")}`,
    );
  }

  const dates = dateRange(constraints.startDate, constraints.endDate);
  const nights = Math.max(1, dates.length - 1);
  const accommodation = [...cityDataset.accommodation].sort(
    (first, second) => first.costPerNight - second.costPerNight,
  )[0];
  const dailyActivityBudget = Math.max(
    0,
    constraints.budget / dates.length - accommodation.costPerNight,
  );
  const matchesBudgetAndHours = (place: PlaceCatalogItem) =>
    place.cost <= dailyActivityBudget && dates.some((date) => isOpenOnDate(place, date));
  const matchingPlaces = cityDataset.places.filter(
    (place) => interestMatches(place, constraints.interests) && matchesBudgetAndHours(place),
  );
  const fallbackPlaces = cityDataset.places.filter(matchesBudgetAndHours);
  const availablePlaces = matchingPlaces.length > 0 ? matchingPlaces : fallbackPlaces;
  const selectedPlaces = availablePlaces.slice(0, dates.length * ACTIVITIES_PER_DAY);
  const selectedIds = new Set(selectedPlaces.map((place) => place.id));
  const days = dates.map((date, dayIndex) =>
    buildDay(
      date,
      selectedPlaces.slice(dayIndex * ACTIVITIES_PER_DAY, (dayIndex + 1) * ACTIVITIES_PER_DAY),
    ),
  );

  if (days.length > 0) {
    days[0].items.push(buildAccommodationItem(accommodation, constraints.startDate, nights));
  }

  return TripSchema.parse({
    id: `trip-${cityDataset.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${constraints.startDate}`,
    destination: cityDataset.name,
    startDate: constraints.startDate,
    endDate: constraints.endDate,
    budget: constraints.budget,
    interests: constraints.interests,
    preferences: constraints.preferences ?? TripPreferencesSchema.parse({}),
    days,
    backups: buildBackups(availablePlaces, selectedIds),
  });
}
