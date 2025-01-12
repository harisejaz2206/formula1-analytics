import React, { useState, useEffect } from 'react';
import { getDriverStandings, getConstructorStandings } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

const Profiles: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [constructors, setConstructors] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [driversData, constructorsData] = await Promise.all([
          getDriverStandings(),
          getConstructorStandings()
        ]);
        setDrivers(driversData);
        setConstructors(constructorsData);
      } catch (err) {
        setError('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-gray-900">Driver & Team Profiles</h1>
      
      {/* Drivers Section */}
      <section className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Driver Standings</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Driver</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Constructor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Points</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Wins</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {drivers.map((driver) => (
                <tr key={driver.position}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{driver.position}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {driver.Driver.givenName} {driver.Driver.familyName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{driver.Constructors[0].name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{driver.points}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{driver.wins}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Teams Section */}
      <section className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Constructor Standings</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Constructor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nationality</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Points</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Wins</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {constructors.map((constructor) => (
                <tr key={constructor.position}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{constructor.position}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{constructor.Constructor.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{constructor.Constructor.nationality}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{constructor.points}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{constructor.wins}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default Profiles;