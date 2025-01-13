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
  const [teamBattles, setTeamBattles] = useState<any[]>([]);

  const calculateTeamBattles = (driversData: any[]) => {
    // Group drivers by constructor
    const constructorGroups = driversData.reduce((groups: any, driver: any) => {
      const constructor = driver.Constructors[0].name;
      if (!groups[constructor]) {
        groups[constructor] = [];
      }
      groups[constructor].push({
        name: `${driver.Driver.givenName} ${driver.Driver.familyName}`,
        points: parseInt(driver.points),
        wins: parseInt(driver.wins),
        position: parseInt(driver.position)
      });
      return groups;
    }, {});

    // Create team battle comparisons
    return Object.entries(constructorGroups)
      .filter(([_, drivers]) => Array.isArray(drivers) && drivers.length === 2)
      .map(([constructor, drivers]) => {
        const typedDrivers = drivers as any[];
        const pointsTotal = typedDrivers[0].points + typedDrivers[1].points;
        const driver1Percentage = pointsTotal === 0 ? 50 : (typedDrivers[0].points / pointsTotal) * 100;

        return {
          constructor,
          driver1: typedDrivers[0],
          driver2: typedDrivers[1],
          pointsPercentage: driver1Percentage
        };
      });
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [driversData, constructorsData] = await Promise.all([
          getDriverStandings(),
          getConstructorStandings()
        ]);
        setDrivers(driversData);
        setConstructors(constructorsData);
        setTeamBattles(calculateTeamBattles(driversData));
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

      {teamBattles.length > 0 && (
        <section className="f1-card p-6 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-f1-red/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <h2 className="text-2xl font-bold text-white flex items-center mb-6">
            <Users className="w-6 h-6 mr-2 text-f1-red" />
            Teammate Battles
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {teamBattles.map((battle) => (
              <div
                key={battle.constructor}
                className="bg-f1-gray/20 rounded-xl p-4 hover:bg-f1-gray/30 transition-colors duration-200"
              >
                <div className="mb-2">
                  <h3 className="text-lg font-bold text-white">{battle.constructor}</h3>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-f1-silver">
                      {battle.driver1.name}
                      <span className="ml-2 px-2 py-1 rounded-full bg-f1-red/10 text-f1-red">
                        {battle.driver1.points} pts
                      </span>
                    </span>
                    <span className="text-f1-silver">
                      <span className="mr-2 px-2 py-1 rounded-full bg-f1-red/10 text-f1-red">
                        {battle.driver2.points} pts
                      </span>
                      {battle.driver2.name}
                    </span>
                  </div>

                  <div className="relative h-2 bg-f1-gray/30 rounded-full overflow-hidden">
                    <div
                      className="absolute left-0 top-0 h-full bg-f1-red transition-all duration-500"
                      style={{ width: `${battle.pointsPercentage}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-xs text-f1-silver/70">
                    <div>
                      <span className="mr-2">Championship: P{battle.driver1.position}</span>
                      <span className="px-2 py-1 rounded-full bg-f1-red/10 text-f1-red">
                        {battle.driver1.wins} {battle.driver1.wins === 1 ? 'win' : 'wins'}
                      </span>
                    </div>
                    <div>
                      <span className="px-2 py-1 rounded-full bg-f1-red/10 text-f1-red">
                        {battle.driver2.wins} {battle.driver2.wins === 1 ? 'win' : 'wins'}
                      </span>
                      <span className="ml-2">Championship: P{battle.driver2.position}</span>
                    </div>
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

export default Profiles;