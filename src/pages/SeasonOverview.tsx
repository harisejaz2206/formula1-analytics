/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Calendar,
  Flag,
  Gauge,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
} from 'lucide-react';
import ErrorMessage from '../components/ErrorMessage';
import LoadingSpinner from '../components/LoadingSpinner';
import PageHeader from '../components/layout/PageHeader';
import {
  getConstructorStandings,
  getDriverStandings,
  getSeasonResults,
  getSeasons,
} from '../services/api';

const toNumber = (value: string | number | undefined, fallback = 0) => {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallback;
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const average = (values: number[]) => {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
};

const driverPalette = ['#E10600', '#00D2BE', '#FF8700', '#005AFF', '#B65BFF'];

const chartAxisTick = { fill: '#8EA0C9', fontSize: 12 };
const chartGrid = { stroke: 'rgba(126, 142, 175, 0.25)' };
const chartTooltipStyle = {
  backgroundColor: 'rgb(var(--f1-surface))',
  border: '1px solid rgb(var(--f1-surface-2))',
  borderRadius: '12px',
  color: 'rgb(var(--f1-text))',
  boxShadow: '0 10px 28px rgba(4, 10, 28, 0.35)',
};

const SeasonOverview: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [seasonNotice, setSeasonNotice] = useState<string | null>(null);
  const [selectedSeason, setSelectedSeason] = useState<string>(new Date().getFullYear().toString());
  const [resolvedSeason, setResolvedSeason] = useState<string>('');
  const [availableSeasons, setAvailableSeasons] = useState<string[]>([]);
  const [driverStandings, setDriverStandings] = useState<any[]>([]);
  const [constructorStandings, setConstructorStandings] = useState<any[]>([]);
  const [seasonResults, setSeasonResults] = useState<any[]>([]);

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
        console.error('Failed to load season list:', fetchError);
        setError('Failed to load season list.');
      }
    };

    fetchSeasons();
  }, []);

  useEffect(() => {
    const fetchSeasonModuleData = async () => {
      if (!selectedSeason || availableSeasons.length === 0) return;

      setLoading(true);
      setError(null);
      setSeasonNotice(null);

      const loadSeasonPayload = async (season: string) => {
        const [drivers, constructors, results] = await Promise.all([
          getDriverStandings(season),
          getConstructorStandings(season),
          getSeasonResults(season),
        ]);

        if (!drivers?.length || !constructors?.length) {
          return null;
        }

        return {
          season,
          drivers,
          constructors,
          results: results || [],
        };
      };

      try {
        let payload = await loadSeasonPayload(selectedSeason);

        if (!payload) {
          const fallbackSeasons = availableSeasons
            .filter((season) => season !== selectedSeason)
            .sort((a, b) => parseInt(b, 10) - parseInt(a, 10));

          for (const fallbackSeason of fallbackSeasons) {
            const fallbackPayload = await loadSeasonPayload(fallbackSeason);
            if (fallbackPayload) {
              payload = fallbackPayload;
              break;
            }
          }
        }

        if (!payload) {
          setError('No standings data is available for the selected or previous seasons.');
          setResolvedSeason('');
          return;
        }

        if (payload.season !== selectedSeason) {
          setSeasonNotice(`${selectedSeason} data is incomplete. Showing ${payload.season} storyline data.`);
        }

        setResolvedSeason(payload.season);
        setDriverStandings(payload.drivers);
        setConstructorStandings(payload.constructors);
        setSeasonResults(payload.results);
      } catch (fetchError) {
        console.error('Failed to load season storyline module:', fetchError);
        setError('Failed to load season storyline data. Please try again.');
        setResolvedSeason('');
      } finally {
        setLoading(false);
      }
    };

    fetchSeasonModuleData();
  }, [selectedSeason, availableSeasons]);

  const seasonStoryline = useMemo(() => {
    if (!driverStandings.length || !constructorStandings.length) return null;

    const topDrivers = driverStandings.slice(0, 5).map((driver: any, index: number) => {
      const givenName = driver.Driver?.givenName ?? 'Unknown';
      const familyName = driver.Driver?.familyName ?? '';
      const code = driver.Driver?.code;

      return {
        driverId: driver.Driver?.driverId ?? `driver-${index}`,
        name: `${givenName} ${familyName}`.trim(),
        chartKey: `${code || familyName || 'Driver'}_${index}`,
        shortLabel: code || `${givenName.slice(0, 1)}.${familyName}` || `D${index + 1}`,
        points: toNumber(driver.points),
        wins: toNumber(driver.wins),
        position: toNumber(driver.position, index + 1),
      };
    });

    const topConstructors = constructorStandings.slice(0, 6).map((constructor: any) => ({
      constructorId: constructor.Constructor?.constructorId,
      name: constructor.Constructor?.name ?? 'Unknown Constructor',
      points: toNumber(constructor.points),
      wins: toNumber(constructor.wins),
    }));

    const races = [...seasonResults].sort((a, b) => toNumber(a.round) - toNumber(b.round));
    const topDriverIds = new Set(topDrivers.map((driver) => driver.driverId));
    const cumulativeByDriver = new Map<string, number>();
    topDrivers.forEach((driver) => cumulativeByDriver.set(driver.driverId, 0));

    const cumulativeSeries: any[] = [];
    const titleGapSeries: Array<{
      round: number;
      raceName: string;
      leader: string;
      chaser: string;
      winner: string;
      winnerTeam: string;
      gap: number;
      gapShift: number;
    }> = [];

    let previousGap: number | null = null;

    races.forEach((race: any) => {
      const round = toNumber(race.round);
      const raceName = race.raceName || `Round ${round}`;
      const raceResults = race.Results || [];

      const pointsByDriver = new Map<string, number>();
      raceResults.forEach((result: any) => {
        const driverId = result.Driver?.driverId;
        if (!driverId || !topDriverIds.has(driverId)) return;
        pointsByDriver.set(driverId, toNumber(result.points));
      });

      const cumulativeRow: any = {
        round,
        raceName,
      };

      topDrivers.forEach((driver) => {
        const nextPoints = (cumulativeByDriver.get(driver.driverId) || 0) + (pointsByDriver.get(driver.driverId) || 0);
        cumulativeByDriver.set(driver.driverId, nextPoints);
        cumulativeRow[driver.chartKey] = nextPoints;
        cumulativeRow[`${driver.chartKey}_race`] = pointsByDriver.get(driver.driverId) || 0;
      });

      const ranking = topDrivers
        .map((driver) => ({
          name: driver.name,
          points: cumulativeByDriver.get(driver.driverId) || 0,
        }))
        .sort((a, b) => b.points - a.points);

      const leader = ranking[0];
      const chaser = ranking[1] ?? ranking[0];
      const gap = Math.max(0, leader.points - chaser.points);
      const gapShift = previousGap === null ? 0 : previousGap - gap;
      previousGap = gap;

      const winnerResult = raceResults.find((result: any) => toNumber(result.position, 99) === 1) || raceResults[0];
      const winner = winnerResult
        ? `${winnerResult.Driver?.givenName ?? ''} ${winnerResult.Driver?.familyName ?? ''}`.trim()
        : 'Unknown';
      const winnerTeam = winnerResult?.Constructor?.name ?? 'Unknown';

      cumulativeSeries.push(cumulativeRow);
      titleGapSeries.push({
        round,
        raceName,
        leader: leader?.name ?? 'Unknown',
        chaser: chaser?.name ?? 'Unknown',
        winner,
        winnerTeam,
        gap,
        gapShift,
      });
    });

    const topGap = topDrivers.length > 1 ? topDrivers[0].points - topDrivers[1].points : 0;
    const constructorGap = topConstructors.length > 1 ? topConstructors[0].points - topConstructors[1].points : 0;
    const racesAnalyzed = races.length;
    const titlePressureIndex = clamp(Math.round(100 - topGap * 1.6 + Math.min(racesAnalyzed * 1.2, 28)), 10, 96);
    const titleControlIndex = clamp(Math.round(100 - titlePressureIndex + topDrivers[0].wins * 3), 8, 96);
    const constructorParityIndex = clamp(Math.round(100 - constructorGap * 0.9), 14, 95);

    const seasonPhase =
      racesAnalyzed <= 6
        ? 'Launch Phase'
        : racesAnalyzed <= 16
          ? 'Mid-season Adaptation'
          : 'Championship Run-in';

    const volatilityWindow = titleGapSeries.slice(-5).map((race) => Math.abs(race.gapShift));
    const storylineVolatility = clamp(Math.round(average(volatilityWindow) * 7), 8, 94);

    const momentumWindow = cumulativeSeries.slice(-5);
    const driverMomentum = topDrivers.slice(0, 4).map((driver) => {
      const recentPoints = momentumWindow.map((race) => toNumber(race[`${driver.chartKey}_race`], 0));
      const recentAverage = average(recentPoints);
      const latestPoints = recentPoints[recentPoints.length - 1] || 0;
      const baselineAverage = recentPoints.length > 1 ? average(recentPoints.slice(0, -1)) : recentAverage;
      const delta = latestPoints - baselineAverage;
      const trend = delta > 2.5 ? 'Surging' : delta < -2.5 ? 'Cooling' : 'Stable';
      const intensity = clamp(Math.round((recentAverage / 26) * 100), 10, 100);

      return {
        name: driver.name,
        shortLabel: driver.shortLabel,
        trend,
        delta,
        recentAverage,
        recentPoints,
        intensity,
      };
    });

    const swingMoments = titleGapSeries
      .filter((race, index) => index > 0)
      .sort((a, b) => Math.abs(b.gapShift) - Math.abs(a.gapShift))
      .slice(0, 4);

    const constructorLeaderPoints = topConstructors[0]?.points || 1;
    const constructorShareSeries = topConstructors.map((constructor) => ({
      ...constructor,
      share: clamp(Math.round((constructor.points / constructorLeaderPoints) * 100), 1, 100),
    }));

    const storylineHeadline =
      titlePressureIndex >= 78
        ? 'Title fight is live and volatile, with momentum still changing race to race.'
        : titlePressureIndex >= 55
          ? 'Championship pressure remains active, but the leader has partial control.'
          : 'Current season trend shows a controlled campaign with limited title volatility.';

    return {
      topDrivers,
      topConstructors,
      cumulativeSeries,
      titleGapSeries,
      constructorShareSeries,
      driverMomentum,
      swingMoments,
      titlePressureIndex,
      titleControlIndex,
      constructorParityIndex,
      storylineVolatility,
      storylineHeadline,
      seasonPhase,
      racesAnalyzed,
      topGap,
      constructorGap,
    };
  }, [driverStandings, constructorStandings, seasonResults]);

  if (loading) return <LoadingSpinner label="Loading season storyline intelligence..." />;
  if (error) return <ErrorMessage message={error} />;
  if (!seasonStoryline) return <ErrorMessage message="Season storyline data is unavailable." />;

  const headlineSignals = [
    {
      label: 'Title Pressure',
      value: seasonStoryline.titlePressureIndex,
      caption: `P1-P2 gap: ${seasonStoryline.topGap} pts`,
      icon: Gauge,
    },
    {
      label: 'Leader Control',
      value: seasonStoryline.titleControlIndex,
      caption: `${seasonStoryline.topDrivers[0]?.name || 'Leader'} command`,
      icon: Trophy,
    },
    {
      label: 'Constructor Parity',
      value: seasonStoryline.constructorParityIndex,
      caption: `Top team gap: ${seasonStoryline.constructorGap} pts`,
      icon: Target,
    },
    {
      label: 'Storyline Volatility',
      value: seasonStoryline.storylineVolatility,
      caption: 'Gap swing intensity (last races)',
      icon: Sparkles,
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        icon={TrendingUp}
        overline="SEASON STORYLINE LAB"
        title={`${resolvedSeason || selectedSeason} Championship Narrative`}
        subtitle="Momentum arcs, title pressure diagnostics, and race-by-race swing analysis for a full-season intelligence read."
      />

      <section className="f1-card p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="f1-overline">Story Engine Input</p>
            <h2 className="mt-2 text-2xl font-semibold text-f1-text">Season Context</h2>
            <p className="mt-1 text-sm text-f1-muted">
              Phase: <span className="text-f1-text">{seasonStoryline.seasonPhase}</span> • Races analyzed:{' '}
              <span className="text-f1-text">{seasonStoryline.racesAnalyzed}</span>
            </p>
            {seasonNotice && (
              <p className="mt-2 rounded-lg border border-amber-500/35 bg-amber-500/10 px-3 py-2 text-sm text-amber-300">
                {seasonNotice}
              </p>
            )}
          </div>

          <div className="w-full max-w-xs">
            <label className="mb-2 flex items-center text-sm font-medium uppercase tracking-[0.14em] text-f1-muted">
              <Calendar className="mr-2 h-4 w-4 text-f1-red" />
              Season
            </label>
            <select
              value={selectedSeason}
              onChange={(event) => setSelectedSeason(event.target.value)}
              className="f1-select"
            >
              {availableSeasons.map((season) => (
                <option key={season} value={season}>
                  {season}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-5 rounded-xl border border-f1-gray/30 bg-f1-surface-soft/80 p-4">
          <p className="text-sm text-f1-muted">{seasonStoryline.storylineHeadline}</p>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        {headlineSignals.map((signal) => {
          const Icon = signal.icon;
          return (
            <article key={signal.label} className="f1-card p-5">
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.14em] text-f1-muted">{signal.label}</p>
                  <p className="mt-2 text-3xl font-semibold text-f1-text">{signal.value}</p>
                </div>
                <div className="rounded-lg border border-f1-red/35 bg-f1-red/10 p-2 text-f1-red">
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <p className="mb-3 text-xs text-f1-muted">{signal.caption}</p>
              <div className="h-1.5 overflow-hidden rounded-full bg-f1-surface-2/55">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-f1-red/75 to-f1-neon/75"
                  style={{ width: `${signal.value}%` }}
                />
              </div>
            </article>
          );
        })}
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        <article className="f1-card p-6 xl:col-span-3">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="f1-overline">Championship Arc</p>
              <h3 className="mt-1 text-xl font-semibold text-f1-text">Top Driver Cumulative Progression</h3>
            </div>
            <Flag className="h-5 w-5 text-f1-red" />
          </div>

          <div className="h-[360px]">
            {seasonStoryline.cumulativeSeries.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={seasonStoryline.cumulativeSeries} margin={{ left: 4, right: 14, top: 12, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" {...chartGrid} />
                  <XAxis dataKey="round" tick={chartAxisTick} />
                  <YAxis tick={chartAxisTick} />
                  <Tooltip
                    contentStyle={chartTooltipStyle}
                    labelStyle={{ color: 'rgb(var(--f1-text))' }}
                    formatter={(value: any, key: string) => {
                      const driver = seasonStoryline.topDrivers.find((item) => item.chartKey === key);
                      return [`${value} pts`, driver?.name || key];
                    }}
                    labelFormatter={(label) => {
                      const row = seasonStoryline.cumulativeSeries.find((item) => item.round === label);
                      return row ? `Round ${label}: ${row.raceName}` : `Round ${label}`;
                    }}
                  />
                  <Legend
                    wrapperStyle={{ color: '#9FB0D7' }}
                    formatter={(key: string) => seasonStoryline.topDrivers.find((driver) => driver.chartKey === key)?.shortLabel || key}
                  />
                  {seasonStoryline.topDrivers.map((driver, index) => (
                    <Line
                      key={driver.chartKey}
                      type="monotone"
                      dataKey={driver.chartKey}
                      stroke={driverPalette[index % driverPalette.length]}
                      strokeWidth={2.4}
                      dot={false}
                      activeDot={{ r: 4 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center rounded-xl border border-f1-gray/35 bg-f1-surface-soft/70 text-sm text-f1-muted">
                No race-by-race results available yet for this season.
              </div>
            )}
          </div>
        </article>

        <article className="f1-card p-6 xl:col-span-2">
          <div className="mb-4">
            <p className="f1-overline">Title Gap Trend</p>
            <h3 className="mt-1 text-xl font-semibold text-f1-text">Leader Margin by Round</h3>
          </div>

          <div className="h-[360px]">
            {seasonStoryline.titleGapSeries.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={seasonStoryline.titleGapSeries} margin={{ left: 0, right: 14, top: 12, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gapGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#E10600" stopOpacity={0.6} />
                      <stop offset="95%" stopColor="#E10600" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" {...chartGrid} />
                  <XAxis dataKey="round" tick={chartAxisTick} />
                  <YAxis tick={chartAxisTick} />
                  <Tooltip
                    contentStyle={chartTooltipStyle}
                    labelStyle={{ color: 'rgb(var(--f1-text))' }}
                    formatter={(value: any) => [`${value} pts`, 'Leader gap']}
                    labelFormatter={(label) => {
                      const row = seasonStoryline.titleGapSeries.find((item) => item.round === label);
                      if (!row) return `Round ${label}`;
                      return `Round ${label}: ${row.raceName}`;
                    }}
                  />
                  <Area type="monotone" dataKey="gap" stroke="#E10600" fill="url(#gapGradient)" strokeWidth={2.2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center rounded-xl border border-f1-gray/35 bg-f1-surface-soft/70 text-sm text-f1-muted">
                Gap trend will appear once race history is available.
              </div>
            )}
          </div>
        </article>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        <article className="f1-card p-6 xl:col-span-2">
          <div className="mb-5">
            <p className="f1-overline">Momentum Radar</p>
            <h3 className="mt-1 text-xl font-semibold text-f1-text">Last 5-Race Driver Form</h3>
          </div>

          <div className="space-y-4">
            {seasonStoryline.driverMomentum.map((driver) => (
              <div key={driver.name} className="rounded-xl border border-f1-gray/30 bg-f1-surface-soft/75 p-3.5">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-medium text-f1-text">{driver.name}</p>
                  <span className="text-xs text-f1-muted">{driver.trend}</span>
                </div>
                <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-f1-surface-2/60">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-f1-neon/75 to-f1-red/75"
                    style={{ width: `${driver.intensity}%` }}
                  />
                </div>
                <p className="text-xs text-f1-muted">
                  Avg: <span className="text-f1-text">{driver.recentAverage.toFixed(1)} pts/race</span> • Delta:{' '}
                  <span className={driver.delta >= 0 ? 'text-emerald-400' : 'text-rose-400'}>{driver.delta.toFixed(1)}</span>
                </p>
              </div>
            ))}
          </div>
        </article>

        <article className="f1-card p-6 xl:col-span-3">
          <div className="mb-4">
            <p className="f1-overline">Constructor Shape</p>
            <h3 className="mt-1 text-xl font-semibold text-f1-text">Team Output Relative to Championship Leader</h3>
          </div>

          <div className="h-[310px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={seasonStoryline.constructorShareSeries} layout="vertical" margin={{ left: 8, right: 16, top: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" {...chartGrid} />
                <XAxis type="number" tick={chartAxisTick} domain={[0, 100]} />
                <YAxis type="category" dataKey="name" tick={chartAxisTick} width={122} />
                <Tooltip
                  contentStyle={chartTooltipStyle}
                  labelStyle={{ color: 'rgb(var(--f1-text))' }}
                  formatter={(value: any, key: string, payload: any) => {
                    if (key === 'share') return [`${value}%`, 'Relative pace index'];
                    if (key === 'points') return [`${value} pts`, 'Points'];
                    return [value, payload?.name || key];
                  }}
                />
                <Bar dataKey="share" fill="url(#constructorBarGradient)" radius={[0, 8, 8, 0]} />
                <defs>
                  <linearGradient id="constructorBarGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#E10600" stopOpacity={0.92} />
                    <stop offset="100%" stopColor="#00D2BE" stopOpacity={0.9} />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <article className="f1-card p-6 xl:col-span-2">
          <div className="mb-4">
            <p className="f1-overline">Critical Swing Moments</p>
            <h3 className="mt-1 text-xl font-semibold text-f1-text">Where the Championship Narrative Shifted</h3>
          </div>

          {seasonStoryline.swingMoments.length > 0 ? (
            <div className="space-y-3">
              {seasonStoryline.swingMoments.map((moment) => (
                <div
                  key={`${moment.round}-${moment.raceName}`}
                  className="flex flex-col gap-2 rounded-xl border border-f1-gray/30 bg-f1-surface-soft/80 p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <p className="text-sm font-semibold text-f1-text">
                      Round {moment.round}: {moment.raceName}
                    </p>
                    <p className="text-xs text-f1-muted">
                      Winner: {moment.winner} ({moment.winnerTeam})
                    </p>
                  </div>
                  <div className="text-left md:text-right">
                    <p className={`text-sm font-semibold ${moment.gapShift >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {moment.gapShift >= 0 ? 'Gap Closed' : 'Gap Extended'} {Math.abs(moment.gapShift).toFixed(1)} pts
                    </p>
                    <p className="text-xs text-f1-muted">
                      Leader after race: {moment.leader} ({moment.gap.toFixed(1)} pts ahead)
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-f1-gray/35 bg-f1-surface-soft/70 p-4 text-sm text-f1-muted">
              Swing moments will populate as race history becomes available.
            </div>
          )}
        </article>

        <article className="f1-card p-6">
          <div className="mb-4">
            <p className="f1-overline">Interpretation Layer</p>
            <h3 className="mt-1 text-xl font-semibold text-f1-text">How to Read This Module</h3>
          </div>

          <div className="space-y-3 text-sm text-f1-muted">
            <div className="rounded-lg border border-f1-gray/30 bg-f1-surface-soft/75 p-3">
              <p className="font-medium text-f1-text">Title Pressure</p>
              <p className="mt-1">Higher score means smaller points gap and more race-to-race uncertainty.</p>
            </div>
            <div className="rounded-lg border border-f1-gray/30 bg-f1-surface-soft/75 p-3">
              <p className="font-medium text-f1-text">Leader Control</p>
              <p className="mt-1">Measures how strongly the current leader can absorb bad weekends.</p>
            </div>
            <div className="rounded-lg border border-f1-gray/30 bg-f1-surface-soft/75 p-3">
              <p className="font-medium text-f1-text">Volatility</p>
              <p className="mt-1">Derived from recent title-gap swings, highlighting storyline instability.</p>
            </div>
            <div className="rounded-lg border border-f1-gray/30 bg-f1-surface-soft/75 p-3">
              <p className="font-medium text-f1-text">Constructor Parity</p>
              <p className="mt-1">Compares team output against the best team baseline in the same season.</p>
            </div>
          </div>
        </article>
      </section>
    </div>
  );
};

export default SeasonOverview;
