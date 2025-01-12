const BASE_URL = "https://ergast.com/api/f1";

export const fetchData = async (endpoint: string) => {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`);
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const data = await response.json();
    return data.MRData;
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error;
  }
};

export const getSeasons = async () => {
  const data = await fetchData("/seasons.json?limit=100");
  return data.SeasonTable.Seasons || [];
};

export const getRounds = async (season: string) => {
  const data = await fetchData(`/${season}.json`);
  return data.RaceTable.Races || [];
};

export const getDriverStandings = async (season: string = "current") => {
  const data = await fetchData(`/${season}/driverStandings.json`);
  return data.StandingsTable.StandingsLists[0]?.DriverStandings || [];
};

export const getConstructorStandings = async (season: string = "current") => {
  const data = await fetchData(`/${season}/constructorStandings.json`);
  return data.StandingsTable.StandingsLists[0]?.ConstructorStandings || [];
};

export const getRaceResults = async (
  season: string = "current",
  round: string = "last"
) => {
  const data = await fetchData(`/${season}/${round}/results.json`);
  return data.RaceTable.Races[0] || null;
};

export const getLapTimes = async (
  season: string = "current",
  round: string = "last"
) => {
  const data = await fetchData(`/${season}/${round}/laps.json`);
  return data.RaceTable.Races[0]?.Laps || [];
};

export const getCircuits = async (season: string = "current") => {
  const data = await fetchData(`/${season}/circuits.json`);
  return data.CircuitTable.Circuits || [];
};

export const getCircuitInfo = async (circuitId: string) => {
  const data = await fetchData(`/circuits/${circuitId}.json`);
  return data.CircuitTable.Circuits[0] || null;
};

export const getSeasonResults = async (season: string = "current") => {
  const data = await fetchData(`/${season}/results.json?limit=1000`);
  return data.RaceTable.Races || [];
};
