/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  Calendar,
  CloudRain,
  Compass,
  Globe2,
  MapPin,
  ThermometerSun,
  Trophy,
  Wind,
} from 'lucide-react';
import ErrorMessage from '../components/ErrorMessage';
import LoadingSpinner from '../components/LoadingSpinner';
import PageHeader from '../components/layout/PageHeader';
import SeasonSelector from '../components/SeasonSelector';
import { getCircuitHistory, getCircuits, getSeasons } from '../services/api';

interface Circuit {
  circuitId: string;
  circuitName: string;
  Location: {
    lat: string;
    long: string;
    locality: string;
    country: string;
  };
  url: string;
}

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const average = (values: number[]) => {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
};

const toNumber = (value: string | number | undefined, fallback = 0) => {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallback;
};

const isFinishedStatus = (status: string | undefined) => Boolean(status && (status === 'Finished' || status.startsWith('+')));

const getCircuitArchetype = (circuitName: string, locality: string) => {
  const identity = `${circuitName} ${locality}`.toLowerCase();

  if (/monaco|baku|singapore|jeddah|vegas|miami|melbourne/.test(identity)) {
    return {
      name: 'Street Precision',
      setupBias: 'Mechanical grip + traction',
      overtakeDifficulty: 'High',
      tyreStress: 'Medium',
      summary: 'Precision walls and traction zones make qualifying position and clean exits decisive.',
      sectorSplit: [
        { label: 'Braking Zones', value: 38 },
        { label: 'Traction Exits', value: 34 },
        { label: 'Precision Flow', value: 28 },
      ],
    };
  }

  if (/monza|spa|silverstone|red bull ring|jeddah|mexico/.test(identity)) {
    return {
      name: 'Power Dominant',
      setupBias: 'Straight-line speed + braking stability',
      overtakeDifficulty: 'Low to Moderate',
      tyreStress: 'Low to Medium',
      summary: 'Drag efficiency and braking confidence dominate race pace and overtaking probability.',
      sectorSplit: [
        { label: 'Top Speed', value: 44 },
        { label: 'Flow Sections', value: 24 },
        { label: 'Heavy Braking', value: 32 },
      ],
    };
  }

  if (/hungaroring|zandvoort|barcelona|suzuka|imola|qatar/.test(identity)) {
    return {
      name: 'Aero Rhythm',
      setupBias: 'Downforce efficiency + tire management',
      overtakeDifficulty: 'Moderate',
      tyreStress: 'High',
      summary: 'Sustained cornering and aero balance reward consistency and clean medium-speed transitions.',
      sectorSplit: [
        { label: 'High-Speed Flow', value: 30 },
        { label: 'Aero Load Zones', value: 42 },
        { label: 'Traction Stability', value: 28 },
      ],
    };
  }

  return {
    name: 'Balanced Hybrid',
    setupBias: 'Compromise setup across speed ranges',
    overtakeDifficulty: 'Moderate',
    tyreStress: 'Medium',
    summary: 'Balanced tracks punish setup extremes and reward all-around execution across a race stint.',
    sectorSplit: [
      { label: 'Sector 1 Impact', value: 34 },
      { label: 'Sector 2 Impact', value: 33 },
      { label: 'Sector 3 Impact', value: 33 },
    ],
  };
};

const getWeatherWeighting = (circuit: Circuit) => {
  const latitude = Math.abs(toNumber(circuit.Location.lat, 30));
  const country = circuit.Location.country.toLowerCase();
  const name = circuit.circuitName.toLowerCase();

  let rainRisk = latitude > 46 ? 58 : latitude > 38 ? 44 : 28;
  let heatRisk = latitude < 24 ? 72 : latitude < 34 ? 56 : 38;
  let windRisk = 36;
  let surfaceEvolution = 52;

  if (/united kingdom|belgium|japan|brazil|canada|netherlands/.test(country)) {
    rainRisk += 18;
  }
  if (/bahrain|qatar|saudi|uae|singapore|mexico|miami/.test(`${country} ${name}`)) {
    heatRisk += 18;
  }
  if (/baku|silverstone|sakhir|interlagos|spa/.test(name)) {
    windRisk += 20;
  }
  if (/street|monaco|vegas|jeddah|baku|miami|singapore/.test(name)) {
    surfaceEvolution += 16;
  }

  return {
    rainRisk: clamp(Math.round(rainRisk), 12, 92),
    heatRisk: clamp(Math.round(heatRisk), 18, 95),
    windRisk: clamp(Math.round(windRisk), 14, 88),
    surfaceEvolution: clamp(Math.round(surfaceEvolution), 20, 96),
  };
};

