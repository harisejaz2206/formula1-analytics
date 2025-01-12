import React, { useState, useEffect } from 'react';
import { getDriverStandings, getConstructorStandings, getSeasons, getSeasonResults } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import SeasonSelector from '../components/SeasonSelector';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Trophy, Building2, Flag, Target } from 'lucide-react';

const SeasonOverview: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [seasons, setSeasons] = useState<any[]>([]);
  const [selectedSeason, setSelectedSeason] = useState('2024');
  const [driverStandings, setDriverStandings] = useState<any[]>([]);
  const [constructorStandings, setConstructorStandings] = useState<any[]>([]);
  const [seasonResults, setSeasonResults] = useState<any[]>([]);
  const [cumulativePoints, setCumulativePoints] = useState<any[]>([]);

  useEffect(() => {
    const fetchSeasons = async () => {
      try {
        const seasonsData = await getSeasons();
        setSeasons(seasonsData);
      } catch (err) {
        setError('Failed to load seasons');
      }
    };
    fetchSeasons();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [drivers, constructors, results] = await Promise.all([
          getDriverStandings(selectedSeason),
          getConstructorStandings(selectedSeason),
          getSeasonResults(selectedSeason)
        ]);

        // Transform data for cumulative points progression
        const top5Drivers = drivers.slice(0, 5).map(driver => ({
          id: driver.Driver.driverId,
          name: `${driver.Driver.givenName} ${driver.Driver.familyName}`
        }));

        const pointsData = results.map((race: any) => {
          const racePoints: any = {
            round: parseInt(race.round),
            raceName: race.raceName
          };

          top5Drivers.forEach(driver => {
            const driverResult = race.Results.find((r: any) => r.Driver.driverId === driver.id);
            racePoints[driver.name] = driverResult ? parseInt(driverResult.points) : 0;
          });

          return racePoints;
        });

        // Calculate cumulative points
        const cumulativeData = pointsData.map((race: any, index: number) => {
          const cumulativeRace: any = { round: race.round, raceName: race.raceName };

          top5Drivers.forEach(driver => {
            cumulativeRace[driver.name] = pointsData
              .slice(0, index + 1)
              .reduce((sum, r) => sum + (r[driver.name] || 0), 0);
          });

          return cumulativeRace;
        });

        setDriverStandings(drivers);
        setConstructorStandings(constructors);
        setSeasonResults(results);
        setCumulativePoints(cumulativeData);
      } catch (err) {
        setError('Failed to load season data');
      } finally {
        setLoading(false);
      }
    };

    if (selectedSeason) {
      fetchData();
    }
  }, [selectedSeason]);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  const top5Drivers = driverStandings.slice(0, 5).map(driver => ({
    name: `${driver.Driver.givenName} ${driver.Driver.familyName}`,
    points: parseInt(driver.points),
    wins: parseInt(driver.wins)
  }));

  const top5Constructors = constructorStandings.slice(0, 5).map(constructor => ({
    name: constructor.Constructor.name,
    points: parseInt(constructor.points),
    wins: parseInt(constructor.wins)
  }));

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-f1-black to-f1-gray p-8 mb-8">
        <div className="relative z-10">
          <h1 className="text-4xl font-bold text-white mb-2">2024 Season Overview</h1>
          <p className="text-f1-silver/80 text-lg">Championship Standings and Statistics</p>
        </div>
        <div className="absolute top-0 right-0 w-1/3 h-full opacity-10">
          <svg viewBox="0 0 200 200" className="w-full h-full">
            <path fill="currentColor" d="M73.1,-23.3C80.1,-2.3,63.8,25.2,40.6,42.6C17.4,60.1,-12.9,67.6,-38.4,56.5C-63.9,45.4,-84.6,15.6,-80.5,-11.4C-76.4,-38.4,-47.4,-62.7,-18.9,-69.5C9.6,-76.4,66.1,-44.3,73.1,-23.3Z" transform="translate(100 100)" />
          </svg>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Driver Standings Chart */}
        <div className="f1-card p-6 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-f1-red/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <h2 className="text-2xl font-bold mb-6 text-white flex items-center">
            <Trophy className="w-6 h-6 mr-2 text-f1-red" />
            Top 5 Drivers
          </h2>
          <div className="h-[400px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={top5Drivers}>
                <defs>
                  <linearGradient id="pointsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#E10600" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#E10600" stopOpacity={0.2} />
                  </linearGradient>
                  <linearGradient id="winsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00FF00" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#00FF00" stopOpacity={0.2} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis
                  dataKey="name"
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
                <Bar
                  dataKey="points"
                  fill="url(#pointsGradient)"
                  name="Points"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="wins"
                  fill="url(#winsGradient)"
                  name="Wins"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Constructor Standings Chart */}
        <div className="f1-card p-6 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-f1-red/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <h2 className="text-2xl font-bold mb-6 text-white flex items-center">
            <Building2 className="w-6 h-6 mr-2 text-f1-red" />
            Top 5 Constructors
          </h2>
          <div className="h-[400px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={top5Constructors}>
                <defs>
                  <linearGradient id="constructorPointsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#E10600" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#E10600" stopOpacity={0.2} />
                  </linearGradient>
                  <linearGradient id="constructorWinsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00FF00" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#00FF00" stopOpacity={0.2} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis
                  dataKey="name"
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
                <Bar
                  dataKey="points"
                  fill="url(#constructorPointsGradient)"
                  name="Points"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="wins"
                  fill="url(#constructorWinsGradient)"
                  name="Wins"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Updated Points Progression Chart */}
      <div className="f1-card p-6 relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-f1-red/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <h2 className="text-2xl font-bold mb-6 text-white flex items-center">
          <Trophy className="w-6 h-6 mr-2 text-f1-red" />
          Points Progression
        </h2>
        <div className="h-[400px] relative">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={cumulativePoints}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis
                dataKey="round"
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
              />
              <Legend wrapperStyle={{ color: '#F0F0F0' }} />
              {driverStandings.slice(0, 5).map((driver: any, index: number) => (
                <Line
                  key={driver.Driver.driverId}
                  type="monotone"
                  dataKey={`${driver.Driver.givenName} ${driver.Driver.familyName}`}
                  stroke={`hsl(${index * 60}, 70%, 50%)`}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Additional Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <div className="f1-card p-6 hover:scale-105 transition-transform duration-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Total Races</h3>
            <Flag className="w-6 h-6 text-f1-red" />
          </div>
          <p className="text-3xl font-bold text-f1-silver">22</p>
        </div>

        <div className="f1-card p-6 hover:scale-105 transition-transform duration-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Season Points</h3>
            <Target className="w-6 h-6 text-f1-red" />
          </div>
          <p className="text-3xl font-bold text-f1-silver">1,431</p>
        </div>

        <div className="f1-card p-6 hover:scale-105 transition-transform duration-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Different Winners</h3>
            <Trophy className="w-6 h-6 text-f1-red" />
          </div>
          <p className="text-3xl font-bold text-f1-silver">5</p>
        </div>
      </div>
    </div>
  );
};

export default SeasonOverview;