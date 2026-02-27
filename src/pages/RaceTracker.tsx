/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo, useState } from 'react';
import { getRaceResults, getLapTimes, getSeasons, getRounds, getPitStops } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import SeasonSelector from '../components/SeasonSelector';
import RoundSelector from '../components/RoundSelector';
import PageHeader from '../components/layout/PageHeader';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer
} from 'recharts';
import { Activity, AlertTriangle, Trophy, Flag, Clock, MapPin, Timer } from 'lucide-react';

const isFinishedStatus = (status: string | undefined) => Boolean(status && (status === 'Finished' || status.startsWith('+')));

const getDriverFullName = (result: any) => `${result.Driver.givenName} ${result.Driver.familyName}`;

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const RaceTracker: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [seasons, setSeasons] = useState<any[]>([]);
  const [rounds, setRounds] = useState<any[]>([]);
  const [selectedSeason, setSelectedSeason] = useState(new Date().getFullYear().toString());
  const [selectedRound, setSelectedRound] = useState('1');
  const [raceData, setRaceData] = useState<any>(null);
  const [lapTimes, setLapTimes] = useState<any[]>([]);

  const [pitStops, setPitStops] = useState<any[]>([]);
  const [positionChanges, setPositionChanges] = useState<any[]>([]);
  const [qualifyingComparison, setQualifyingComparison] = useState<any[]>([]);

  useEffect(() => {
    const fetchSeasons = async () => {
      try {
        const seasonsData = await getSeasons();
        const transformedSeasons = seasonsData.map((season: any) => season.season);
        setSeasons(transformedSeasons);
      } catch {
        setError('Failed to load seasons');
      }
    };
    fetchSeasons();
  }, []);

  useEffect(() => {
    const fetchRounds = async () => {
      try {
        const roundsData = await getRounds(selectedSeason);
        setRounds(roundsData);
        if (roundsData.length > 0) {
          // For current season, find the most recent completed race or upcoming race
          const currentDate = new Date();
          let bestRound = roundsData[0];
          
          if (selectedSeason === currentDate.getFullYear().toString()) {
            // Find the most recent race (completed) or next upcoming race
            const completedRaces = roundsData.filter((race: any) => {
              const raceDate = new Date(race.date);
              return raceDate <= currentDate;
            });
            
            if (completedRaces.length > 0) {
              // Use the most recent completed race
              bestRound = completedRaces[completedRaces.length - 1];
            } else {
              // All races are in the future, use the first upcoming one
              bestRound = roundsData[0];
            }
          } else {
            // For past seasons, start with the last race of the season
            bestRound = roundsData[roundsData.length - 1];
          }
          
          setSelectedRound(bestRound.round);
        }
      } catch {
        setError('Failed to load rounds');
      }
    };
    fetchRounds();
  }, [selectedSeason]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      // Reset all data when switching races
      setRaceData(null);
      setLapTimes([]);
      setPitStops([]);
      setPositionChanges([]);
      setQualifyingComparison([]);
      
      try {
        // First, get the race information
        const race = await getRaceResults(selectedSeason, selectedRound);
        
        if (!race || !race.Results || race.Results.length === 0) {
          // Race hasn't happened yet or no data available
          setError('This race has not taken place yet or no data is available.');
          return;
        }
        
        setRaceData(race);
      } catch {
        setError('Failed to load race data. This race may not have happened yet.');
      } finally {
        setLoading(false);
      }
    };

    if (selectedSeason && selectedRound) {
      fetchData();
    }
  }, [selectedSeason, selectedRound]);

  useEffect(() => {
    const fetchDetailedData = async () => {
      if (!raceData || !raceData.Results || raceData.Results.length === 0) return;

      try {
        // Check if this is a completed race (has actual results, not just a scheduled race)
        const hasValidResults = raceData.Results.some((result: any) => 
          result.position && result.status && (result.Time || result.status !== 'Not Available')
        );

        if (!hasValidResults) {
          console.log('Race data exists but race appears to be scheduled/not completed yet');
          return;
        }

        // Only fetch detailed data for completed races
        const [lapTimesData, pitStopsData] = await Promise.all([
          // Fetch lap times for top 5 drivers
          Promise.all(
            raceData.Results.slice(0, 5).map(async (result: any) => {
              try {
                const laps = await getLapTimes(selectedSeason, selectedRound, result.Driver.driverId);
                return {
                  driver: `${result.Driver.givenName} ${result.Driver.familyName}`,
                  laps: laps.map((lap: any) => ({
                    lapNumber: parseInt(lap.number),
                    time: lap.Timings[0]?.time || null
                  }))
                };
              } catch (error) {
                console.warn(`Failed to fetch lap times for ${result.Driver.familyName}:`, error);
                return null;
              }
            })
          ).then(results => results.filter(Boolean)), // Filter out failed requests
          
          // Fetch pit stops data
          getPitStops(selectedSeason, selectedRound).catch(error => {
            console.warn('Failed to fetch pit stops:', error);
            return [];
          })
        ]);

        // Transform lap times data for chart
        if (lapTimesData.length > 0 && lapTimesData[0]?.laps.length > 0) {
          const chartData = lapTimesData[0].laps.map((lap: any, index: number) => {
            const lapData: any = { lap: lap.lapNumber };
            lapTimesData.forEach((driver: any) => {
              if (driver?.laps[index]?.time) {
                lapData[driver.driver] = convertLapTimeToSeconds(driver.laps[index].time);
              }
            });
            return lapData;
          });
          setLapTimes(chartData);
        }

        // Transform pit stops data
        if (pitStopsData.length > 0) {
          const transformedPitStops = pitStopsData.map((stop: any) => ({
            driverName: raceData.Results.find((r: any) => r.Driver.driverId === stop.driverId)
              ?.Driver.familyName || stop.driverId,
            stop: parseInt(stop.stop),
            lap: parseInt(stop.lap),
            duration: parseFloat(stop.duration),
            cumulativeTime: convertDurationToSeconds(stop.duration)
          }));
          setPitStops(transformedPitStops);
        }

      } catch (error) {
        console.error('Error fetching detailed race data:', error);
      }
    };

    fetchDetailedData();
  }, [raceData, selectedSeason, selectedRound]);

  useEffect(() => {
    if (!raceData) return;

    // Calculate position changes for each driver
    const changes = raceData.Results.map((result: any) => {
      const startPos = result.grid === "0" ? "Pit" : parseInt(result.grid);
      const endPos = parseInt(result.position);
      const change = startPos === "Pit" ? "N/A" : startPos - endPos;

      return {
        driverName: `${result.Driver.givenName} ${result.Driver.familyName}`,
        constructor: result.Constructor.name,
        startPosition: startPos,
        endPosition: endPos,
        positionChange: change,
        status: result.status
      };
    });

    setPositionChanges(changes);
  }, [raceData]);

  useEffect(() => {
    if (!raceData) return;

    // Transform qualifying data
    const comparison = raceData.Results.map((result: any) => {
      const gridPosition = result.grid === "0" ? "Pit" : parseInt(result.grid);
      const timeBehindLeader = result.Time?.time || "DNF";
      const fastestLapTime = result.FastestLap?.Time?.time || "No time";
      const fastestLapSpeed = result.FastestLap?.AverageSpeed?.speed || "N/A";

      return {
        driverName: `${result.Driver.givenName} ${result.Driver.familyName}`,
        constructor: result.Constructor.name,
        gridPosition,
        finishTime: timeBehindLeader,
        fastestLap: fastestLapTime,
        averageSpeed: fastestLapSpeed,
        points: parseInt(result.points)
      };
    });

    setQualifyingComparison(comparison);
  }, [raceData]);

  // Helper functions
  const convertLapTimeToSeconds = (timeStr: string) => {
    const [minutes, seconds] = timeStr.split(':');
    return parseFloat(minutes) * 60 + parseFloat(seconds);
  };

  const convertDurationToSeconds = (duration: string) => {
    return parseFloat(duration);
  };



  // Group pit stops by driver for the summary
  const getPitStopSummary = (data: any[]) => {
    const summary = data.reduce((acc: any, stop: any) => {
      if (!acc[stop.driverName]) {
        acc[stop.driverName] = {
          stops: 0,
          totalTime: 0
        };
      }
      acc[stop.driverName].stops++;
      acc[stop.driverName].totalTime += stop.duration;
      return acc;
    }, {});

    return Object.entries(summary).map(([driver, data]: [string, any]) => ({
      driver,
      stops: data.stops,
      avgDuration: data.totalTime / data.stops,
      totalTime: data.totalTime
    }));
  };

  const liveRaceIntelligence = useMemo(() => {
    if (!raceData?.Results?.length) {
      return null;
    }

    const results = raceData.Results;
    const winner = results[0];
    const retirements = results.filter((result: any) => !isFinishedStatus(result.status));
    const numericChanges = positionChanges.filter((change: any) => typeof change.positionChange === 'number');
    const biggestGainer =
      numericChanges.length > 0
        ? [...numericChanges].sort((a: any, b: any) => b.positionChange - a.positionChange)[0]
        : null;
    const biggestLoser =
      numericChanges.length > 0
        ? [...numericChanges].sort((a: any, b: any) => a.positionChange - b.positionChange)[0]
        : null;
    const fastestPitStop =
      pitStops.length > 0
        ? pitStops.reduce((fastest: any, current: any) => (current.duration < fastest.duration ? current : fastest), pitStops[0])
        : null;
    const averagePitLap =
      pitStops.length > 0 ? Math.round(pitStops.reduce((sum: number, stop: any) => sum + stop.lap, 0) / pitStops.length) : null;
    const volatilityScore = clamp(
      Math.round(
        numericChanges.reduce((total: number, change: any) => total + Math.abs(change.positionChange), 0) * 4 +
          retirements.length * 17 +
          pitStops.length * 1.4,
      ),
      18,
      95,
    );

    const lapSpreadAverage =
      lapTimes.length > 0
        ? lapTimes.reduce((sum: number, lap: any) => {
            const values = Object.entries(lap)
              .filter(([key, value]) => key !== 'lap' && typeof value === 'number')
              .map(([, value]) => Number(value));
            if (values.length < 2) {
              return sum;
            }
            return sum + (Math.max(...values) - Math.min(...values));
          }, 0) / lapTimes.length
        : 0;

    const confidence = clamp(
      58 +
        (lapTimes.length > 0 ? 16 : 0) +
        (pitStops.length > 0 ? 15 : 0) +
        (numericChanges.length > 0 ? 8 : 0) +
        (results.some((result: any) => Boolean(result.FastestLap)) ? 4 : 0),
      52,
      97,
    );

    const volatilityBand = volatilityScore >= 70 ? 'High' : volatilityScore >= 42 ? 'Moderate' : 'Low';
    const paceBand = lapSpreadAverage >= 1.25 ? 'High spread' : lapSpreadAverage >= 0.8 ? 'Balanced spread' : 'Tight spread';

    return {
      winnerName: getDriverFullName(winner),
      winnerTeam: winner.Constructor.name,
      winnerTime: winner.Time?.time || winner.status,
      retirements,
      biggestGainer,
      biggestLoser,
      fastestPitStop,
      averagePitLap,
      volatilityScore,
      volatilityBand,
      confidence,
      totalPitStops: pitStops.length,
      paceBand,
      lapSpreadAverage,
    };
  }, [lapTimes, pitStops, positionChanges, raceData]);

  const liveSignalFeed = useMemo(() => {
    if (!liveRaceIntelligence) {
      return [];
    }

    const feed = [
      {
        tag: 'Winner Lock',
        message: `${liveRaceIntelligence.winnerName} (${liveRaceIntelligence.winnerTeam}) secured P1 in ${liveRaceIntelligence.winnerTime}.`,
        tone: 'text-emerald-400',
      },
      liveRaceIntelligence.biggestGainer
        ? {
            tag: 'Position Surge',
            message: `${liveRaceIntelligence.biggestGainer.driverName} gained +${liveRaceIntelligence.biggestGainer.positionChange} places from grid.`,
            tone: 'text-cyan-400',
          }
        : null,
      liveRaceIntelligence.fastestPitStop
        ? {
            tag: 'Pit Benchmark',
            message: `${liveRaceIntelligence.fastestPitStop.driverName} posted fastest stop: ${liveRaceIntelligence.fastestPitStop.duration.toFixed(3)}s.`,
            tone: 'text-f1-red',
          }
        : null,
      liveRaceIntelligence.retirements.length > 0
        ? {
            tag: 'Reliability Alert',
            message: `${liveRaceIntelligence.retirements.length} non-finishes flagged. Highest risk condition: ${liveRaceIntelligence.retirements[0].status}.`,
            tone: 'text-amber-400',
          }
        : {
            tag: 'Reliability',
            message: 'No retirement events detected in this race result set.',
            tone: 'text-emerald-400',
          },
    ].filter(Boolean) as Array<{ tag: string; message: string; tone: string }>;

    return feed;
  }, [liveRaceIntelligence]);

  const headerSection = (
    <PageHeader
      icon={Flag}
      overline="LIVE + HISTORICAL RACE ANALYSIS"
      title="Race Tracker"
      subtitle="Live race outcomes, lap behavior, pit strategy, and position deltas with no analytics regressions."
    />
  );

  const selectorsSection = (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <div className="f1-card p-6">
        <label className="mb-2 block text-sm font-medium uppercase tracking-[0.14em] text-f1-muted">Season</label>
        <SeasonSelector
          seasons={seasons}
          selectedSeason={selectedSeason}
          onSeasonChange={setSelectedSeason}
        />
      </div>
      <div className="f1-card p-6">
        <label className="mb-2 block text-sm font-medium uppercase tracking-[0.14em] text-f1-muted">Round</label>
        <RoundSelector
          rounds={rounds}
          selectedRound={selectedRound}
          onRoundChange={setSelectedRound}
        />
      </div>
    </div>
  );

  if (loading) return <LoadingSpinner />;
  if (error) {
    return (
      <div className="space-y-8">
        {headerSection}
        {selectorsSection}

        {/* Error Message with Race Info */}
        <div className="f1-card p-8 text-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 bg-f1-red/10 rounded-full flex items-center justify-center">
              <Clock className="w-8 h-8 text-f1-red" />
            </div>
            <div>
              <h3 className="mb-2 text-xl font-semibold text-f1-text">Race Not Available</h3>
              <p className="mx-auto max-w-md text-f1-muted">
                {error}
              </p>
              {/* Show race info if we have rounds data */}
              {rounds.length > 0 && selectedRound && (
                <div className="mt-4 rounded-lg border border-f1-gray/30 bg-f1-surface-soft p-4">
                  {(() => {
                    const race = rounds.find((r: any) => r.round === selectedRound);
                    if (race) {
                      return (
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center justify-center space-x-2">
                            <MapPin className="w-4 h-4 text-f1-red" />
                            <span className="font-medium text-f1-text">{race.raceName}</span>
                          </div>
                          <div className="text-f1-muted">
                            {race.Circuit?.circuitName}
                          </div>
                          <div className="text-f1-muted">
                            Scheduled: {race.date} {race.time && `at ${race.time}`}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {headerSection}
      {selectorsSection}

      {raceData && liveRaceIntelligence && (
        <section className="f1-card relative overflow-hidden p-6">
          <div className="absolute inset-0 bg-gradient-to-br from-f1-red/6 via-transparent to-transparent" />
          <div className="relative z-10">
            <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="f1-overline">LIVE RACE INTELLIGENCE</p>
                <h2 className="text-2xl font-semibold text-f1-text">Race Signal Layer</h2>
                <p className="mt-1 max-w-2xl text-sm text-f1-muted">
                  Actionable race context generated from result status, lap pace spread, pit lane timing, and position dynamics.
                </p>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-f1-gray/35 bg-f1-surface-soft px-3 py-1.5 text-sm">
                <Activity className="h-4 w-4 text-f1-red" />
                <span className="text-f1-muted">Model Confidence</span>
                <span className="font-semibold text-f1-text">{Math.round(liveRaceIntelligence.confidence)}%</span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-xl border border-f1-gray/30 bg-f1-surface-soft/80 p-4">
                <p className="text-[11px] uppercase tracking-[0.12em] text-f1-muted">Volatility Index</p>
                <p className="mt-2 text-2xl font-semibold text-f1-text">{liveRaceIntelligence.volatilityScore}</p>
                <p className="text-sm text-f1-muted">{liveRaceIntelligence.volatilityBand} race movement</p>
              </div>
              <div className="rounded-xl border border-f1-gray/30 bg-f1-surface-soft/80 p-4">
                <p className="text-[11px] uppercase tracking-[0.12em] text-f1-muted">Undercut Window</p>
                <p className="mt-2 text-2xl font-semibold text-f1-text">
                  {liveRaceIntelligence.averagePitLap ? `Lap ${liveRaceIntelligence.averagePitLap}` : 'N/A'}
                </p>
                <p className="text-sm text-f1-muted">{liveRaceIntelligence.totalPitStops} total recorded pit events</p>
              </div>
              <div className="rounded-xl border border-f1-gray/30 bg-f1-surface-soft/80 p-4">
                <p className="text-[11px] uppercase tracking-[0.12em] text-f1-muted">Pace Distribution</p>
                <p className="mt-2 text-2xl font-semibold text-f1-text">{liveRaceIntelligence.paceBand}</p>
                <p className="text-sm text-f1-muted">{liveRaceIntelligence.lapSpreadAverage.toFixed(2)}s average top-5 spread</p>
              </div>
              <div className="rounded-xl border border-f1-gray/30 bg-f1-surface-soft/80 p-4">
                <p className="text-[11px] uppercase tracking-[0.12em] text-f1-muted">Reliability</p>
                <p className="mt-2 text-2xl font-semibold text-f1-text">{liveRaceIntelligence.retirements.length}</p>
                <p className="text-sm text-f1-muted">
                  {liveRaceIntelligence.retirements.length > 0 ? 'Retirement events flagged' : 'No retirement events'}
                </p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-xl border border-f1-gray/30 bg-f1-surface-soft/70 p-4">
                <h3 className="mb-3 text-lg font-semibold text-f1-text">Actionable Signals</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-3 rounded-lg border border-f1-gray/20 bg-f1-surface/70 p-3">
                    <Timer className="mt-0.5 h-4 w-4 shrink-0 text-f1-red" />
                    <div>
                      <p className="font-medium text-f1-text">Pit Strategy Pivot</p>
                      <p className="text-f1-muted">
                        {liveRaceIntelligence.averagePitLap
                          ? `Primary pit activity clustered near lap ${liveRaceIntelligence.averagePitLap}.`
                          : 'Insufficient pit stop events for a stable pit window model.'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-lg border border-f1-gray/20 bg-f1-surface/70 p-3">
                    <Trophy className="mt-0.5 h-4 w-4 shrink-0 text-f1-red" />
                    <div>
                      <p className="font-medium text-f1-text">Position Momentum</p>
                      <p className="text-f1-muted">
                        {liveRaceIntelligence.biggestGainer
                          ? `${liveRaceIntelligence.biggestGainer.driverName} delivered the strongest gain (+${liveRaceIntelligence.biggestGainer.positionChange}).`
                          : 'No significant position gain signal available for this event.'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-lg border border-f1-gray/20 bg-f1-surface/70 p-3">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                    <div>
                      <p className="font-medium text-f1-text">Risk Watch</p>
                      <p className="text-f1-muted">
                        {liveRaceIntelligence.biggestLoser
                          ? `${liveRaceIntelligence.biggestLoser.driverName} dropped ${Math.abs(liveRaceIntelligence.biggestLoser.positionChange)} places, indicating strategy or pace risk.`
                          : 'No major negative position swing detected in this race output.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-f1-gray/30 bg-f1-surface-soft/70 p-4">
                <h3 className="mb-3 text-lg font-semibold text-f1-text">Live Signal Feed</h3>
                <div className="space-y-2">
                  {liveSignalFeed.map((signal) => (
                    <div key={signal.tag} className="rounded-lg border border-f1-gray/20 bg-f1-surface/70 p-3">
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-xs uppercase tracking-[0.12em] text-f1-muted">{signal.tag}</span>
                        <span className={`text-xs font-medium ${signal.tone}`}>Active</span>
                      </div>
                      <p className="text-sm text-f1-text">{signal.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {raceData && (
        <section className="f1-card p-6 relative overflow-hidden group">
          {/* Decorative background elements */}
          <div className="absolute inset-0 bg-gradient-to-br from-f1-red/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="absolute top-0 right-0 w-32 h-32 opacity-5">
            <Trophy className="w-full h-full" />
          </div>

          {/* Race Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div>
              <h2 className="mb-2 text-2xl font-semibold text-f1-text">{raceData.raceName}</h2>
              <div className="flex items-center text-f1-muted">
                <MapPin className="w-4 h-4 mr-2" />
                <span>{raceData.Circuit.circuitName}</span>
              </div>
            </div>
          </div>

          {/* Results Table */}
          <div className="overflow-x-auto">
            <table className="f1-table">
              <thead>
                <tr>
                  <th>Position</th>
                  <th>Driver</th>
                  <th>Constructor</th>
                  <th>Time/Status</th>
                  <th>Points</th>
                </tr>
              </thead>
              <tbody>
                {raceData.Results.map((result: any) => (
                  <tr key={result.position}>
                    <td className="whitespace-nowrap">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full 
                        ${result.position === '1' ? 'bg-f1-red text-white' :
                          result.position === '2' ? 'bg-gray-600 text-white' :
                            result.position === '3' ? 'bg-amber-700 text-white' :
                              'bg-f1-gray/20 text-f1-text'}`}>
                        {result.position}
                      </span>
                    </td>
                    <td className="whitespace-nowrap text-sm text-f1-text">
                      <div className="font-medium">{result.Driver.givenName} {result.Driver.familyName}</div>
                      <div className="text-f1-muted text-xs">{result.Driver.nationality}</div>
                    </td>
                    <td className="whitespace-nowrap text-sm text-f1-text">{result.Constructor.name}</td>
                    <td className="whitespace-nowrap text-sm text-f1-text">
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-2 text-f1-red" />
                        {result.Time?.time || result.status}
                      </div>
                    </td>
                    <td className="whitespace-nowrap">
                      <span className="px-3 py-1 rounded-full bg-f1-red/10 text-f1-red font-medium">
                        {result.points} pts
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Updated Lap Times Analysis */}
      {lapTimes.length > 0 && (
        <section className="f1-card p-6 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-f1-red/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <h2 className="mb-6 flex items-center text-2xl font-semibold text-f1-text">
            <Clock className="w-6 h-6 mr-2 text-f1-red" />
            Lap Times Analysis
          </h2>
          <div className="h-[400px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lapTimes} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis
                  dataKey="lap"
                  tick={{ fill: '#F0F0F0' }}
                  label={{ value: 'Lap Number', position: 'bottom', fill: '#F0F0F0', dy: 10 }}
                />
                <YAxis
                  tick={{ fill: '#F0F0F0' }}
                  label={{ value: 'Lap Time (seconds)', angle: -90, position: 'insideLeft', fill: '#F0F0F0', dx: -10 }}
                  domain={['dataMin - 1', 'dataMax + 1']}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-f1-black/95 backdrop-blur-md border border-f1-gray/30 rounded-lg p-4 shadow-xl">
                          <div className="border-b border-f1-gray/30 pb-2 mb-3">
                            <span className="text-f1-muted text-sm">Lap </span>
                            <span className="font-bold text-f1-text">{label}</span>
                          </div>
                          <div className="space-y-2">
                            {payload.map((entry: any, index: number) => (
                              <div key={`lap-${index}`} className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-2">
                                  <div 
                                    className="w-2 h-2 rounded-full" 
                                    style={{ backgroundColor: entry.color }}
                                  />
                                  <span className="whitespace-nowrap text-f1-muted">
                                    {entry.name}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-bold text-f1-text">
                                    {Number(entry.value).toFixed(3)}
                                  </span>
                                  <span className="text-f1-muted text-sm">s</span>
                                </div>
                              </div>
                            ))}
                          </div>
                          {/* Gap to Leader */}
                          {payload.length > 1 && (
                            <div className="mt-3 pt-3 border-t border-f1-gray/30">
                              <div className="mb-2 text-sm text-f1-muted">Gap to Leader</div>
                              {payload.slice(1).map((entry: any, index: number) => {
                                const gap = (Number(entry.value) - Number(payload[0]?.value || 0)).toFixed(3);
                                return (
                                  <div key={`gap-${index}`} className="flex items-center justify-between text-sm">
                                    <span className="text-f1-muted">{entry.name}</span>
                                    <span className={`font-mono ${Number(gap) > 0 ? 'text-red-400' : 'text-green-400'}`}>
                                      {Number(gap) > 0 ? '+' : ''}{gap}s
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend
                  verticalAlign="top"
                  height={36}
                  content={({ payload }) => (
                    <div className="flex flex-wrap justify-center gap-4 mb-4">
                      {payload?.map((entry: any, index: number) => (
                        <div key={`legend-${index}`} className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: entry.color }}
                          />
                          <span className="text-f1-muted text-sm">{entry.value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                />
                {raceData?.Results.slice(0, 5).map((result: any, index: number) => (
                  <Line
                    key={result.Driver.driverId}
                    type="monotone"
                    dataKey={`${result.Driver.givenName} ${result.Driver.familyName}`}
                    name={`${result.Driver.familyName}`}
                    stroke={`hsl(${index * 60}, 70%, 50%)`}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {/* Updated Pit Stop Analysis */}
      {pitStops.length > 0 && (
        <section className="f1-card p-6 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-f1-red/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <h2 className="mb-6 flex items-center text-2xl font-semibold text-f1-text">
            <Timer className="w-6 h-6 mr-2 text-f1-red" />
            Pit Stop Analysis
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {getPitStopSummary(pitStops).map((summary: any) => (
              <div
                key={summary.driver}
                className="rounded-xl border border-f1-gray/30 bg-f1-surface-soft/80 p-4 transition-colors duration-200 hover:bg-f1-surface-soft"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-lg font-semibold text-f1-text">{summary.driver}</span>
                  <span className="px-3 py-1 rounded-full bg-f1-red/10 text-f1-red font-medium">
                    {summary.stops} {summary.stops === 1 ? 'stop' : 'stops'}
                  </span>
                </div>
                <div className="space-y-2 text-sm text-f1-muted">
                  <div className="flex justify-between">
                    <span>Average Duration:</span>
                    <span className="font-medium text-f1-text">{summary.avgDuration.toFixed(3)}s</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Pit Time:</span>
                    <span className="font-medium text-f1-text">{summary.totalTime.toFixed(3)}s</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {positionChanges.length > 0 && (
        <section className="f1-card p-6 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-f1-red/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <h2 className="mb-6 flex items-center text-2xl font-semibold text-f1-text">
            <Trophy className="w-6 h-6 mr-2 text-f1-red" />
            Position Changes Analysis
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {positionChanges.map((driver) => (
              <div
                key={driver.driverName}
                className="rounded-xl border border-f1-gray/30 bg-f1-surface-soft/80 p-4 transition-colors duration-200 hover:bg-f1-surface-soft"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-lg font-semibold text-f1-text">{driver.driverName}</span>
                  <span className="text-sm text-f1-muted">{driver.constructor}</span>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-f1-muted">
                    <span>Start Position:</span>
                    <span className="font-medium text-f1-text">{driver.startPosition}</span>
                  </div>
                  <div className="flex justify-between text-f1-muted">
                    <span>Final Position:</span>
                    <span className="font-medium text-f1-text">{driver.endPosition}</span>
                  </div>
                  <div className="flex justify-between text-f1-muted">
                    <span>Position Change:</span>
                    {driver.positionChange !== "N/A" && typeof driver.positionChange === 'number' ? (
                      <span className={`font-medium ${driver.positionChange > 0
                        ? 'text-green-400'
                        : driver.positionChange < 0
                          ? 'text-red-400'
                          : 'text-f1-text'
                        }`}>
                        {driver.positionChange > 0 ? '+' : ''}
                        {driver.positionChange}
                      </span>
                    ) : (
                      <span className="font-medium text-f1-text">N/A</span>
                    )}
                  </div>
                  <div className="flex justify-between text-f1-muted">
                    <span>Status:</span>
                    <span className="font-medium text-f1-text">{driver.status}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {qualifyingComparison.length > 0 && (
        <section className="f1-card p-6 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-f1-red/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <h2 className="mb-6 flex items-center text-2xl font-semibold text-f1-text">
            <Clock className="w-6 h-6 mr-2 text-f1-red" />
            Race Performance Analysis
          </h2>

          <div className="overflow-x-auto">
            <table className="f1-table">
              <thead>
                <tr>
                  <th>Driver</th>
                  <th>Constructor</th>
                  <th>Grid</th>
                  <th>Gap to Leader</th>
                  <th>Fastest Lap</th>
                  <th>Avg Speed</th>
                  <th>Points</th>
                </tr>
              </thead>
              <tbody>
                {qualifyingComparison.map((driver) => (
                  <tr key={driver.driverName}>
                    <td className="whitespace-nowrap text-sm font-medium text-f1-text">
                      {driver.driverName}
                    </td>
                    <td className="whitespace-nowrap text-sm text-f1-text">
                      {driver.constructor}
                    </td>
                    <td className="whitespace-nowrap text-sm text-f1-text">
                      {driver.gridPosition}
                    </td>
                    <td className="whitespace-nowrap text-sm text-f1-text">
                      {driver.finishTime}
                    </td>
                    <td className="whitespace-nowrap text-sm text-f1-text">
                      {driver.fastestLap}
                    </td>
                    <td className="whitespace-nowrap text-sm text-f1-text">
                      {driver.averageSpeed !== "N/A" ? `${driver.averageSpeed} km/h` : "N/A"}
                    </td>
                    <td className="whitespace-nowrap">
                      <span className="px-2 py-1 rounded-full bg-f1-red/10 text-f1-red text-sm font-medium">
                        {driver.points}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
};

export default RaceTracker;
