/**
 * src/lib/types.ts
 *
 * Single source of truth for TravelPilot's domain model.
 *
 * Every shape used across the app (API routes, Claude tool-call schemas,
 * deterministic scheduling/conflict logic, and UI components) is defined
 * here as a Zod schema, with the TypeScript type inferred from it via
 * `z.infer`. This guarantees that:
 *   - Runtime validation (e.g. parsing LLM tool-call arguments, API bodies,
 *     or persisted trip state) and compile-time types can never drift apart.
 *   - Claude's tool schemas can be built directly from these Zod objects
 *     (e.g. with a zod-to-json-schema adapter) so the model always sees
 *     the same contract the server enforces.
 *
 * Design notes:
 *   - Dates/times are stored as local ISO 8601 strings WITHOUT a UTC
 *     offset (e.g. "2025-06-14" / "2025-06-14T09:00"). Trips are reasoned
 *     about in the destination's local wall-clock time (opening hours,
 *     schedules, "tomorrow morning", etc. are all local concepts), so we
 *     deliberately avoid timezone-offset math here. If multi-timezone
 *     support is ever needed, convert at the edges (display/booking
 *     integrations), not in the core model.
 *   - `.default(...)` is used for collections/optional structures so that
 *     partial input (e.g. a freshly-created trip, or an LLM tool call that
 *     omits an empty list) still parses cleanly.
 */

import { z } from "zod";

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------

/** ISO 8601 calendar date, no time component: "YYYY-MM-DD". */
export const IsoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in ISO 8601 format (YYYY-MM-DD)");
export type IsoDate = z.infer<typeof IsoDateSchema>;

/**
 * ISO 8601 local date-time, no timezone offset: "YYYY-MM-DDTHH:mm" or
 * "YYYY-MM-DDTHH:mm:ss". Always interpreted in the destination's local time.
 */
export const IsoDateTimeSchema = z
  .string()
  .regex(
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/,
    "Datetime must be in ISO 8601 local format (YYYY-MM-DDTHH:mm[:ss])",
  );
export type IsoDateTime = z.infer<typeof IsoDateTimeSchema>;

/** 24-hour clock time only: "HH:mm". Used for recurring opening hours. */
export const TimeOfDaySchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Time must be in 24-hour HH:mm format");
export type TimeOfDay = z.infer<typeof TimeOfDaySchema>;

/** Geographic coordinate used for distance/travel-time calculations. */
export const LocationSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});
export type Location = z.infer<typeof LocationSchema>;

/** Day of the week, used to key recurring opening-hours entries. */
export const WeekdaySchema = z.enum([
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
]);
export type Weekday = z.infer<typeof WeekdaySchema>;

/**
 * A single recurring opening-hours rule for one weekday. If `closed` is
 * true, `open`/`close` are omitted. Modeled as an array of entries (rather
 * than a keyed record) so the deterministic scheduling code can simply
 * iterate and find the entry matching a given item's weekday.
 */
export const OpeningHoursEntrySchema = z
  .object({
    day: WeekdaySchema,
    open: TimeOfDaySchema.optional(),
    close: TimeOfDaySchema.optional(),
    closed: z.boolean().default(false),
  })
  .refine((entry) => entry.closed || (entry.open !== undefined && entry.close !== undefined), {
    message: "open and close are required unless the entry is marked closed",
    path: ["open"],
  });
export type OpeningHoursEntry = z.infer<typeof OpeningHoursEntrySchema>;

/** Full recurring weekly opening-hours schedule for a place. */
export const OpeningHoursSchema = z.array(OpeningHoursEntrySchema);
export type OpeningHours = z.infer<typeof OpeningHoursSchema>;

// ---------------------------------------------------------------------------
// TripItem
// ---------------------------------------------------------------------------

/** Category of a scheduled itinerary item. */
export const TripItemTypeSchema = z.enum(["activity", "transport", "accommodation"]);
export type TripItemType = z.infer<typeof TripItemTypeSchema>;

/** Lifecycle status of a scheduled itinerary item. */
export const TripItemStatusSchema = z.enum(["confirmed", "tentative", "cancelled"]);
export type TripItemStatus = z.infer<typeof TripItemStatusSchema>;

/**
 * A single scheduled thing in the itinerary: an activity, a transport leg,
 * or an accommodation stay. This is the atomic unit that the deterministic
 * scheduling/conflict-detection functions operate on.
 */
