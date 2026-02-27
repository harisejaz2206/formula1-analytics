/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  Building2,
  Calendar,
  Flag,
  Gauge,
  Info,
  ShieldCheck,
  Target,
  Trophy,
  Users,
} from 'lucide-react';
import {
  getConstructorStandings,
  getDriverStandings,
  getSeasonResults,
  getSeasons,
} from '../services/api';
import ErrorMessage from '../components/ErrorMessage';
import LoadingSpinner from '../components/LoadingSpinner';
import PageHeader from '../components/layout/PageHeader';

interface DriverModelRow {
  driverId: string;
  name: string;
  familyName: string;
  teamId: string;
  teamName: string;
  points: number;
  wins: number;
  position: number;
  formIndex: number;
  consistencyIndex: number;
  racecraftDelta: number;
  finishingRate: number;
  pressureIndex: number;
  avgFinish: number | null;
}

interface ConstructorModelRow {
  constructorId: string;
  constructorName: string;
  points: number;
  wins: number;
  efficiencyIndex: number;
  balanceIndex: number;
  depthIndex: number;
  modelScore: number;
}

const isFinishedStatus = (status: string | undefined) => Boolean(status && (status === 'Finished' || status.startsWith('+')));

const toNumber = (value: string | number | undefined, fallback = 0) => {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallback;
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const average = (values: number[]) =>
  values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length;

const stdDeviation = (values: number[]) => {
  if (values.length < 2) return 0;
  const mean = average(values);
  const variance = average(values.map((value) => (value - mean) ** 2));
  return Math.sqrt(variance);
};

const modelLegend = [
  {
    metric: 'Form Index',
    meaning: 'Overall season strength signal for a driver.',
    derived: '45% points pace + 20% wins + 20% consistency + 15% finish rate.',
  },
  {
    metric: 'Consistency Index',
    meaning: 'How stable race finishes are across the season.',
    derived: 'Inverse of finish-position variance (lower variance = higher score).',
  },
  {
    metric: 'Racecraft Delta',
    meaning: 'Average positions gained or lost versus grid starts.',
    derived: 'Average of (grid position - finish position) per race.',
  },
  {
    metric: 'Pressure Index',
    meaning: 'How much responsibility a driver carries in team output.',
    derived: 'Team points share + finish reliability + wins contribution.',
  },
  {
    metric: 'Efficiency',
    meaning: 'Constructor output versus championship leader.',
    derived: 'Points and wins normalized to top constructor baseline.',
  },
  {
    metric: 'Depth',
    meaning: 'How consistently strong the full driver lineup is.',
    derived: 'Average consistency index of both team drivers.',
  },
];

const Profiles: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [seasonNotice, setSeasonNotice] = useState<string | null>(null);
  const [resolvedSeason, setResolvedSeason] = useState<string>('');
  const [drivers, setDrivers] = useState<any[]>([]);
  const [constructors, setConstructors] = useState<any[]>([]);
  const [seasonResults, setSeasonResults] = useState<any[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<string>(new Date().getFullYear().toString());
  const [availableSeasons, setAvailableSeasons] = useState<string[]>([]);

  useEffect(() => {
    const fetchSeasons = async () => {
      try {
        const seasons = await getSeasons();
        const sortedSeasons = seasons
          .map((season) => season.season)
          .sort((a, b) => parseInt(b, 10) - parseInt(a, 10));

        setAvailableSeasons(sortedSeasons);

        const currentYear = new Date().getFullYear().toString();
        if (sortedSeasons.includes(currentYear)) {
          setSelectedSeason(currentYear);
        } else if (sortedSeasons.length > 0) {
          setSelectedSeason(sortedSeasons[0]);
        }
      } catch (fetchError) {
        console.error('Failed to load seasons:', fetchError);
      }
    };

    fetchSeasons();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (availableSeasons.length === 0) {
        return;
      }

      setLoading(true);
      setError(null);
      setSeasonNotice(null);

      try {
        const loadSeasonPayload = async (season: string) => {
          const [driversData, constructorsData, seasonData] = await Promise.all([
            getDriverStandings(season),
            getConstructorStandings(season),
            getSeasonResults(season),
          ]);

          if (!driversData || driversData.length === 0) return null;
          if (!constructorsData || constructorsData.length === 0) return null;

          return {
            season,
            driversData,
            constructorsData,
            seasonData: seasonData || [],
          };
        };

        let payload = await loadSeasonPayload(selectedSeason);

        if (!payload) {
          const fallbackCandidates = [...availableSeasons]
            .filter((season) => season !== selectedSeason)
            .sort((a, b) => parseInt(b, 10) - parseInt(a, 10));

          for (const fallbackSeason of fallbackCandidates) {
            const fallbackPayload = await loadSeasonPayload(fallbackSeason);
            if (fallbackPayload) {
              payload = fallbackPayload;
              break;
            }
          }
        }

        if (!payload) {
          setError('No driver and constructor standings data available for the selected or previous seasons.');
          setResolvedSeason('');
          return;
        }

        if (payload.season !== selectedSeason) {
          setSeasonNotice(`${selectedSeason} standings are not available yet. Showing ${payload.season} modeling data.`);
        }

        setResolvedSeason(payload.season);
        setDrivers(payload.driversData);
        setConstructors(payload.constructorsData);
        setSeasonResults(payload.seasonData);
      } catch (fetchError) {
        console.error('Error loading profile data:', fetchError);
        setError('Failed to load profile data. Please try again.');
        setResolvedSeason('');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedSeason, availableSeasons]);

  const driverModels = useMemo<DriverModelRow[]>(() => {
    if (drivers.length === 0) return [];

    const performanceByDriver = new Map<
      string,
      {
        finishes: number[];
        grids: number[];
        gains: number[];
        starts: number;
        finishedCount: number;
      }
    >();

    seasonResults.forEach((race: any) => {
      const raceResults = race.Results || [];
      raceResults.forEach((result: any) => {
        const driverId = result.Driver?.driverId;
        if (!driverId) return;

        const finishPosition = toNumber(result.position, NaN);
        const gridPositionRaw = toNumber(result.grid, NaN);
        const gridPosition = Number.isFinite(gridPositionRaw) ? (gridPositionRaw === 0 ? 20 : gridPositionRaw) : NaN;

        if (!performanceByDriver.has(driverId)) {
          performanceByDriver.set(driverId, {
            finishes: [],
            grids: [],
            gains: [],
            starts: 0,
            finishedCount: 0,
          });
        }

        const stats = performanceByDriver.get(driverId)!;
        stats.starts += 1;

        if (Number.isFinite(finishPosition)) stats.finishes.push(finishPosition);
        if (Number.isFinite(gridPosition)) stats.grids.push(gridPosition);
        if (Number.isFinite(gridPosition) && Number.isFinite(finishPosition)) {
          stats.gains.push(gridPosition - finishPosition);
        }
        if (isFinishedStatus(result.status)) stats.finishedCount += 1;
      });
    });

    const teamPointsMap = drivers.reduce((accumulator: Map<string, number>, driver: any) => {
      const constructorId = driver.Constructors?.[0]?.constructorId;
      if (!constructorId) return accumulator;

      const existingPoints = accumulator.get(constructorId) || 0;
      accumulator.set(constructorId, existingPoints + toNumber(driver.points));
      return accumulator;
    }, new Map<string, number>());

    const leaderPoints = toNumber(drivers[0]?.points, 1);
    const leaderWins = Math.max(...drivers.map((driver: any) => toNumber(driver.wins, 0)), 1);

    return drivers.map((driver: any) => {
      const driverId = driver.Driver.driverId;
      const givenName = driver.Driver.givenName;
      const familyName = driver.Driver.familyName;
      const constructor = driver.Constructors[0];
      const teamId = constructor.constructorId;
      const points = toNumber(driver.points);
      const wins = toNumber(driver.wins);
      const position = toNumber(driver.position, 99);

      const stats = performanceByDriver.get(driverId) || {
        finishes: [],
        grids: [],
        gains: [],
        starts: 0,
        finishedCount: 0,
      };

      const avgFinish = stats.finishes.length ? average(stats.finishes) : null;
      const racecraftDelta = stats.gains.length ? average(stats.gains) : 0;
      const consistencyIndex = clamp(Math.round(100 - stdDeviation(stats.finishes) * 14), 22, 98);
      const finishingRate = stats.starts ? (stats.finishedCount / stats.starts) * 100 : 0;
      const teamShare = points / Math.max(1, teamPointsMap.get(teamId) || points);
      const pressureIndex = clamp(Math.round(teamShare * 62 + finishingRate * 0.3 + wins * 2.8), 20, 99);
      const pointsNorm = (points / leaderPoints) * 100;
      const winsNorm = (wins / leaderWins) * 100;
      const formIndex = clamp(
        Math.round(pointsNorm * 0.45 + winsNorm * 0.2 + consistencyIndex * 0.2 + finishingRate * 0.15),
        25,
        99,
      );

      return {
        driverId,
        name: `${givenName} ${familyName}`,
        familyName,
        teamId,
        teamName: constructor.name,
        points,
        wins,
        position,
        formIndex,
        consistencyIndex,
        racecraftDelta,
        finishingRate,
        pressureIndex,
        avgFinish,
      };
    });
  }, [drivers, seasonResults]);

  const constructorModels = useMemo<ConstructorModelRow[]>(() => {
    if (constructors.length === 0) return [];

    const leaderPoints = toNumber(constructors[0]?.points, 1);
    const leaderWins = Math.max(...constructors.map((constructor: any) => toNumber(constructor.wins, 0)), 1);

    return constructors.map((constructor: any) => {
      const constructorId = constructor.Constructor.constructorId;
      const constructorName = constructor.Constructor.name;
      const points = toNumber(constructor.points);
      const wins = toNumber(constructor.wins);

      const lineup = driverModels.filter((driver) => driver.teamId === constructorId);
      const lineupPoints = lineup.reduce((total, driver) => total + driver.points, 0);
      const driverA = lineup[0];
      const driverB = lineup[1];
      const balanceIndex =
        lineup.length > 1
          ? clamp(Math.round(100 - (Math.abs(driverA.points - driverB.points) / Math.max(1, lineupPoints)) * 100), 18, 99)
          : 45;
      const rawDepthIndex = lineup.length > 0 ? Math.round(average(lineup.map((driver) => driver.consistencyIndex))) : 40;
      const depthIndex = clamp(Number.isFinite(rawDepthIndex) ? rawDepthIndex : 40, 20, 99);
      const efficiencyIndex = clamp(
        Math.round((points / leaderPoints) * 70 + (wins / leaderWins) * 30),
        20,
        99,
      );
      const modelScore = Math.round(efficiencyIndex * 0.5 + balanceIndex * 0.25 + depthIndex * 0.25);

      return {
        constructorId,
        constructorName,
        points,
        wins,
        efficiencyIndex,
        balanceIndex,
        depthIndex,
        modelScore,
      };
    });
  }, [constructors, driverModels]);

  const teamBattles = useMemo(() => {
    const constructorGroups = drivers.reduce((groups: Map<string, any[]>, driver: any) => {
      const constructor = driver.Constructors[0];
      const constructorKey = constructor.name;

      if (!groups.has(constructorKey)) {
        groups.set(constructorKey, []);
      }

      groups.get(constructorKey)!.push({
        id: driver.Driver.driverId,
        name: `${driver.Driver.givenName} ${driver.Driver.familyName}`,
        points: toNumber(driver.points),
        wins: toNumber(driver.wins),
        position: toNumber(driver.position, 99),
      });

      return groups;
    }, new Map<string, any[]>());

    const battles = Array.from(constructorGroups.entries()).map(([constructorName, roster]) => {
      const sortedRoster = [...roster].sort((a, b) => b.points - a.points);
      if (sortedRoster.length === 1) {
        sortedRoster.push({
          id: 'tba',
          name: 'TBA',
          points: 0,
          wins: 0,
          position: '-',
        });
      }

      const [driver1, driver2] = sortedRoster;
      const totalPoints = driver1.points + driver2.points;
      const pointsPercentage = totalPoints === 0 ? 50 : (driver1.points / totalPoints) * 100;

      let driver1Ahead = 0;
      let driver2Ahead = 0;
      if (driver1.id !== 'tba' && driver2.id !== 'tba') {
        seasonResults.forEach((race: any) => {
          const raceResults = race.Results || [];
          const result1 = raceResults.find((result: any) => result.Driver?.driverId === driver1.id);
          const result2 = raceResults.find((result: any) => result.Driver?.driverId === driver2.id);
          if (!result1 || !result2) return;

          const finish1 = toNumber(result1.position, NaN);
          const finish2 = toNumber(result2.position, NaN);
          if (!Number.isFinite(finish1) || !Number.isFinite(finish2)) return;

          if (finish1 < finish2) driver1Ahead += 1;
          if (finish2 < finish1) driver2Ahead += 1;
        });
      }

      const comparedRaces = driver1Ahead + driver2Ahead;
      const pointsGap = Math.abs(driver1.points - driver2.points);
      const confidence = clamp(
        Math.round(
          48 +
            Math.min(20, comparedRaces * 1.4) +
            Math.min(22, pointsGap / Math.max(1, totalPoints || 1) * 120) +
            Math.min(12, Math.abs(driver1Ahead - driver2Ahead) * 1.3),
        ),
        50,
        97,
      );

      return {
        constructorName,
        driver1,
        driver2,
        pointsPercentage,
        totalPoints,
        headToHead: `${driver1Ahead}-${driver2Ahead}`,
        comparedRaces,
        confidence,
      };
    });

    return battles.sort((a, b) => b.totalPoints - a.totalPoints);
  }, [drivers, seasonResults]);

  const modelHighlights = useMemo(() => {
    const bestForm = [...driverModels].sort((a, b) => b.formIndex - a.formIndex)[0];
    const mostConsistent = [...driverModels].sort((a, b) => b.consistencyIndex - a.consistencyIndex)[0];
    const bestRacecraft = [...driverModels].sort((a, b) => b.racecraftDelta - a.racecraftDelta)[0];
    const topConstructorModel = [...constructorModels].sort((a, b) => b.modelScore - a.modelScore)[0];

    return {
      bestForm,
      mostConsistent,
      bestRacecraft,
      topConstructorModel,
    };
  }, [constructorModels, driverModels]);

  if (loading) return <LoadingSpinner label="Building driver and team models..." />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="space-y-8">
      <PageHeader
        icon={Users}
        overline="DRIVER + CONSTRUCTOR INTELLIGENCE"
        title="Driver & Team Profiles"
        subtitle="Championship standings, teammate dynamics, and model-driven performance signals in one analytical workspace."
      />

      <div className="f1-card mb-8 flex flex-col items-start justify-between gap-4 p-4 sm:flex-row sm:items-center">
        <div className="flex items-center">
          <Calendar className="mr-2 h-6 w-6 text-f1-red" />
          <h2 className="text-xl font-semibold text-f1-text">Season Overview</h2>
        </div>
        <div className="w-full sm:w-auto">
          <select
            value={selectedSeason}
            onChange={(event) => setSelectedSeason(event.target.value)}
            className="f1-select min-w-[12rem]"
          >
            {availableSeasons.map((season) => {
              const currentYear = new Date().getFullYear().toString();
              return (
                <option key={season} value={season}>
                  {season === currentYear ? `${season} (Current)` : season}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {seasonNotice && (
        <div className="rounded-xl border border-amber-500/35 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          {seasonNotice}
        </div>
      )}

      {resolvedSeason && (
        <div className="text-xs uppercase tracking-[0.14em] text-f1-muted">
          Active Modeling Dataset: <span className="text-f1-text">{resolvedSeason}</span>
        </div>
      )}

      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="f1-card group flex items-center space-x-4 p-6 transition-transform duration-300 hover:scale-105">
          <div className="rounded-lg bg-f1-red/10 p-3 transition-transform duration-300 group-hover:scale-110">
            <Trophy className="h-6 w-6 text-f1-red" />
          </div>
          <div>
            <p className="text-sm text-f1-muted">Champion's Points</p>
            <p className="text-2xl font-semibold text-f1-text">{drivers[0]?.points || 0}</p>
            <p className="text-xs text-f1-muted">
              {drivers[0]?.Driver?.givenName} {drivers[0]?.Driver?.familyName}
            </p>
          </div>
        </div>
        <div className="f1-card group flex items-center space-x-4 p-6 transition-transform duration-300 hover:scale-105">
          <div className="rounded-lg bg-f1-red/10 p-3 transition-transform duration-300 group-hover:scale-110">
            <Flag className="h-6 w-6 text-f1-red" />
          </div>
          <div>
            <p className="text-sm text-f1-muted">Season Race Wins</p>
            <p className="text-2xl font-semibold text-f1-text">
              {drivers.reduce((total, driver) => total + toNumber(driver.wins), 0)}
            </p>
            <p className="text-xs text-f1-muted">Across all drivers</p>
          </div>
        </div>
        <div className="f1-card group flex items-center space-x-4 p-6 transition-transform duration-300 hover:scale-105">
          <div className="rounded-lg bg-f1-red/10 p-3 transition-transform duration-300 group-hover:scale-110">
            <Building2 className="h-6 w-6 text-f1-red" />
          </div>
          <div>
            <p className="text-sm text-f1-muted">Active Teams</p>
            <p className="text-2xl font-semibold text-f1-text">{constructors.length}</p>
            <p className="text-xs text-f1-muted">Constructor entries</p>
          </div>
        </div>
      </div>

      <section className="f1-card overflow-visible p-6">
        <h2 className="mb-6 flex items-center text-2xl font-semibold text-f1-text">
          <Activity className="mr-2 h-6 w-6 text-f1-red" />
          Driver & Team Modeling
        </h2>

        <div className="mb-6 rounded-xl border border-f1-gray/30 bg-f1-surface-soft/70 p-4">
          <div className="mb-4 flex items-center gap-2">
            <Info className="h-4 w-4 text-f1-red" />
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-f1-text">Model Legend (Plain Language)</p>
          </div>
          <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full bg-f1-red/10 px-2 py-1 text-f1-red">Red bar: Efficiency</span>
            <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-emerald-400">Green bar: Balance</span>
            <span className="rounded-full bg-cyan-500/10 px-2 py-1 text-cyan-300">Cyan bar: Depth</span>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {modelLegend.map((item) => (
              <div key={item.metric} className="rounded-lg border border-f1-gray/20 bg-f1-surface/70 p-3">
                <p className="text-sm font-semibold text-f1-text">{item.metric}</p>
                <p className="mt-1 text-xs text-f1-muted">{item.meaning}</p>
                <p className="mt-1 text-xs text-f1-muted">{item.derived}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-f1-gray/30 bg-f1-surface-soft/80 p-4">
            <p className="text-[11px] uppercase tracking-[0.12em] text-f1-muted">Best Form Index</p>
            <p className="mt-2 text-xl font-semibold text-f1-text">{modelHighlights.bestForm?.name || 'N/A'}</p>
            <p className="text-sm text-f1-muted">{modelHighlights.bestForm?.formIndex || 0} / 100 model score</p>
          </div>
          <div className="rounded-xl border border-f1-gray/30 bg-f1-surface-soft/80 p-4">
            <p className="text-[11px] uppercase tracking-[0.12em] text-f1-muted">Most Consistent</p>
            <p className="mt-2 text-xl font-semibold text-f1-text">{modelHighlights.mostConsistent?.name || 'N/A'}</p>
            <p className="text-sm text-f1-muted">{modelHighlights.mostConsistent?.consistencyIndex || 0} consistency index</p>
          </div>
          <div className="rounded-xl border border-f1-gray/30 bg-f1-surface-soft/80 p-4">
            <p className="text-[11px] uppercase tracking-[0.12em] text-f1-muted">Best Racecraft Delta</p>
            <p className="mt-2 text-xl font-semibold text-f1-text">{modelHighlights.bestRacecraft?.familyName || 'N/A'}</p>
            <p className="text-sm text-f1-muted">
              {modelHighlights.bestRacecraft ? `${modelHighlights.bestRacecraft.racecraftDelta.toFixed(2)} positions/race` : 'N/A'}
            </p>
          </div>
          <div className="rounded-xl border border-f1-gray/30 bg-f1-surface-soft/80 p-4">
            <p className="text-[11px] uppercase tracking-[0.12em] text-f1-muted">Top Constructor Model</p>
            <p className="mt-2 text-xl font-semibold text-f1-text">
              {modelHighlights.topConstructorModel?.constructorName || 'N/A'}
            </p>
            <p className="text-sm text-f1-muted">{modelHighlights.topConstructorModel?.modelScore || 0} / 100 team score</p>
          </div>
        </div>

        <div className="overflow-x-auto overflow-y-visible">
          <table className="f1-table">
            <thead>
              <tr>
                <th>Driver Model</th>
                <th>Team</th>
                <th>Form</th>
                <th>Consistency</th>
                <th>Racecraft Delta</th>
                <th>Finish Rate</th>
                <th>Pressure Index</th>
              </tr>
            </thead>
            <tbody>
              {driverModels.slice(0, 12).map((driverModel) => (
                <tr key={driverModel.driverId}>
                  <td>
                    <div className="font-medium text-f1-text">
                      P{driverModel.position} · {driverModel.name}
                    </div>
                    <div className="text-xs text-f1-muted">
                      {driverModel.avgFinish ? `Avg finish ${driverModel.avgFinish.toFixed(2)}` : 'Average finish unavailable'}
                    </div>
                  </td>
                  <td className="text-f1-text">{driverModel.teamName}</td>
                  <td>
                    <span className="rounded-full bg-f1-red/10 px-2.5 py-1 text-sm font-medium text-f1-red">
                      {driverModel.formIndex}
                    </span>
                  </td>
                  <td className="text-f1-text">{driverModel.consistencyIndex}</td>
                  <td className={driverModel.racecraftDelta >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                    {driverModel.racecraftDelta >= 0 ? '+' : ''}
                    {driverModel.racecraftDelta.toFixed(2)}
                  </td>
                  <td className="text-f1-text">{driverModel.finishingRate.toFixed(1)}%</td>
                  <td className="text-f1-text">{driverModel.pressureIndex}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {constructorModels.slice(0, 6).map((constructorModel) => (
            <div key={constructorModel.constructorId} className="rounded-xl border border-f1-gray/30 bg-f1-surface-soft/80 p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-f1-text">{constructorModel.constructorName}</h3>
                <span className="rounded-full bg-f1-red/10 px-2.5 py-1 text-sm font-medium text-f1-red">
                  {constructorModel.modelScore}
                </span>
              </div>

              <div className="space-y-3 text-sm">
                <div>
                  <div className="mb-1 flex items-center justify-between text-f1-muted">
                    <span>Efficiency</span>
                    <span>{constructorModel.efficiencyIndex}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-f1-gray/40">
                    <div className="h-full rounded-full bg-f1-red" style={{ width: `${constructorModel.efficiencyIndex}%` }} />
                  </div>
                </div>
                <div>
                  <div className="mb-1 flex items-center justify-between text-f1-muted">
                    <span>Lineup Balance</span>
                    <span>{constructorModel.balanceIndex}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-f1-gray/40">
                    <div className="h-full rounded-full bg-emerald-400" style={{ width: `${constructorModel.balanceIndex}%` }} />
                  </div>
                </div>
                <div>
                  <div className="mb-1 flex items-center justify-between text-f1-muted">
                    <span>Depth</span>
                    <span>{constructorModel.depthIndex}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-f1-gray/40">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.max(3, constructorModel.depthIndex)}%`,
                        backgroundColor: '#22d3ee',
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="f1-card p-6 mb-8">
        <h2 className="mb-6 flex items-center text-2xl font-semibold text-f1-text">
          <Target className="mr-2 h-6 w-6 text-f1-red" />
          Performance Insights
        </h2>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border border-f1-gray/30 bg-f1-surface-soft/70 p-4">
            <h3 className="mb-3 text-lg font-semibold text-f1-text">Points Distribution</h3>
            <div className="space-y-2">
              {drivers.slice(0, 5).map((driver) => {
                const leaderPoints = toNumber(drivers[0]?.points, 0);
                const percentage = leaderPoints > 0 ? (toNumber(driver.points) / leaderPoints) * 100 : 0;
                return (
                  <div key={driver.Driver.driverId} className="space-y-1">
                    <div className="flex justify-between text-sm text-f1-text">
                      <span>{driver.Driver.familyName}</span>
                      <span>{driver.points} pts</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-f1-gray/30">
                      <div className="h-full rounded-full bg-f1-red/80 transition-all duration-500" style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-xl border border-f1-gray/30 bg-f1-surface-soft/70 p-4">
            <h3 className="mb-3 text-lg font-semibold text-f1-text">Points to Leader</h3>
            <div className="space-y-2">
              {drivers.slice(1, 6).map((driver) => {
                const leaderPoints = toNumber(drivers[0]?.points, 0);
                const gap = leaderPoints - toNumber(driver.points);
                return (
                  <div key={driver.Driver.driverId} className="flex items-center justify-between text-sm">
                    <span className="text-f1-text">{driver.Driver.familyName}</span>
                    <span className="rounded-full bg-f1-red/10 px-2 py-1 text-f1-red">-{gap} pts</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-xl border border-f1-gray/30 bg-f1-surface-soft/70 p-4">
            <h3 className="mb-3 text-lg font-semibold text-f1-text">Constructor Dominance</h3>
            <div className="space-y-3">
              {constructors.slice(0, 5).map((constructor) => {
                const winsCount = drivers
                  .filter((driver) => driver.Constructors[0].constructorId === constructor.Constructor.constructorId)
                  .reduce((total, driver) => total + toNumber(driver.wins), 0);
                return (
                  <div key={constructor.Constructor.constructorId} className="flex items-center justify-between">
                    <span className="text-sm text-f1-text">{constructor.Constructor.name}</span>
                    <div className="flex items-center space-x-2">
                      <Trophy className="h-4 w-4 text-f1-red" />
                      <span className="text-sm text-f1-text">{winsCount}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="f1-card group relative overflow-hidden p-6">
        <div className="absolute inset-0 bg-gradient-to-br from-f1-red/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        <div className="flex items-center justify-between mb-6">
          <h2 className="flex items-center text-2xl font-semibold text-f1-text">
            <Users className="mr-2 h-6 w-6 text-f1-red" />
            Driver Standings
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="f1-table">
            <thead>
              <tr>
                <th>Position</th>
                <th>Driver</th>
                <th>Constructor</th>
                <th>Points</th>
                <th>Wins</th>
              </tr>
            </thead>
            <tbody>
              {drivers.map((driver) => (
                <tr key={driver.position}>
                  <td className="whitespace-nowrap">
                    <span
                      className={`inline-flex h-8 w-8 items-center justify-center rounded-full ${
                        driver.position === '1'
                          ? 'bg-f1-red text-white'
                          : driver.position === '2'
                            ? 'bg-gray-600 text-white'
                            : driver.position === '3'
                              ? 'bg-amber-700 text-white'
                              : 'bg-f1-gray/20 text-f1-text'
                      }`}
                    >
                      {driver.position}
                    </span>
                  </td>
                  <td className="whitespace-nowrap">
                    <div className="text-sm font-medium text-f1-text">
                      {driver.Driver.givenName} {driver.Driver.familyName}
                    </div>
                    <div className="text-sm text-f1-muted">{driver.Driver.nationality}</div>
                  </td>
                  <td className="whitespace-nowrap text-sm text-f1-text">{driver.Constructors[0].name}</td>
                  <td className="whitespace-nowrap">
                    <span className="rounded-full bg-f1-red/10 px-3 py-1 font-medium text-f1-red">{driver.points} pts</span>
                  </td>
                  <td className="whitespace-nowrap">
                    <div className="flex items-center text-sm text-f1-text">
                      <Trophy className="mr-2 h-4 w-4 text-f1-red" />
                      {driver.wins}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="f1-card group relative overflow-hidden p-6">
        <div className="absolute inset-0 bg-gradient-to-br from-f1-red/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        <div className="flex items-center justify-between mb-6">
          <h2 className="flex items-center text-2xl font-semibold text-f1-text">
            <Building2 className="mr-2 h-6 w-6 text-f1-red" />
            Constructor Standings
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="f1-table">
            <thead>
              <tr>
                <th>Position</th>
                <th>Constructor</th>
                <th>Nationality</th>
                <th>Points</th>
                <th>Wins</th>
              </tr>
            </thead>
            <tbody>
              {constructors.map((constructor) => (
                <tr key={constructor.position}>
                  <td className="whitespace-nowrap">
                    <span
                      className={`inline-flex h-8 w-8 items-center justify-center rounded-full ${
                        constructor.position === '1'
                          ? 'bg-f1-red text-white'
                          : constructor.position === '2'
                            ? 'bg-gray-600 text-white'
                            : constructor.position === '3'
                              ? 'bg-amber-700 text-white'
                              : 'bg-f1-gray/20 text-f1-text'
                      }`}
                    >
                      {constructor.position}
                    </span>
                  </td>
                  <td className="whitespace-nowrap text-sm text-f1-text">{constructor.Constructor.name}</td>
                  <td className="whitespace-nowrap">
                    <div className="flex items-center text-sm text-f1-text">
                      <Flag className="mr-2 h-4 w-4 text-f1-red" />
                      {constructor.Constructor.nationality}
                    </div>
                  </td>
                  <td className="whitespace-nowrap">
                    <span className="rounded-full bg-f1-red/10 px-3 py-1 font-medium text-f1-red">{constructor.points} pts</span>
                  </td>
                  <td className="whitespace-nowrap">
                    <div className="flex items-center text-sm text-f1-text">
                      <Trophy className="mr-2 h-4 w-4 text-f1-red" />
                      {constructor.wins}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {teamBattles.length > 0 && (
        <section className="f1-card group relative overflow-hidden p-6">
          <div className="absolute inset-0 bg-gradient-to-br from-f1-red/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          <h2 className="mb-6 flex items-center text-2xl font-semibold text-f1-text">
            <Users className="mr-2 h-6 w-6 text-f1-red" />
            Teammate Matchup Engine
          </h2>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {teamBattles.map((battle) => (
              <div
                key={battle.constructorName}
                className="rounded-xl border border-f1-gray/30 bg-f1-surface-soft/80 p-4 transition-colors duration-200 hover:bg-f1-surface-soft"
              >
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-lg font-semibold text-f1-text">{battle.constructorName}</h3>
                    <span className="rounded-full bg-f1-red/10 px-3 py-1 text-sm font-medium text-f1-red">
                      {battle.totalPoints} pts
                    </span>
                  </div>
                  <span className="rounded-full bg-f1-gray/20 px-2 py-1 text-xs text-f1-muted">
                    Confidence {battle.confidence}%
                  </span>
                </div>

                <div className="space-y-4">
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="text-f1-text">
                      {battle.driver1.name}
                      <span className="ml-2 rounded-full bg-f1-red/10 px-2 py-1 text-f1-red">{battle.driver1.points} pts</span>
                    </span>
                    <span className="text-f1-text">
                      <span className="mr-2 rounded-full bg-f1-red/10 px-2 py-1 text-f1-red">{battle.driver2.points} pts</span>
                      {battle.driver2.name}
                    </span>
                  </div>

                  <div className="relative h-2 overflow-hidden rounded-full bg-f1-gray/30">
                    <div
                      className="absolute left-0 top-0 h-full rounded-l-full bg-f1-red transition-all duration-500"
                      style={{ width: `${battle.pointsPercentage}%` }}
                    />
                    <div
                      className="absolute right-0 top-0 h-full rounded-r-full bg-gradient-to-r from-f1-gray to-f1-gray/60 transition-all duration-500"
                      style={{ width: `${100 - battle.pointsPercentage}%` }}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs text-f1-muted">
                    <div className="rounded-lg border border-f1-gray/20 bg-f1-surface/70 p-2">
                      <span className="block uppercase tracking-[0.1em]">Head to Head</span>
                      <span className="mt-1 inline-flex items-center text-sm font-semibold text-f1-text">{battle.headToHead}</span>
                    </div>
                    <div className="rounded-lg border border-f1-gray/20 bg-f1-surface/70 p-2">
                      <span className="block uppercase tracking-[0.1em]">Compared Races</span>
                      <span className="mt-1 inline-flex items-center text-sm font-semibold text-f1-text">{battle.comparedRaces}</span>
                    </div>
                  </div>

                  <div className="flex justify-between text-xs text-f1-muted">
                    <div>
                      <span className="mr-2">Championship: P{battle.driver1.position}</span>
                      <span className="rounded-full bg-f1-red/10 px-2 py-1 text-f1-red">
                        {battle.driver1.wins} {battle.driver1.wins === 1 ? 'win' : 'wins'}
                      </span>
                    </div>
                    <div>
                      <span className="rounded-full bg-f1-red/10 px-2 py-1 text-f1-red">
                        {battle.driver2.wins} {battle.driver2.wins === 1 ? 'win' : 'wins'}
                      </span>
                      <span className="ml-2">Championship: P{battle.driver2.position}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="f1-card p-4">
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <span className="inline-flex items-center gap-1 rounded-full border border-f1-gray/35 bg-f1-surface-soft px-3 py-1 text-f1-muted">
            <Gauge className="h-3.5 w-3.5 text-f1-red" />
            Model scores are derived from standings + race result context
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-f1-gray/35 bg-f1-surface-soft px-3 py-1 text-f1-muted">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            Transparent heuristics, no hidden weighting
          </span>
        </div>
      </section>
    </div>
  );
};

export default Profiles;