const TrackInsights: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [circuits, setCircuits] = useState<Circuit[]>([]);
  const [seasons, setSeasons] = useState<string[]>([]);
  const [selectedSeason, setSelectedSeason] = useState(new Date().getFullYear().toString());
  const [selectedCircuit, setSelectedCircuit] = useState<Circuit | null>(null);
  const [circuitHistory, setCircuitHistory] = useState<any[]>([]);

  useEffect(() => {
    const fetchSeasons = async () => {
      try {
        const seasonsData = await getSeasons();
        const transformedSeasons = seasonsData.map((season: any) => season.season.toString());
        setSeasons(transformedSeasons);
        if (transformedSeasons.includes(new Date().getFullYear().toString())) {
          setSelectedSeason(new Date().getFullYear().toString());
        } else if (transformedSeasons[0]) {
          setSelectedSeason(transformedSeasons[0]);
        }
      } catch {
        setError('Failed to load seasons');
      }
    };
    fetchSeasons();
  }, []);

  useEffect(() => {
    const fetchCircuits = async () => {
      setLoading(true);
      setError(null);
      try {
        const circuitsData = await getCircuits(selectedSeason);
        setCircuits(circuitsData);
        if (circuitsData.length > 0) {
          setSelectedCircuit(circuitsData[0]);
        } else {
          setSelectedCircuit(null);
        }
      } catch {
        setError('Failed to load circuits');
      } finally {
        setLoading(false);
      }
    };
    fetchCircuits();
  }, [selectedSeason]);

  useEffect(() => {
    const fetchCircuitHistoryData = async () => {
      if (!selectedCircuit) {
        setCircuitHistory([]);
        return;
      }

      setHistoryLoading(true);
      try {
        const history = await getCircuitHistory(selectedCircuit.circuitId, 160);
        setCircuitHistory(history);
      } catch {
        setCircuitHistory([]);
      } finally {
        setHistoryLoading(false);
      }
    };

    fetchCircuitHistoryData();
  }, [selectedCircuit]);

  const circuitContext = useMemo(() => {
    if (!selectedCircuit) return null;

    const archetype = getCircuitArchetype(selectedCircuit.circuitName, selectedCircuit.Location.locality);
    const weatherWeighting = getWeatherWeighting(selectedCircuit);
    const races = [...circuitHistory].sort((a, b) => {
      const seasonDelta = toNumber(b.season) - toNumber(a.season);
      if (seasonDelta !== 0) return seasonDelta;
      return toNumber(b.round) - toNumber(a.round);
    });

    const winnerRows = races
      .map((race: any) => {
        const winner = race.Results?.[0];
        if (!winner) return null;
        return {
          season: race.season,
          raceName: race.raceName,
          winnerName: `${winner.Driver.givenName} ${winner.Driver.familyName}`,
          constructorName: winner.Constructor.name,
          grid: toNumber(winner.grid, 0),
        };
      })
      .filter(Boolean) as Array<{
      season: string;
      raceName: string;
      winnerName: string;
      constructorName: string;
      grid: number;
    }>;

    const driverWinMap = new Map<string, number>();
    const constructorWinMap = new Map<string, number>();
    winnerRows.forEach((winnerRow) => {
      driverWinMap.set(winnerRow.winnerName, (driverWinMap.get(winnerRow.winnerName) || 0) + 1);
      constructorWinMap.set(winnerRow.constructorName, (constructorWinMap.get(winnerRow.constructorName) || 0) + 1);
    });

    const topDriverWins = [...driverWinMap.entries()].sort((a, b) => b[1] - a[1])[0];
    const topConstructorWins = [...constructorWinMap.entries()].sort((a, b) => b[1] - a[1])[0];

    const winnerGrids = winnerRows.map((winnerRow) => (winnerRow.grid === 0 ? 20 : winnerRow.grid)).filter((grid) => grid > 0);
    const avgWinnerGrid = winnerGrids.length ? average(winnerGrids) : null;
    const poleToWinRate = winnerRows.length
      ? (winnerRows.filter((winnerRow) => winnerRow.grid === 1).length / winnerRows.length) * 100
      : 0;

    const dnfRates = races
      .map((race: any) => {
        const results = race.Results || [];
        if (!results.length) return null;
        const retirements = results.filter((result: any) => !isFinishedStatus(result.status)).length;
        return (retirements / results.length) * 100;
      })
      .filter((rate) => typeof rate === 'number') as number[];
    const averageDnfRate = dnfRates.length ? average(dnfRates) : 0;

    const volatilityIndex = clamp(Math.round((100 - poleToWinRate) * 0.4 + averageDnfRate * 0.8), 12, 92);
    const strategyLockIn = clamp(Math.round((poleToWinRate * 0.6) + ((avgWinnerGrid ? (20 - avgWinnerGrid) * 2 : 22) * 0.4)), 16, 94);

    return {
      archetype,
      weatherWeighting,
      racesCount: races.length,
      latestRace: winnerRows[0] || null,
      topDriverWins,
      topConstructorWins,
      avgWinnerGrid,
      poleToWinRate,
      averageDnfRate,
      volatilityIndex,
      strategyLockIn,
    };
  }, [circuitHistory, selectedCircuit]);

  if (loading) return <LoadingSpinner label="Loading circuit intelligence..." />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="space-y-8">
      <PageHeader
        icon={MapPin}
        overline="CIRCUIT CONTEXT ENGINE"
        title="Track Insights"
        subtitle="Circuit archetypes, weather pressure weighting, and historical strategy patterns for race-weekend decision framing."
      />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="f1-card p-6">
          <label className="mb-2 flex items-center text-sm font-medium uppercase tracking-[0.14em] text-f1-muted">
            <Calendar className="mr-2 h-4 w-4 text-f1-red" />
            Season
          </label>
          <SeasonSelector seasons={seasons} selectedSeason={selectedSeason} onSeasonChange={setSelectedSeason} />
        </div>
        <div className="f1-card p-6">
          <label className="mb-2 flex items-center text-sm font-medium uppercase tracking-[0.14em] text-f1-muted">
            <MapPin className="mr-2 h-4 w-4 text-f1-red" />
            Circuit
          </label>
          <select
            value={selectedCircuit?.circuitId || ''}
            onChange={(event) => {
              const circuit = circuits.find((candidate) => candidate.circuitId === event.target.value);
              if (circuit) setSelectedCircuit(circuit);
            }}
            className="f1-select"
          >
            {circuits.map((circuit) => (
              <option key={circuit.circuitId} value={circuit.circuitId} className="bg-f1-surface text-f1-text">
                {circuit.circuitName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedCircuit && circuitContext && (
        <>
          <section className="f1-card p-6">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="f1-overline">ARCHETYPE + STRATEGY PRESSURE</p>
                <h2 className="text-2xl font-semibold text-f1-text">{selectedCircuit.circuitName}</h2>
                <p className="text-sm text-f1-muted">
                  {selectedCircuit.Location.locality}, {selectedCircuit.Location.country}
                </p>
              </div>
              <div className="rounded-full border border-f1-gray/35 bg-f1-surface-soft px-3 py-1.5 text-xs text-f1-muted">
                {historyLoading ? 'Refreshing circuit history...' : `Historical races analyzed: ${circuitContext.racesCount}`}
              </div>
            </div>

            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-xl border border-f1-gray/30 bg-f1-surface-soft/80 p-4">
                <p className="text-[11px] uppercase tracking-[0.12em] text-f1-muted">Circuit Archetype</p>
                <p className="mt-2 text-lg font-semibold text-f1-text">{circuitContext.archetype.name}</p>
                <p className="text-sm text-f1-muted">{circuitContext.archetype.setupBias}</p>
              </div>
              <div className="rounded-xl border border-f1-gray/30 bg-f1-surface-soft/80 p-4">
                <p className="text-[11px] uppercase tracking-[0.12em] text-f1-muted">Volatility Index</p>
                <p className="mt-2 text-2xl font-semibold text-f1-text">{circuitContext.volatilityIndex}</p>
                <p className="text-sm text-f1-muted">DNF + grid disruption sensitivity</p>
              </div>
              <div className="rounded-xl border border-f1-gray/30 bg-f1-surface-soft/80 p-4">
                <p className="text-[11px] uppercase tracking-[0.12em] text-f1-muted">Pole Conversion</p>
                <p className="mt-2 text-2xl font-semibold text-f1-text">{circuitContext.poleToWinRate.toFixed(1)}%</p>
                <p className="text-sm text-f1-muted">Pole starter wins at this venue</p>
              </div>
              <div className="rounded-xl border border-f1-gray/30 bg-f1-surface-soft/80 p-4">
                <p className="text-[11px] uppercase tracking-[0.12em] text-f1-muted">Strategy Lock-In</p>
                <p className="mt-2 text-2xl font-semibold text-f1-text">{circuitContext.strategyLockIn}</p>
                <p className="text-sm text-f1-muted">Track position dependence score</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-xl border border-f1-gray/30 bg-f1-surface-soft/75 p-4">
                <h3 className="mb-3 flex items-center text-lg font-semibold text-f1-text">
                  <Compass className="mr-2 h-5 w-5 text-f1-red" />
                  Sector Sensitivity Model
                </h3>
                <p className="mb-4 text-sm text-f1-muted">{circuitContext.archetype.summary}</p>
                <div className="space-y-3">
                  {circuitContext.archetype.sectorSplit.map((sector) => (
                    <div key={sector.label}>
                      <div className="mb-1 flex items-center justify-between text-sm text-f1-muted">
                        <span>{sector.label}</span>
                        <span>{sector.value}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-f1-gray/35">
                        <div className="h-full rounded-full bg-f1-red" style={{ width: `${sector.value}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-f1-gray/30 bg-f1-surface-soft/75 p-4">
                <h3 className="mb-3 flex items-center text-lg font-semibold text-f1-text">
                  <CloudRain className="mr-2 h-5 w-5 text-f1-red" />
                  Weather Impact Weighting
                </h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <div className="mb-1 flex items-center justify-between text-f1-muted">
                      <span className="inline-flex items-center gap-1">
                        <CloudRain className="h-4 w-4" />
                        Rain Risk
                      </span>
                      <span>{circuitContext.weatherWeighting.rainRisk}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-f1-gray/35">
                      <div className="h-full rounded-full bg-blue-400" style={{ width: `${circuitContext.weatherWeighting.rainRisk}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="mb-1 flex items-center justify-between text-f1-muted">
                      <span className="inline-flex items-center gap-1">
                        <ThermometerSun className="h-4 w-4" />
                        Heat Load
                      </span>
                      <span>{circuitContext.weatherWeighting.heatRisk}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-f1-gray/35">
                      <div className="h-full rounded-full bg-orange-400" style={{ width: `${circuitContext.weatherWeighting.heatRisk}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="mb-1 flex items-center justify-between text-f1-muted">
                      <span className="inline-flex items-center gap-1">
                        <Wind className="h-4 w-4" />
                        Wind Variability
                      </span>
                      <span>{circuitContext.weatherWeighting.windRisk}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-f1-gray/35">
                      <div className="h-full rounded-full bg-teal-400" style={{ width: `${circuitContext.weatherWeighting.windRisk}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="mb-1 flex items-center justify-between text-f1-muted">
                      <span className="inline-flex items-center gap-1">
                        <Activity className="h-4 w-4" />
                        Surface Evolution
                      </span>
                      <span>{circuitContext.weatherWeighting.surfaceEvolution}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-f1-gray/35">
                      <div
                        className="h-full rounded-full bg-emerald-400"
                        style={{ width: `${circuitContext.weatherWeighting.surfaceEvolution}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <section className="f1-card p-6">
              <h2 className="mb-6 flex items-center text-2xl font-semibold text-f1-text">
                <Trophy className="mr-2 h-6 w-6 text-f1-red" />
                Historical Strategy Patterns
              </h2>
              <div className="space-y-4">
                <div className="rounded-xl border border-f1-gray/30 bg-f1-surface-soft/75 p-4">
                  <p className="text-sm text-f1-muted">Most Successful Driver</p>
                  <p className="text-lg font-semibold text-f1-text">
                    {circuitContext.topDriverWins ? `${circuitContext.topDriverWins[0]} (${circuitContext.topDriverWins[1]} wins)` : 'Insufficient history'}
                  </p>
                </div>
                <div className="rounded-xl border border-f1-gray/30 bg-f1-surface-soft/75 p-4">
                  <p className="text-sm text-f1-muted">Most Successful Constructor</p>
                  <p className="text-lg font-semibold text-f1-text">
                    {circuitContext.topConstructorWins
                      ? `${circuitContext.topConstructorWins[0]} (${circuitContext.topConstructorWins[1]} wins)`
                      : 'Insufficient history'}
                  </p>
                </div>
                <div className="rounded-xl border border-f1-gray/30 bg-f1-surface-soft/75 p-4">
                  <p className="text-sm text-f1-muted">Average Winner Start Position</p>
                  <p className="text-lg font-semibold text-f1-text">
                    {circuitContext.avgWinnerGrid ? `P${circuitContext.avgWinnerGrid.toFixed(1)}` : 'N/A'}
                  </p>
                </div>
                <div className="rounded-xl border border-f1-gray/30 bg-f1-surface-soft/75 p-4">
                  <p className="text-sm text-f1-muted">Average DNF Rate</p>
                  <p className="text-lg font-semibold text-f1-text">{circuitContext.averageDnfRate.toFixed(1)}%</p>
                </div>
              </div>
            </section>

            <section className="f1-card p-6">
              <h2 className="mb-6 flex items-center text-2xl font-semibold text-f1-text">
                <Globe2 className="mr-2 h-6 w-6 text-f1-red" />
                Circuit Context Snapshot
              </h2>
              <div className="space-y-4">
                <div className="rounded-xl border border-f1-gray/30 bg-f1-surface-soft/75 p-4">
                  <p className="text-sm text-f1-muted">Location</p>
                  <p className="text-lg font-semibold text-f1-text">
                    {selectedCircuit.Location.locality}, {selectedCircuit.Location.country}
                  </p>
                  <p className="text-xs text-f1-muted">
                    Coordinates: {selectedCircuit.Location.lat}, {selectedCircuit.Location.long}
                  </p>
                </div>
                <div className="rounded-xl border border-f1-gray/30 bg-f1-surface-soft/75 p-4">
                  <p className="text-sm text-f1-muted">Latest Winner on Record</p>
                  <p className="text-lg font-semibold text-f1-text">
                    {circuitContext.latestRace
                      ? `${circuitContext.latestRace.winnerName} (${circuitContext.latestRace.season})`
                      : 'No race history available'}
                  </p>
                  <p className="text-xs text-f1-muted">
                    {circuitContext.latestRace ? `${circuitContext.latestRace.constructorName} · ${circuitContext.latestRace.raceName}` : ''}
                  </p>
                </div>
                <a
                  href={selectedCircuit.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-f1-red/35 bg-f1-red/10 px-3 py-2 text-sm text-f1-red transition-colors hover:bg-f1-red/15"
                >
                  <MapPin className="h-4 w-4" />
                  Open official circuit reference
                </a>
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
};

export default TrackInsights;
