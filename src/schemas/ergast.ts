import { z } from 'zod';

// Location schema
export const LocationSchema = z.object({
  lat: z.string(),
  long: z.string(),
  locality: z.string(),
  country: z.string(),
});

// Circuit schema
export const CircuitSchema = z.object({
  circuitId: z.string(),
  url: z.string(),
  circuitName: z.string(),
  Location: LocationSchema,
});

// Driver schema
export const DriverSchema = z.object({
  driverId: z.string(),
  permanentNumber: z.string().optional(),
  code: z.string().optional(),
  url: z.string(),
  givenName: z.string(),
  familyName: z.string(),
  dateOfBirth: z.string(),
  nationality: z.string(),
});

// Constructor schema
export const ConstructorSchema = z.object({
  constructorId: z.string(),
  url: z.string(),
  name: z.string(),
  nationality: z.string(),
});

// Race schema
export const RaceSchema = z.object({
  season: z.string(),
  round: z.string(),
  url: z.string(),
  raceName: z.string(),
  Circuit: CircuitSchema,
  date: z.string(),
  time: z.string().optional(),
  Results: z.array(z.any()).optional(), // Will be defined separately
  Laps: z.array(z.any()).optional(),
  PitStops: z.array(z.any()).optional(),
});

// Season schema
export const SeasonSchema = z.object({
  season: z.string(),
  url: z.string(),
});

// Lap Time schema
export const LapTimeSchema = z.object({
  position: z.string(),
  time: z.string(),
});

// Lap schema
export const LapSchema = z.object({
  number: z.string(),
  Timings: z.array(z.object({
    driverId: z.string(),
    position: z.string(),
    time: z.string(),
  })),
});

// Driver Standing schema
export const DriverStandingSchema = z.object({
  position: z.string(),
  positionText: z.string(),
  points: z.string(),
  wins: z.string(),
  Driver: DriverSchema,
  Constructors: z.array(ConstructorSchema),
});

// Constructor Standing schema
export const ConstructorStandingSchema = z.object({
  position: z.string(),
  positionText: z.string(),
  points: z.string(),
  wins: z.string(),
  Constructor: ConstructorSchema,
});

// Pit Stop schema
export const PitStopSchema = z.object({
  driverId: z.string(),
  lap: z.string(),
  stop: z.string(),
  time: z.string(),
  duration: z.string(),
});

// Result schema
export const ResultSchema = z.object({
  number: z.string(),
  position: z.string().optional(),
  positionText: z.string(),
  points: z.string(),
  Driver: DriverSchema,
  Constructor: ConstructorSchema,
  grid: z.string(),
  laps: z.string(),
  status: z.string(),
  Time: z.object({
    millis: z.string().optional(),
    time: z.string().optional(),
  }).optional(),
  FastestLap: z.object({
    rank: z.string(),
    lap: z.string(),
    Time: z.object({
      time: z.string(),
    }),
    AverageSpeed: z.object({
      units: z.string(),
      speed: z.string(),
    }),
  }).optional(),
});

// Standings List schema
export const StandingsListSchema = z.object({
  season: z.string(),
  round: z.string().optional(),
  DriverStandings: z.array(DriverStandingSchema).optional(),
  ConstructorStandings: z.array(ConstructorStandingSchema).optional(),
});

// Table schemas
export const SeasonTableSchema = z.object({
  Seasons: z.array(SeasonSchema),
});

export const RaceTableSchema = z.object({
  season: z.string().optional(),
  round: z.string().optional(),
  Races: z.array(RaceSchema),
});

export const StandingsTableSchema = z.object({
  season: z.string().optional(),
  StandingsLists: z.array(StandingsListSchema),
});

export const CircuitTableSchema = z.object({
  season: z.string().optional(),
  Circuits: z.array(CircuitSchema),
});

// Main MRData schema
export const MRDataSchema = z.object({
  xmlns: z.string().optional(),
  series: z.string().optional(),
  url: z.string().optional(),
  limit: z.string().optional(),
  offset: z.string().optional(),
  total: z.string().optional(),
  SeasonTable: SeasonTableSchema.optional(),
  RaceTable: RaceTableSchema.optional(),
  StandingsTable: StandingsTableSchema.optional(),
  CircuitTable: CircuitTableSchema.optional(),
});

// Root API response schema
export const ErgastApiResponseSchema = z.object({
  MRData: MRDataSchema,
});

// Type exports for use in application
export type ErgastApiResponse = z.infer<typeof ErgastApiResponseSchema>;
export type MRData = z.infer<typeof MRDataSchema>;
export type Driver = z.infer<typeof DriverSchema>;
export type Constructor = z.infer<typeof ConstructorSchema>;
export type Race = z.infer<typeof RaceSchema>;
export type Circuit = z.infer<typeof CircuitSchema>;
export type Location = z.infer<typeof LocationSchema>;
export type Season = z.infer<typeof SeasonSchema>;
export type DriverStanding = z.infer<typeof DriverStandingSchema>;
export type ConstructorStanding = z.infer<typeof ConstructorStandingSchema>;
export type Result = z.infer<typeof ResultSchema>;
export type Lap = z.infer<typeof LapSchema>;
export type LapTime = z.infer<typeof LapTimeSchema>;
export type PitStop = z.infer<typeof PitStopSchema>;
