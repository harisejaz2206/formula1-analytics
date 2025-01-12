import React, { useState, useEffect } from 'react';
import { getRaceResults, getLapTimes, getSeasons, getRounds } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import SeasonSelector from '../components/SeasonSelector';
import RoundSelector from '../components/RoundSelector';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Trophy, Flag, Clock, MapPin } from 'lucide-react';

const RaceTracker: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [seasons, setSeasons] = useState<any[]>([]);
  const [rounds, setRounds] = useState<any[]>([]);
  const [selectedSeason, setSelectedSeason] = useState('2024');
  const [selectedRound, setSelectedRound] = useState('1');
  const [raceData, setRaceData] = useState<any>(null);
  const [lapTimes, setLapTimes] = useState<any[]>([]);

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

      {lapTimes.length > 0 && (
        <section className="f1-card p-6 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-f1-red/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

          <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
            <Clock className="w-6 h-6 mr-2 text-f1-red" />
            Lap Times Analysis
          </h2>

          <div className="h-[400px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lapTimes}>
                <defs>
                  {raceData?.Results.slice(0, 5).map((result: any, index: number) => (
                    <linearGradient
                      key={result.Driver.driverId}
                      id={`gradient-${result.Driver.driverId}`}
                      x1="0" y1="0" x2="0" y2="1"
                    >
                      <stop offset="5%" stopColor={`hsl(${index * 60}, 70%, 50%)`} stopOpacity={0.8} />
                      <stop offset="95%" stopColor={`hsl(${index * 60}, 70%, 50%)`} stopOpacity={0.2} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis
                  dataKey="lap"
                  tick={{ fill: '#F0F0F0' }}
                  axisLine={{ stroke: '#333' }}
                />
                <YAxis
                  tick={{ fill: '#F0F0F0' }}
                  axisLine={{ stroke: '#333' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#15151E',
                    border: '1px solid #333',
                    borderRadius: '8px'
                  }}
                  labelStyle={{ color: '#F0F0F0' }}
                />
                <Legend
                  wrapperStyle={{
                    paddingTop: '20px',
                    color: '#F0F0F0'
                  }}
                />
                {raceData?.Results.slice(0, 5).map((result: any, index: number) => (
                  <Line
                    key={result.Driver.driverId}
                    type="monotone"
                    dataKey={result.Driver.driverId}
                    name={`${result.Driver.givenName} ${result.Driver.familyName}`}
                    stroke={`url(#gradient-${result.Driver.driverId})`}
                    strokeWidth={2}
                    dot={{ fill: `hsl(${index * 60}, 70%, 50%)` }}
                    activeDot={{ r: 8 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}
    </div>
  );
};

export default RaceTracker;