export const TripItemSchema = z
  .object({
    /** Stable unique id, used to reference this item from backups/diffs. */
    id: z.string().min(1),
    type: TripItemTypeSchema,
    name: z.string().min(1),
    /** Coordinates used for travel-time and "close to my hotel" queries. */
    location: LocationSchema,
    /** Local start date-time, e.g. "2025-06-14T09:00". */
    startTime: IsoDateTimeSchema,
    /** Local end date-time, must not be before startTime. */
    endTime: IsoDateTimeSchema,
    /** Estimated or actual cost of this item, in the trip's budget currency. */
    cost: z.number().nonnegative(),
    status: TripItemStatusSchema.default("tentative"),
    /** Recurring weekly opening hours, if applicable (e.g. venues, not transport legs). */
    openingHours: OpeningHoursSchema.optional(),
    /** Free-form notes (booking references, reminders, context for the agent). */
    notes: z.string().optional(),
  })
  .refine((item) => item.endTime >= item.startTime, {
    message: "endTime must be the same as or after startTime",
    path: ["endTime"],
  });
export type TripItem = z.infer<typeof TripItemSchema>;

// ---------------------------------------------------------------------------
// Day
// ---------------------------------------------------------------------------

/** One calendar day of the trip, holding every item scheduled on it. */
export const DaySchema = z.object({
  date: IsoDateSchema,
  items: z.array(TripItemSchema).default([]),
});
export type Day = z.infer<typeof DaySchema>;

// ---------------------------------------------------------------------------
// Preferences
// ---------------------------------------------------------------------------

/** How densely activities should be packed into each day. */
export const PaceSchema = z.enum(["relaxed", "moderate", "packed"]);
export type Pace = z.infer<typeof PaceSchema>;

/**
 * Traveler preferences that steer itinerary generation and rebuilding
 * beyond raw interests/budget (e.g. accessibility, dietary needs, how
 * they like to get around).
 */
export const TripPreferencesSchema = z.object({
  pace: PaceSchema.default("moderate"),
  dietaryRestrictions: z.array(z.string()).default([]),
  accessibilityNeeds: z.array(z.string()).default([]),
  /** e.g. "walking", "public_transit", "taxi", "rideshare". */
  preferredTransportModes: z.array(z.string()).default([]),
  /** Any other free-form guidance the agent should factor in. */
  notes: z.string().optional(),
});
export type TripPreferences = z.infer<typeof TripPreferencesSchema>;

// ---------------------------------------------------------------------------
// Backups
// ---------------------------------------------------------------------------

/**
 * An alternative option kept on hand for a trip item, surfaced when that
 * item becomes unavailable (cancelled, closed, double-booked, etc.) or
 * proactively suggested by the agent as a fallback.
 */
export const BackupOptionSchema = z.object({
  id: z.string().min(1),
  /** The TripItem id this is a substitute for, if it replaces something specific. */
  replacesItemId: z.string().optional(),
  type: TripItemTypeSchema,
  name: z.string().min(1),
  location: LocationSchema.optional(),
  estimatedCost: z.number().nonnegative().optional(),
  /** Why the agent suggests this, e.g. "Closer to hotel", "Similar price, open later". */
  reason: z.string().optional(),
});
export type BackupOption = z.infer<typeof BackupOptionSchema>;

// ---------------------------------------------------------------------------
// Trip
// ---------------------------------------------------------------------------

/**
 * The full trip: constraints the user provided, plus the day-by-day
 * itinerary the agent has built and the backup options it holds in
 * reserve. This is the object persisted between requests and re-derived
 * whenever the agent rebuilds part of the plan.
 */
export const TripSchema = z
  .object({
    /** Stable unique id, needed to persist/retrieve/update the trip across requests. */
    id: z.string().min(1),
    destination: z.string().min(1),
    startDate: IsoDateSchema,
    endDate: IsoDateSchema,
    /** Total trip budget, in the same currency used for all `cost` fields. */
    budget: z.number().nonnegative(),
    interests: z.array(z.string()).default([]),
    preferences: TripPreferencesSchema.default({
      pace: "moderate",
      dietaryRestrictions: [],
      accessibilityNeeds: [],
      preferredTransportModes: [],
    }),
    days: z.array(DaySchema).default([]),
    backups: z.array(BackupOptionSchema).default([]),
  })
  .refine((trip) => trip.endDate >= trip.startDate, {
    message: "endDate must be the same as or after startDate",
    path: ["endDate"],
  });
export type Trip = z.infer<typeof TripSchema>;
