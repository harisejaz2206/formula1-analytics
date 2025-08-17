import React, { useState, useEffect } from 'react';
import { getDriverStandings, getConstructorStandings, getSeasons, getSeasonResults } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie } from 'recharts';
import { Trophy, Building2, Flag, Target, Calendar, ChevronDown, TrendingUp } from 'lucide-react';

const SeasonOverview: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [seasons, setSeasons] = useState<string[]>([]);
  const [selectedSeason, setSelectedSeason] = useState(new Date().getFullYear().toString());
  const [driverStandings, setDriverStandings] = useState<any[]>([]);
  const [constructorStandings, setConstructorStandings] = useState<any[]>([]);
  const [seasonResults, setSeasonResults] = useState<any[]>([]);
  const [cumulativePoints, setCumulativePoints] = useState<any[]>([]);

  useEffect(() => {
    const fetchSeasons = async () => {
      try {
        const seasonsData = await getSeasons();
        const seasonYears = seasonsData.map((season: any) => season.season);
        setSeasons(seasonYears);
        
        // Ensure the current year is selected if it exists in the available seasons
        const currentYear = new Date().getFullYear().toString();
        if (seasonYears.includes(currentYear) && selectedSeason !== currentYear) {
          setSelectedSeason(currentYear);
        }
      } catch (err) {
        setError('Failed to load seasons');
      }
    };
    fetchSeasons();
  }, [selectedSeason]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [drivers, constructors, results] = await Promise.all([
          getDriverStandings(selectedSeason),
          getConstructorStandings(selectedSeason),
          getSeasonResults(selectedSeason)
        ]);

        if (!drivers || drivers.length === 0) {
          setError('No driver standings data available for this season');
          return;
        }

        if (!constructors || constructors.length === 0) {
          setError('No constructor standings data available for this season');
          return;
        }

        console.log('Raw results:', results);

        // Transform data for cumulative points progression
        const top5Drivers = drivers.slice(0, 5).map(driver => ({
          id: driver.Driver.driverId,
          name: `${driver.Driver.givenName} ${driver.Driver.familyName}`
        }));

        console.log('Top 5 drivers:', top5Drivers);

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

        console.log('Points data:', pointsData);

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

        console.log('Cumulative data:', cumulativeData);

        setDriverStandings(drivers);
        setConstructorStandings(constructors);
        setSeasonResults(results);
        setCumulativePoints(cumulativeData);
      } catch (err) {
        console.error('Error fetching season data:', err);
        setError('Failed to load season data. Please try again.');
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

  // Calculate total races once and reuse it
  const totalRaces = constructorStandings.reduce((total, constructor) =>
    total + parseInt(constructor.wins || '0'), 0
  ); // This will be 24

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-f1-black to-f1-gray p-8 mb-8">
        <div className="relative z-10">
          <h1 className="text-4xl font-bold text-white mb-2">{selectedSeason} Season Overview</h1>
          <p className="text-f1-silver/80 text-lg">Championship Standings and Statistics</p>
        </div>
        <div className="absolute top-0 right-0 w-1/3 h-full opacity-10">
          <svg viewBox="0 0 200 200" className="w-full h-full">
            <path fill="currentColor" d="M73.1,-23.3C80.1,-2.3,63.8,25.2,40.6,42.6C17.4,60.1,-12.9,67.6,-38.4,56.5C-63.9,45.4,-84.6,15.6,-80.5,-11.4C-76.4,-38.4,-47.4,-62.7,-18.9,-69.5C9.6,-76.4,66.1,-44.3,73.1,-23.3Z" transform="translate(100 100)" />
          </svg>
        </div>
      </div>

      <div className="f1-card p-4 mb-8 flex items-center justify-between">
        <div className="flex items-center">
          <Calendar className="w-6 h-6 text-f1-red mr-2" />
          <h2 className="text-xl font-bold text-white">Season Overview</h2>
        </div>
        <div className="relative">
          <select
            value={selectedSeason}
            onChange={(e) => setSelectedSeason(e.target.value)}
            className="f1-card px-4 py-2 pr-8 text-white bg-f1-gray/20 rounded-lg cursor-pointer 
              hover:bg-f1-gray/30 transition-colors duration-200 appearance-none border border-f1-gray/10"
          >
            {seasons
              .sort((a, b) => parseInt(b) - parseInt(a))
              .map((season) => {
                const currentYear = new Date().getFullYear().toString();
                const isCurrentSeason = season === currentYear;
                return (
                  <option key={season} value={season}>
                    {isCurrentSeason ? `${season} (Current)` : season}
                  </option>
                );
              })}
          </select>
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
            <ChevronDown className="w-4 h-4 text-f1-red" />
          </div>
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
                    backgroundColor: '#1E1E1E',
                    border: '1px solid #444',
                    borderRadius: '8px',
                    color: '#FFFFFF',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)'
                  }}
                  labelStyle={{ color: '#FFFFFF' }}
                  itemStyle={{ color: '#FFFFFF' }}
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
                    backgroundColor: '#1E1E1E',
                    border: '1px solid #444',
                    borderRadius: '8px',
                    color: '#FFFFFF',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)'
                  }}
                  labelStyle={{ color: '#FFFFFF' }}
                  itemStyle={{ color: '#FFFFFF' }}
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
                  backgroundColor: '#1E1E1E',
                  border: '1px solid #444',
                  borderRadius: '8px',
                  color: '#FFFFFF',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)'
                }}
                labelStyle={{ color: '#FFFFFF' }}
                itemStyle={{ color: '#FFFFFF' }}
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
          <p className="text-3xl font-bold text-f1-silver">{totalRaces}</p>
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

      {/* Add new Performance Trends section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Average Points Per Race */}
        <div className="f1-card p-6 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-f1-red/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <h2 className="text-2xl font-bold mb-6 text-white flex items-center">
            <TrendingUp className="w-6 h-6 mr-2 text-f1-red" />
            Average Points Per Race
          </h2>
          <div className="h-[400px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={driverStandings.slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis
                  dataKey={(driver) => `${driver.Driver.givenName.charAt(0)}. ${driver.Driver.familyName}`}
                  tick={{
                    fill: '#F0F0F0',
                    fontSize: 12,
                    fontWeight: 500
                  }}
                  angle={-35}
                  textAnchor="end"
                  height={60}
                  padding={{ left: 10, right: 10 }}
                />
                <YAxis
                  tick={{ fill: '#F0F0F0' }}
                  domain={[0, 30]}
                  tickCount={7}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1E1E1E',
                    border: '1px solid #444',
                    borderRadius: '8px',
                    color: '#FFFFFF',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)'
                  }}
                  labelStyle={{ color: '#FFFFFF' }}
                  itemStyle={{ color: '#FFFFFF' }}
                  formatter={(value) => [`${value} points`, "Average Points"]}
                  labelFormatter={(label) => `${label}`}
                  cursor={{ fill: 'rgba(255, 255, 255, 0.1)' }}
                />
                <Bar
                  dataKey={(driver) => {
                    const driverResults = seasonResults.flatMap(race =>
                      race.Results.filter((result: any) =>
                        result.Driver.driverId === driver.Driver.driverId &&
                        parseInt(result.points) > 0
                      )
                    );

                    const pointsScoringRaces = driverResults.length;
                    const totalPoints = driverResults.reduce((sum, result) =>
                      sum + parseInt(result.points), 0
                    );

                    return pointsScoringRaces > 0
                      ? (totalPoints / pointsScoringRaces).toFixed(1)
                      : "0.0";
                  }}
                  name="Avg Points per Points Finish"
                  radius={[4, 4, 0, 0]}
                >
                  {driverStandings.slice(0, 10).map((_entry, index) => (
                    <Cell
                      key={index}
                      fill={[
                        '#FF1E1E', // Red Bull-inspired
                        '#DC0000', // Ferrari-inspired
                        '#00D2BE', // Mercedes-inspired
                        '#FF8700', // McLaren-inspired
                        '#2293D1', // Alpine-inspired
                        '#005AFF', // Williams-inspired
                        '#006F62', // Aston Martin-inspired
                        '#52E252', // Haas-inspired
                        '#C92D4B', // Alfa Romeo-inspired
                        '#4E5BCE'  // AlphaTauri-inspired
                      ][index]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Win Distribution Pie Chart */}
        <div className="f1-card p-6 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-f1-red/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <h2 className="text-2xl font-bold mb-6 text-white flex items-center">
            <Trophy className="w-6 h-6 mr-2 text-f1-red" />
            Win Distribution
          </h2>
          <div className="h-[400px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={constructorStandings.map(constructor => ({
                    name: constructor.Constructor.name,
                    value: parseInt(constructor.points),
                    percentage: ((parseInt(constructor.points) / 1431) * 100).toFixed(1)
                  }))}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={140}
                  labelLine={false}
                  label={({ name, percentage, cx, cy, midAngle, outerRadius }) => {
                    if (parseFloat(percentage) < 5) return null;

                    const RADIAN = Math.PI / 180;
                    const radius = outerRadius * 1.1;
                    const x = cx + radius * Math.cos(-midAngle * RADIAN);
                    const y = cy + radius * Math.sin(-midAngle * RADIAN);

                    return (
                      <text
                        x={x}
                        y={y}
                        fill="#F0F0F0"
                        textAnchor={x > cx ? 'start' : 'end'}
                        dominantBaseline="central"
                        fontSize="12"
                        fontWeight="500"
                      >
                        {`${name}: ${percentage}%`}
                      </text>
                    );
                  }}
                >
                  {constructorStandings.map((_entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={[
                        '#00D2BE',
                        '#FF1E1E',
                        '#DC0000',
                        '#FF8700',
                        '#006F62',
                        '#2293D1',
                        '#005AFF',
                        '#52E252',
                        '#C92D4B',
                        '#4E5BCE'
                      ][index]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1E1E1E',
                    border: '1px solid #444',
                    borderRadius: '8px',
                    color: '#FFFFFF',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)'
                  }}
                  labelStyle={{ color: '#FFFFFF' }}
                  itemStyle={{ color: '#FFFFFF' }}
                  formatter={(value, name, props) => [
                    `${value} points (${props.payload.percentage}%)`,
                    name
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Add Constructor Performance Comparison */}
      <div className="f1-card p-6 mb-8">
        <h2 className="text-2xl font-bold mb-6 text-white flex items-center">
          <Building2 className="w-6 h-6 mr-2 text-f1-red" />
          Constructor Performance
        </h2>
        <div className="space-y-4">
          {constructorStandings.map((constructor, index) => {
            const totalPoints = parseInt(constructor.points);
            const percentage = (totalPoints / parseInt(constructorStandings[0].points)) * 100;
            return (
              <div key={constructor.Constructor.constructorId} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-f1-silver font-medium">
                    {constructor.Constructor.name}
                  </span>
                  <span className="text-f1-silver">
                    {totalPoints} pts
                  </span>
                </div>
                <div className="h-2 bg-f1-gray/20 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: `hsl(${index * 36}, 70%, 50%)`
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Constructor Performance Comparison */}
      <div className="f1-card p-6 relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-f1-red/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <h2 className="text-2xl font-bold mb-6 text-white flex items-center">
          <Trophy className="w-6 h-6 mr-2 text-f1-red" />
          Championship Points Share
        </h2>
        <div className="h-[400px] relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={constructorStandings.map(constructor => ({
                  name: constructor.Constructor.name,
                  value: parseInt(constructor.points),
                  percentage: ((parseInt(constructor.points) / 1431) * 100).toFixed(1),
                  wins: parseInt(constructor.wins)
                }))}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={140}
                innerRadius={80}
                labelLine={false}
                label={({ name, percentage, wins, cx, cy, midAngle, outerRadius }) => {
                  if (parseFloat(percentage) < 5) return null;

                  const RADIAN = Math.PI / 180;
                  const radius = outerRadius * 1.2;
                  const x = cx + radius * Math.cos(-midAngle * RADIAN);
                  const y = cy + radius * Math.sin(-midAngle * RADIAN);

                  return (
                    <g>
                      <text
                        x={x}
                        y={y}
                        fill="#F0F0F0"
                        textAnchor={x > cx ? 'start' : 'end'}
                        dominantBaseline="central"
                        fontSize="14"
                        fontWeight="bold"
                      >
                        {name}
                      </text>
                      <text
                        x={x}
                        y={y + 20}
                        fill="#F0F0F0"
                        textAnchor={x > cx ? 'start' : 'end'}
                        dominantBaseline="central"
                        fontSize="12"
                        opacity="0.8"
                      >
                        {`${percentage}% (${wins || 0}/${totalRaces} wins)`}
                      </text>
                    </g>
                  );
                }}
              >
                {constructorStandings.map((_entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={[
                      '#00D2BE',
                      '#FF1E1E',
                      '#DC0000',
                      '#FF8700',
                      '#006F62',
                      '#2293D1',
                      '#005AFF',
                      '#52E252',
                      '#C92D4B',
                      '#4E5BCE'
                    ][index]}
                    strokeWidth={2}
                    stroke="#15151E"
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1E1E1E',
                  border: '1px solid #444',
                  borderRadius: '8px',
                  color: '#FFFFFF',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)'
                }}
                labelStyle={{ color: '#FFFFFF' }}
                itemStyle={{ color: '#FFFFFF' }}
                formatter={(value, name, props) => [
                  <span style={{ fontSize: '16px', fontWeight: 'bold' }}>
                    {`${value} points (${props.payload.percentage}%)`}
                    <br />
                    <span style={{ fontSize: '14px', opacity: 0.8 }}>
                      {`${props.payload.wins || 0} wins out of ${totalRaces} races`}
                    </span>
                  </span>,
                  <span style={{ color: props.color }}>{name}</span>
                ]}
              />
              <text x="50%" y="50%" textAnchor="middle" fill="#F0F0F0" fontSize="16" fontWeight="bold">
                Total Points
              </text>
              <text x="50%" y="58%" textAnchor="middle" fill="#F0F0F0" fontSize="20" fontWeight="bold">
                1,431
              </text>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default SeasonOverview;