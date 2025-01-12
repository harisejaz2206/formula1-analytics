import React, { useState, useEffect } from 'react';
import { getDriverStandings, getConstructorStandings } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { Users, Building2, Trophy, Flag, Medal, Target } from 'lucide-react';

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
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-f1-black to-f1-gray p-8 mb-8">
        <div className="relative z-10">
          <h1 className="text-4xl font-bold text-white mb-2">Driver & Team Profiles</h1>
          <p className="text-f1-silver/80 text-lg">Championship Standings and Statistics</p>
        </div>
        <div className="absolute top-0 right-0 w-1/3 h-full opacity-10">
          <Users className="w-full h-full" />
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="f1-card p-6 flex items-center space-x-4 group hover:scale-105 transition-transform duration-300">
          <div className="p-3 bg-f1-red/10 rounded-lg group-hover:scale-110 transition-transform duration-300">
            <Trophy className="w-6 h-6 text-f1-red" />
          </div>
          <div>
            <p className="text-f1-silver/70 text-sm">Total Points</p>
            <p className="text-2xl font-bold text-white">{drivers[0]?.points || 0}</p>
          </div>
        </div>
        <div className="f1-card p-6 flex items-center space-x-4 group hover:scale-105 transition-transform duration-300">
          <div className="p-3 bg-f1-red/10 rounded-lg group-hover:scale-110 transition-transform duration-300">
            <Medal className="w-6 h-6 text-f1-red" />
          </div>
          <div>
            <p className="text-f1-silver/70 text-sm">Race Wins</p>
            <p className="text-2xl font-bold text-white">{drivers[0]?.wins || 0}</p>
          </div>
        </div>
        <div className="f1-card p-6 flex items-center space-x-4 group hover:scale-105 transition-transform duration-300">
          <div className="p-3 bg-f1-red/10 rounded-lg group-hover:scale-110 transition-transform duration-300">
            <Target className="w-6 h-6 text-f1-red" />
          </div>
          <div>
            <p className="text-f1-silver/70 text-sm">Constructors</p>
            <p className="text-2xl font-bold text-white">{constructors.length}</p>
          </div>
        </div>
      </div>

      {/* Drivers Section */}
      <section className="f1-card p-6 relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-f1-red/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center">
            <Users className="w-6 h-6 mr-2 text-f1-red" />
            Driver Standings
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-800">
            <thead className="bg-f1-black/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-f1-silver uppercase tracking-wider">Position</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-f1-silver uppercase tracking-wider">Driver</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-f1-silver uppercase tracking-wider">Constructor</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-f1-silver uppercase tracking-wider">Points</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-f1-silver uppercase tracking-wider">Wins</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {drivers.map((driver) => (
                <tr
                  key={driver.position}
                  className="group/row hover:bg-f1-gray/30 transition-colors duration-200"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full 
                      ${driver.position === '1' ? 'bg-f1-red text-white' :
                        driver.position === '2' ? 'bg-gray-600 text-white' :
                          driver.position === '3' ? 'bg-amber-700 text-white' :
                            'bg-f1-gray/20 text-f1-silver'}`}>
                      {driver.position}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-f1-silver font-medium">{driver.Driver.givenName} {driver.Driver.familyName}</div>
                    <div className="text-sm text-f1-silver/60">{driver.Driver.nationality}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-f1-silver">{driver.Constructors[0].name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-3 py-1 rounded-full bg-f1-red/10 text-f1-red font-medium">
                      {driver.points} pts
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-f1-silver">
                      <Trophy className="w-4 h-4 mr-2 text-f1-red" />
                      {driver.wins}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Teams Section */}
      <section className="f1-card p-6 relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-f1-red/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center">
            <Building2 className="w-6 h-6 mr-2 text-f1-red" />
            Constructor Standings
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-800">
            <thead className="bg-f1-black/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-f1-silver uppercase tracking-wider">Position</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-f1-silver uppercase tracking-wider">Constructor</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-f1-silver uppercase tracking-wider">Nationality</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-f1-silver uppercase tracking-wider">Points</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-f1-silver uppercase tracking-wider">Wins</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {constructors.map((constructor) => (
                <tr
                  key={constructor.position}
                  className="group/row hover:bg-f1-gray/30 transition-colors duration-200"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full 
                      ${constructor.position === '1' ? 'bg-f1-red text-white' :
                        constructor.position === '2' ? 'bg-gray-600 text-white' :
                          constructor.position === '3' ? 'bg-amber-700 text-white' :
                            'bg-f1-gray/20 text-f1-silver'}`}>
                      {constructor.position}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-f1-silver">{constructor.Constructor.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-f1-silver">
                      <Flag className="w-4 h-4 mr-2 text-f1-red" />
                      {constructor.Constructor.nationality}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-3 py-1 rounded-full bg-f1-red/10 text-f1-red font-medium">
                      {constructor.points} pts
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-f1-silver">
                      <Trophy className="w-4 h-4 mr-2 text-f1-red" />
                      {constructor.wins}
                    </div>
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

export default Profiles;