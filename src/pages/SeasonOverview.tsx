import React, { useState, useEffect } from 'react';
import { getDriverStandings, getConstructorStandings, getSeasons, getSeasonResults } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import SeasonSelector from '../components/SeasonSelector';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';

const SeasonOverview: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [seasons, setSeasons] = useState<any[]>([]);
  const [selectedSeason, setSelectedSeason] = useState('2024');
  const [driverStandings, setDriverStandings] = useState<any[]>([]);
  const [constructorStandings, setConstructorStandings] = useState<any[]>([]);
  const [seasonResults, setSeasonResults] = useState<any[]>([]);

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
        setDriverStandings(drivers);
        setConstructorStandings(constructors);
        setSeasonResults(results);
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
      <h1 className="text-3xl font-bold text-gray-900">Season Overview</h1>

      <div className="w-full md:w-1/2">
        <label className="block text-sm font-medium text-gray-700">Season</label>
        <SeasonSelector
          seasons={seasons}
          selectedSeason={selectedSeason}
          onSeasonChange={setSelectedSeason}
        />
      </div>

      {/* Championship Standings Section */}
      <section className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Championship Standings</h2>
        
        <div className="space-y-6">
          {/* Driver Standings Chart */}
          <div>
            <h3 className="text-lg font-medium mb-4">Top 5 Drivers</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={top5Drivers}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="points" fill="#ef4444" name="Points" />
                  <Bar dataKey="wins" fill="#3b82f6" name="Wins" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Constructor Standings Chart */}
          <div>
            <h3 className="text-lg font-medium mb-4">Top 5 Constructors</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={top5Constructors}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="points" fill="#ef4444" name="Points" />
                  <Bar dataKey="wins" fill="#3b82f6" name="Wins" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </section>

      {/* Race Calendar Section */}
      <section className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Race Calendar</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Round</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Race</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Circuit</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Winner</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {seasonResults.map((race) => (
                <tr key={race.round}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{race.round}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{race.raceName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{race.Circuit.circuitName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{race.date}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {race.Results?.[0]?.Driver ? 
                      `${race.Results[0].Driver.givenName} ${race.Results[0].Driver.familyName}` :
                      'TBD'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default SeasonOverview;