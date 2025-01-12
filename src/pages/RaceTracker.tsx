import React, { useState, useEffect } from 'react';
import { getRaceResults, getLapTimes, getSeasons, getRounds, getPitStops } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import SeasonSelector from '../components/SeasonSelector';
import RoundSelector from '../components/RoundSelector';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, BarChart, Bar, ScatterChart, Scatter, ZAxis
} from 'recharts';
import { Trophy, Flag, Clock, MapPin, Timer } from 'lucide-react';

const RaceTracker: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [seasons, setSeasons] = useState<any[]>([]);
  const [rounds, setRounds] = useState<any[]>([]);
  const [selectedSeason, setSelectedSeason] = useState('2024');
  const [selectedRound, setSelectedRound] = useState('1');
  const [raceData, setRaceData] = useState<any>(null);
  const [lapTimes, setLapTimes] = useState<any[]>([]);
  const [qualifyingTimes, setQualifyingTimes] = useState<any[]>([]);
  const [pitStops, setPitStops] = useState<any[]>([]);
  const [positionChanges, setPositionChanges] = useState<any[]>([]);

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
          setSelectedRound(roundsData[0].round);
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
      try {
        const [race, laps] = await Promise.all([
          getRaceResults(selectedSeason, selectedRound),
          getLapTimes(selectedSeason, selectedRound)
        ]);
        setRaceData(race);

        // Transform lap times data for the chart
        const transformedLapTimes = laps.map((lap: any) => ({
          lap: lap.number,
          ...lap.Timings.reduce((acc: any, timing: any) => {
            acc[timing.driverId] = timing.time;
            return acc;
          }, {})
        }));
        setLapTimes(transformedLapTimes);
      } catch (err) {
        setError('Failed to load race data');
      } finally {
        setLoading(false);
      }
    };

    if (selectedSeason && selectedRound) {
      fetchData();
    }
  }, [selectedSeason, selectedRound]);

  useEffect(() => {
    const fetchLapTimes = async () => {
      if (!raceData) return;

      try {
        const top5Drivers = raceData.Results.slice(0, 5);
        const allLapTimes = await Promise.all(
          top5Drivers.map(async (result) => {
            const laps = await getLapTimes(selectedSeason, selectedRound, result.Driver.driverId);
            return {
              driver: `${result.Driver.givenName} ${result.Driver.familyName}`,
              laps: laps.map((lap: any) => ({
                lapNumber: parseInt(lap.number),
                time: lap.Timings[0]?.time || null
              }))
            };
          })
        );

        // Transform data for the chart
        const chartData = allLapTimes[0].laps.map((lap: any, index: number) => {
          const lapData: any = { lap: lap.lapNumber };
          allLapTimes.forEach((driver) => {
            if (driver.laps[index]?.time) {
              lapData[driver.driver] = convertLapTimeToSeconds(driver.laps[index].time);
            }
          });
          return lapData;
        });

        setLapTimes(chartData);
      } catch (error) {
        console.error('Error fetching lap times:', error);
      }
    };

    // Fetch pit stops data
    const fetchPitStops = async () => {
      if (!raceData) return;

      try {
        const pitStopsData = await getPitStops(selectedSeason, selectedRound);
        const transformedPitStops = pitStopsData.map((stop: any) => ({
          driverName: raceData.Results.find((r: any) => r.Driver.driverId === stop.driverId)
            ?.Driver.familyName || stop.driverId,
          stop: parseInt(stop.stop),
          lap: parseInt(stop.lap),
          duration: parseFloat(stop.duration),
          cumulativeTime: convertDurationToSeconds(stop.duration)
        }));

        setPitStops(transformedPitStops);
      } catch (error) {
        console.error('Error fetching pit stops:', error);
      }
    };

    fetchLapTimes();
    fetchPitStops();
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

  // Helper functions
  const convertLapTimeToSeconds = (timeStr: string) => {
    const [minutes, seconds] = timeStr.split(':');
    return parseFloat(minutes) * 60 + parseFloat(seconds);
  };

  const convertDurationToSeconds = (duration: string) => {
    return parseFloat(duration);
  };

  // Simplified pit stop data transformation
  const transformPitStops = (data: any[]) => {
    return data.map((stop: any) => ({
      driverName: raceData?.Results.find(
        (r: any) => r.Driver.driverId === stop.driverId
      )?.Driver.familyName || stop.driverId,
      lap: parseInt(stop.lap),
      duration: parseFloat(stop.duration),
      stop: parseInt(stop.stop)
    }));
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
  if (error) return <ErrorMessage message={error} />;

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
                  contentStyle={{
                    backgroundColor: '#15151E',
                    border: '1px solid #333',
                    borderRadius: '8px'
                  }}
                  formatter={(value: any) => [`${value.toFixed(3)}s`]}
                  labelStyle={{ color: '#F0F0F0' }}
                />
                <Legend
                  verticalAlign="top"
                  height={36}
                  wrapperStyle={{
                    paddingBottom: '20px',
                    color: '#F0F0F0'
                  }}
                />
                {raceData?.Results.slice(0, 5).map((result: any, index: number) => (
                  <Line
                    key={result.Driver.driverId}
                    type="monotone"
                    dataKey={`${result.Driver.givenName} ${result.Driver.familyName}`}
                    name={`${result.Driver.familyName}`} // Simplified legend name
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
                    {driver.positionChange !== "N/A" ? (
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
    </div>
  );
};

export default RaceTracker;