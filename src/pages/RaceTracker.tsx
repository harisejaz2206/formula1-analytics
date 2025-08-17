import React, { useState, useEffect } from 'react';
import { getRaceResults, getLapTimes, getSeasons, getRounds, getPitStops } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import SeasonSelector from '../components/SeasonSelector';
import RoundSelector from '../components/RoundSelector';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer
} from 'recharts';
import { Trophy, Flag, Clock, MapPin, Timer } from 'lucide-react';

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
      } catch (err) {
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
      } catch (err) {
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
      } catch (err) {
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

  if (loading) return <LoadingSpinner />;
  if (error) {
    return (
      <div className="space-y-8">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-f1-black to-f1-gray p-8 mb-8">
          <div className="relative z-10">
            <h1 className="text-4xl font-bold text-white mb-2">Race Tracker</h1>
            <p className="text-f1-silver/80 text-lg">Live Race Results and Analysis</p>
          </div>
          <div className="absolute top-0 right-0 w-1/3 h-full opacity-10">
            <Flag className="w-full h-full" />
          </div>
        </div>

        {/* Selectors Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="f1-card p-6 backdrop-blur-sm">
            <label className="block text-sm font-medium text-f1-silver mb-2 uppercase tracking-wider">Season</label>
            <SeasonSelector
              seasons={seasons}
              selectedSeason={selectedSeason}
              onSeasonChange={setSelectedSeason}
            />
          </div>
          <div className="f1-card p-6 backdrop-blur-sm">
            <label className="block text-sm font-medium text-f1-silver mb-2 uppercase tracking-wider">Round</label>
            <RoundSelector
              rounds={rounds}
              selectedRound={selectedRound}
              onRoundChange={setSelectedRound}
            />
          </div>
        </div>

        {/* Error Message with Race Info */}
        <div className="f1-card p-8 text-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 bg-f1-red/10 rounded-full flex items-center justify-center">
              <Clock className="w-8 h-8 text-f1-red" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-2">Race Not Available</h3>
              <p className="text-f1-silver/80 max-w-md mx-auto">
                {error}
              </p>
              {/* Show race info if we have rounds data */}
              {rounds.length > 0 && selectedRound && (
                <div className="mt-4 p-4 bg-f1-gray/20 rounded-lg">
                  {(() => {
                    const race = rounds.find((r: any) => r.round === selectedRound);
                    if (race) {
                      return (
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center justify-center space-x-2">
                            <MapPin className="w-4 h-4 text-f1-red" />
                            <span className="text-white font-medium">{race.raceName}</span>
                          </div>
                          <div className="text-f1-silver/60">
                            {race.Circuit?.circuitName}
                          </div>
                          <div className="text-f1-silver/60">
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
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-f1-black to-f1-gray p-8 mb-8">
        <div className="relative z-10">
          <h1 className="text-4xl font-bold text-white mb-2">Race Tracker</h1>
          <p className="text-f1-silver/80 text-lg">Live Race Results and Analysis</p>
        </div>
        <div className="absolute top-0 right-0 w-1/3 h-full opacity-10">
          <Flag className="w-full h-full" />
        </div>
      </div>

      {/* Selectors Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="f1-card p-6 backdrop-blur-sm">
          <label className="block text-sm font-medium text-f1-silver mb-2 uppercase tracking-wider">Season</label>
          <SeasonSelector
            seasons={seasons}
            selectedSeason={selectedSeason}
            onSeasonChange={setSelectedSeason}
          />
        </div>
        <div className="f1-card p-6 backdrop-blur-sm">
          <label className="block text-sm font-medium text-f1-silver mb-2 uppercase tracking-wider">Round</label>
          <RoundSelector
            rounds={rounds}
            selectedRound={selectedRound}
            onRoundChange={setSelectedRound}
          />
        </div>
      </div>

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
              <h2 className="text-2xl font-bold text-white mb-2">{raceData.raceName}</h2>
              <div className="flex items-center text-f1-silver/80">
                <MapPin className="w-4 h-4 mr-2" />
                <span>{raceData.Circuit.circuitName}</span>
              </div>
            </div>
          </div>

          {/* Results Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-800">
              <thead className="bg-f1-black/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-f1-silver uppercase tracking-wider">Position</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-f1-silver uppercase tracking-wider">Driver</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-f1-silver uppercase tracking-wider">Constructor</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-f1-silver uppercase tracking-wider">Time/Status</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-f1-silver uppercase tracking-wider">Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {raceData.Results.map((result: any) => (
                  <tr
                    key={result.position}
                    className="group/row hover:bg-f1-gray/30 transition-colors duration-200"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full 
                        ${result.position === '1' ? 'bg-f1-red text-white' :
                          result.position === '2' ? 'bg-gray-600 text-white' :
                            result.position === '3' ? 'bg-amber-700 text-white' :
                              'bg-f1-gray/20 text-f1-silver'}`}>
                        {result.position}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-f1-silver">
                      <div className="font-medium">{result.Driver.givenName} {result.Driver.familyName}</div>
                      <div className="text-f1-silver/60 text-xs">{result.Driver.nationality}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-f1-silver">{result.Constructor.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-f1-silver">
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-2 text-f1-red" />
                        {result.Time?.time || result.status}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
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
          <h2 className="text-2xl font-bold mb-6 text-white flex items-center">
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
                            <span className="text-f1-silver/80 text-sm">Lap </span>
                            <span className="text-white font-bold">{label}</span>
                          </div>
                          <div className="space-y-2">
                            {payload.map((entry: any, index: number) => (
                              <div key={`lap-${index}`} className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-2">
                                  <div 
                                    className="w-2 h-2 rounded-full" 
                                    style={{ backgroundColor: entry.color }}
                                  />
                                  <span className="text-f1-silver whitespace-nowrap">
                                    {entry.name}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-white font-mono font-bold">
                                    {Number(entry.value).toFixed(3)}
                                  </span>
                                  <span className="text-f1-silver/60 text-sm">s</span>
                                </div>
                              </div>
                            ))}
                          </div>
                          {/* Gap to Leader */}
                          {payload.length > 1 && (
                            <div className="mt-3 pt-3 border-t border-f1-gray/30">
                              <div className="text-f1-silver/80 text-sm mb-2">Gap to Leader</div>
                              {payload.slice(1).map((entry: any, index: number) => {
                                const gap = (Number(entry.value) - Number(payload[0]?.value || 0)).toFixed(3);
                                return (
                                  <div key={`gap-${index}`} className="flex items-center justify-between text-sm">
                                    <span className="text-f1-silver/60">{entry.name}</span>
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
                          <span className="text-f1-silver text-sm">{entry.value}</span>
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
          <h2 className="text-2xl font-bold mb-6 text-white flex items-center">
            <Timer className="w-6 h-6 mr-2 text-f1-red" />
            Pit Stop Analysis
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {getPitStopSummary(pitStops).map((summary: any) => (
              <div
                key={summary.driver}
                className="bg-f1-gray/20 rounded-xl p-4 hover:bg-f1-gray/30 transition-colors duration-200 border border-f1-gray/10"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-lg font-bold text-white">{summary.driver}</span>
                  <span className="px-3 py-1 rounded-full bg-f1-red/10 text-f1-red font-medium">
                    {summary.stops} {summary.stops === 1 ? 'stop' : 'stops'}
                  </span>
                </div>
                <div className="space-y-2 text-sm text-f1-silver/80">
                  <div className="flex justify-between">
                    <span>Average Duration:</span>
                    <span className="font-medium text-white">{summary.avgDuration.toFixed(3)}s</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Pit Time:</span>
                    <span className="font-medium text-white">{summary.totalTime.toFixed(3)}s</span>
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
          <h2 className="text-2xl font-bold mb-6 text-white flex items-center">
            <Trophy className="w-6 h-6 mr-2 text-f1-red" />
            Position Changes Analysis
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {positionChanges.map((driver) => (
              <div
                key={driver.driverName}
                className="bg-f1-gray/20 rounded-xl p-4 hover:bg-f1-gray/30 transition-colors duration-200 border border-f1-gray/10"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-lg font-bold text-white">{driver.driverName}</span>
                  <span className="text-sm text-f1-silver">{driver.constructor}</span>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-f1-silver">
                    <span>Start Position:</span>
                    <span className="font-medium text-white">{driver.startPosition}</span>
                  </div>
                  <div className="flex justify-between text-f1-silver">
                    <span>Final Position:</span>
                    <span className="font-medium text-white">{driver.endPosition}</span>
                  </div>
                  <div className="flex justify-between text-f1-silver">
                    <span>Position Change:</span>
                    {driver.positionChange !== "N/A" && typeof driver.positionChange === 'number' ? (
                      <span className={`font-medium ${driver.positionChange > 0
                        ? 'text-green-400'
                        : driver.positionChange < 0
                          ? 'text-red-400'
                          : 'text-white'
                        }`}>
                        {driver.positionChange > 0 ? '+' : ''}
                        {driver.positionChange}
                      </span>
                    ) : (
                      <span className="font-medium text-white">N/A</span>
                    )}
                  </div>
                  <div className="flex justify-between text-f1-silver">
                    <span>Status:</span>
                    <span className="font-medium text-white">{driver.status}</span>
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
          <h2 className="text-2xl font-bold mb-6 text-white flex items-center">
            <Clock className="w-6 h-6 mr-2 text-f1-red" />
            Race Performance Analysis
          </h2>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-800">
              <thead className="bg-f1-black/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-f1-silver uppercase tracking-wider">Driver</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-f1-silver uppercase tracking-wider">Constructor</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-f1-silver uppercase tracking-wider">Grid</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-f1-silver uppercase tracking-wider">Gap to Leader</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-f1-silver uppercase tracking-wider">Fastest Lap</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-f1-silver uppercase tracking-wider">Avg Speed</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-f1-silver uppercase tracking-wider">Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {qualifyingComparison.map((driver) => (
                  <tr
                    key={driver.driverName}
                    className="hover:bg-f1-gray/30 transition-colors duration-200"
                  >
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-white">
                      {driver.driverName}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-f1-silver">
                      {driver.constructor}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-f1-silver">
                      {driver.gridPosition}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-f1-silver">
                      {driver.finishTime}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-f1-silver">
                      {driver.fastestLap}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-f1-silver">
                      {driver.averageSpeed !== "N/A" ? `${driver.averageSpeed} km/h` : "N/A"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
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