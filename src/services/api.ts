import { httpClient, HttpError, ValidationError } from './http';
import type { MRData } from '../schemas/ergast';

// Simple in-memory cache with TTL
interface CacheEntry {
  data: MRData;
  timestamp: number;
  ttl: number;
}

class ApiCache {
  private cache = new Map<string, CacheEntry>();
  private readonly defaultTtl = 5 * 60 * 1000; // 5 minutes

  set(key: string, data: MRData, ttl: number = this.defaultTtl): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  get(key: string): MRData | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > entry.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  clear(): void {
    this.cache.clear();
  }
}

const apiCache = new ApiCache();

export const fetchData = async (endpoint: string): Promise<MRData> => {
  const cacheKey = endpoint;
  
  // Try to get from cache first
  const cachedData = apiCache.get(cacheKey);
  if (cachedData) {
    console.debug(`Using cached data for ${endpoint}`);
    return cachedData;
  }

  try {
    const response = await httpClient.fetchErgastData(endpoint);
    const data = response.MRData;
    
    // Cache successful responses
    apiCache.set(cacheKey, data);
    return data;
  } catch (error) {
    console.error(`Error fetching data from ${endpoint}:`, error);
    
    // Try to return stale cached data as fallback
    const staleData = apiCache.get(cacheKey);
    if (staleData) {
      console.warn(`Using stale cached data for ${endpoint} due to error:`, error);
      return staleData;
    }
    
    // If no cached data available, rethrow the error
    throw error;
  }
};

export const getSeasons = async () => {
  const data = await fetchData("/seasons.json?limit=100");
  return data.SeasonTable?.Seasons || [];
};

export const getRounds = async (season: string) => {
  const data = await fetchData(`/${season}.json`);
  return data.RaceTable?.Races || [];
};

export const getDriverStandings = async (season: string = "current") => {
  const data = await fetchData(`/${season}/driverStandings.json`);
  return data.StandingsTable?.StandingsLists[0]?.DriverStandings || [];
};

export const getConstructorStandings = async (season: string = "current") => {
  const data = await fetchData(`/${season}/constructorStandings.json`);
  return data.StandingsTable?.StandingsLists[0]?.ConstructorStandings || [];
};

export const getRaceResults = async (
  season: string = "current",
  round: string = "last"
) => {
  const data = await fetchData(`/${season}/${round}/results.json`);
  return data.RaceTable?.Races[0] || null;
};

export const getLapTimes = async (
  season: string,
  round: string,
  driverId: string
) => {
  const data = await fetchData(
    `/${season}/${round}/drivers/${driverId}/laps.json?limit=100`
  );
  return data.RaceTable?.Races[0]?.Laps || [];
};

export const getCircuits = async (season: string = "current") => {
  const data = await fetchData(`/${season}/circuits.json`);
  return data.CircuitTable?.Circuits || [];
};

export const getCircuitInfo = async (circuitId: string) => {
  const data = await fetchData(`/circuits/${circuitId}.json`);
  return data.CircuitTable?.Circuits[0] || null;
};

export const getSeasonResults = async (season: string = "current") => {
  const data = await fetchData(`/${season}/results.json?limit=1000`);
  console.log("API Response:", data);
  return data.RaceTable?.Races || [];
};

export const getPitStops = async (season: string, round: string) => {
  const data = await fetchData(`/${season}/${round}/pitstops.json`);
  return data.RaceTable?.Races[0]?.PitStops || [];
};

// Export cache management utilities
export const clearApiCache = () => {
  apiCache.clear();
  console.log('API cache cleared');
};

// Export error types for use in components
export { HttpError, ValidationError };
