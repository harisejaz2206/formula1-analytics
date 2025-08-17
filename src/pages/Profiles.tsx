import React, { useState, useEffect } from 'react';
import { getDriverStandings, getConstructorStandings, getSeasons } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { Users, Building2, Trophy, Flag, Target, Calendar, ChevronDown } from 'lucide-react';

const Profiles: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [constructors, setConstructors] = useState<any[]>([]);
  const [teamBattles, setTeamBattles] = useState<any[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<string>(new Date().getFullYear().toString());
  const [availableSeasons, setAvailableSeasons] = useState<string[]>([]);

  const calculateTeamBattles = (driversData: any[]) => {
    // First, group drivers by constructor
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

    // Create team battle comparisons with total points
    const battles = Object.entries(constructorGroups).map(([constructor, drivers]) => {
      const typedDrivers = drivers as any[];
      // If there's only one driver, create a comparison with "TBA"
      if (typedDrivers.length === 1) {
        typedDrivers.push({
          name: "TBA",
          points: 0,
          wins: 0,
          position: "-"
        });
      }

      const pointsTotal = typedDrivers[0].points + typedDrivers[1].points;
      const driver1Percentage = pointsTotal === 0 ? 50 : (typedDrivers[0].points / pointsTotal) * 100;

      return {
        constructor,
        driver1: typedDrivers[0],
        driver2: typedDrivers[1],
        pointsPercentage: driver1Percentage,
        totalPoints: pointsTotal // Add total points
      };
    });

    // Sort by total points in descending order
    return battles.sort((a, b) => b.totalPoints - a.totalPoints);
  };

  useEffect(() => {
    const fetchSeasons = async () => {
      try {
        const seasons = await getSeasons();
        // Sort seasons in descending order (newest first)
        const sortedSeasons = seasons
          .map(season => season.season)
          .sort((a, b) => parseInt(b) - parseInt(a));
        setAvailableSeasons(sortedSeasons);
        
        // Ensure the current year is selected if it exists in the available seasons
        const currentYear = new Date().getFullYear().toString();
        if (sortedSeasons.includes(currentYear) && selectedSeason !== currentYear) {
          setSelectedSeason(currentYear);
        }
      } catch (err) {
        console.error('Failed to load seasons:', err);
      }
    };

    fetchSeasons();
  }, [selectedSeason]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [driversData, constructorsData] = await Promise.all([
          getDriverStandings(selectedSeason),
          getConstructorStandings(selectedSeason)
        ]);
        
        if (!driversData || driversData.length === 0) {
          setError('No driver standings data available for this season');
          return;
        }
        
        if (!constructorsData || constructorsData.length === 0) {
          setError('No constructor standings data available for this season');
          return;
        }
        
        setDrivers(driversData);
        setConstructors(constructorsData);
        setTeamBattles(calculateTeamBattles(driversData));
      } catch (err) {
        console.error('Error loading profile data:', err);
        setError('Failed to load profile data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedSeason]);

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

      {/* Season Selector */}
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
            {availableSeasons.map((season) => {
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

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="f1-card p-6 flex items-center space-x-4 group hover:scale-105 transition-transform duration-300">
          <div className="p-3 bg-f1-red/10 rounded-lg group-hover:scale-110 transition-transform duration-300">
            <Trophy className="w-6 h-6 text-f1-red" />
          </div>
          <div>
            <p className="text-f1-silver/70 text-sm">Champion's Points</p>
            <p className="text-2xl font-bold text-white">{drivers[0]?.points || 0}</p>
            <p className="text-xs text-f1-silver/50">{drivers[0]?.Driver?.givenName} {drivers[0]?.Driver?.familyName}</p>
          </div>
        </div>
        <div className="f1-card p-6 flex items-center space-x-4 group hover:scale-105 transition-transform duration-300">
          <div className="p-3 bg-f1-red/10 rounded-lg group-hover:scale-110 transition-transform duration-300">
            <Flag className="w-6 h-6 text-f1-red" />
          </div>
          <div>
            <p className="text-f1-silver/70 text-sm">Season Race Wins</p>
            <p className="text-2xl font-bold text-white">{drivers.reduce((total, driver) => total + parseInt(driver.wins), 0)}</p>
            <p className="text-xs text-f1-silver/50">Across all drivers</p>
          </div>
        </div>
        <div className="f1-card p-6 flex items-center space-x-4 group hover:scale-105 transition-transform duration-300">
          <div className="p-3 bg-f1-red/10 rounded-lg group-hover:scale-110 transition-transform duration-300">
            <Building2 className="w-6 h-6 text-f1-red" />
          </div>
          <div>
            <p className="text-f1-silver/70 text-sm">Active Teams</p>
            <p className="text-2xl font-bold text-white">{constructors.length}</p>
            <p className="text-xs text-f1-silver/50">Constructor entries</p>
          </div>
        </div>
      </div>

      {/* Add new Performance Insights section */}
      <section className="f1-card p-6 mb-8">
        <h2 className="text-2xl font-bold text-white flex items-center mb-6">
          <Target className="w-6 h-6 mr-2 text-f1-red" />
          Performance Insights
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Points Distribution */}
          <div className="bg-f1-gray/20 rounded-xl p-4">
            <h3 className="text-lg font-bold text-white mb-3">Points Distribution</h3>
            <div className="space-y-2">
              {drivers.slice(0, 5).map(driver => {
                const leaderPoints = parseInt(drivers[0]?.points || '0');
                const percentage = leaderPoints > 0 ? (parseInt(driver.points) / leaderPoints) * 100 : 0;
                return (
                  <div key={driver.Driver.driverId} className="space-y-1">
                    <div className="flex justify-between text-sm text-f1-silver">
                      <span>{driver.Driver.familyName}</span>
                      <span>{driver.points} pts</span>
                    </div>
                    <div className="h-1.5 bg-f1-gray/30 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-f1-red/80 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Championship Gap Analysis */}
          <div className="bg-f1-gray/20 rounded-xl p-4">
            <h3 className="text-lg font-bold text-white mb-3">Points to Leader</h3>
            <div className="space-y-2">
              {drivers.slice(1, 6).map(driver => {
                const leaderPoints = parseInt(drivers[0]?.points || '0');
                const driverPoints = parseInt(driver.points);
                const gap = leaderPoints - driverPoints;
                return (
                  <div key={driver.Driver.driverId} className="flex justify-between items-center text-sm">
                    <span className="text-f1-silver">{driver.Driver.familyName}</span>
                    <span className="px-2 py-1 rounded-full bg-f1-red/10 text-f1-red">
                      -{gap} pts
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Constructor Dominance */}
          <div className="bg-f1-gray/20 rounded-xl p-4">
            <h3 className="text-lg font-bold text-white mb-3">Constructor Dominance</h3>
            <div className="space-y-3">
              {constructors.slice(0, 5).map(constructor => {
                const winsCount = drivers
                  .filter(d => d.Constructors[0].constructorId === constructor.Constructor.constructorId)
                  .reduce((total, driver) => total + parseInt(driver.wins), 0);
                return (
                  <div key={constructor.Constructor.constructorId} className="flex justify-between items-center">
                    <span className="text-sm text-f1-silver">{constructor.Constructor.name}</span>
                    <div className="flex items-center space-x-2">
                      <Trophy className="w-4 h-4 text-f1-red" />
                      <span className="text-sm text-white">{winsCount}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

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
                <div className="mb-2 flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-lg font-bold text-white">{battle.constructor}</h3>
                    <span className="px-3 py-1 rounded-full bg-f1-red/10 text-f1-red text-sm font-medium">
                      {battle.totalPoints} pts
                    </span>
                  </div>
                  <span className="text-xs text-f1-silver/70 px-2 py-1 bg-f1-gray/20 rounded-full">
                    P{constructors.findIndex(c => c.Constructor.name === battle.constructor) + 1}
                  </span>
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
                      className="absolute left-0 top-0 h-full bg-f1-red transition-all duration-500 rounded-l-full"
                      style={{ width: `${battle.pointsPercentage}%` }}
                    />
                    <div
                      className="absolute right-0 top-0 h-full bg-gradient-to-r from-f1-gray to-f1-gray/60 transition-all duration-500 rounded-r-full"
                      style={{ width: `${100 - battle.pointsPercentage}%` }}
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