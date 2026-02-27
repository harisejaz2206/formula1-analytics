/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { getDriverStandings, getConstructorStandings, getSeasons } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import PageHeader from '../components/layout/PageHeader';
import { Users, Building2, Trophy, Flag, Target, Calendar } from 'lucide-react';

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
      } catch {
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
      } catch {
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
      <PageHeader
        icon={Users}
        overline="DRIVER + CONSTRUCTOR INTELLIGENCE"
        title="Driver & Team Profiles"
        subtitle="Championship standings, teammate dynamics, and constructor performance in one analytical workspace."
      />

      {/* Season Selector */}
      <div className="f1-card mb-8 flex flex-col items-start justify-between gap-4 p-4 sm:flex-row sm:items-center">
        <div className="flex items-center">
          <Calendar className="w-6 h-6 text-f1-red mr-2" />
          <h2 className="text-xl font-semibold text-f1-text">Season Overview</h2>
        </div>
        <div className="w-full sm:w-auto">
          <select
            value={selectedSeason}
            onChange={(e) => setSelectedSeason(e.target.value)}
            className="f1-select min-w-[12rem]"
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
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="f1-card p-6 flex items-center space-x-4 group hover:scale-105 transition-transform duration-300">
          <div className="p-3 bg-f1-red/10 rounded-lg group-hover:scale-110 transition-transform duration-300">
            <Trophy className="w-6 h-6 text-f1-red" />
          </div>
          <div>
            <p className="text-f1-muted text-sm">Champion's Points</p>
            <p className="text-2xl font-semibold text-f1-text">{drivers[0]?.points || 0}</p>
            <p className="text-xs text-f1-muted">{drivers[0]?.Driver?.givenName} {drivers[0]?.Driver?.familyName}</p>
          </div>
        </div>
        <div className="f1-card p-6 flex items-center space-x-4 group hover:scale-105 transition-transform duration-300">
          <div className="p-3 bg-f1-red/10 rounded-lg group-hover:scale-110 transition-transform duration-300">
            <Flag className="w-6 h-6 text-f1-red" />
          </div>
          <div>
            <p className="text-f1-muted text-sm">Season Race Wins</p>
            <p className="text-2xl font-semibold text-f1-text">{drivers.reduce((total, driver) => total + parseInt(driver.wins), 0)}</p>
            <p className="text-xs text-f1-muted">Across all drivers</p>
          </div>
        </div>
        <div className="f1-card p-6 flex items-center space-x-4 group hover:scale-105 transition-transform duration-300">
          <div className="p-3 bg-f1-red/10 rounded-lg group-hover:scale-110 transition-transform duration-300">
            <Building2 className="w-6 h-6 text-f1-red" />
          </div>
          <div>
            <p className="text-f1-muted text-sm">Active Teams</p>
            <p className="text-2xl font-semibold text-f1-text">{constructors.length}</p>
            <p className="text-xs text-f1-muted">Constructor entries</p>
          </div>
        </div>
      </div>

      {/* Add new Performance Insights section */}
      <section className="f1-card p-6 mb-8">
        <h2 className="text-2xl font-semibold text-f1-text flex items-center mb-6">
          <Target className="w-6 h-6 mr-2 text-f1-red" />
          Performance Insights
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Points Distribution */}
          <div className="rounded-xl border border-f1-gray/30 bg-f1-surface-soft/70 p-4">
            <h3 className="text-lg font-semibold text-f1-text mb-3">Points Distribution</h3>
            <div className="space-y-2">
              {drivers.slice(0, 5).map(driver => {
                const leaderPoints = parseInt(drivers[0]?.points || '0');
                const percentage = leaderPoints > 0 ? (parseInt(driver.points) / leaderPoints) * 100 : 0;
                return (
                  <div key={driver.Driver.driverId} className="space-y-1">
                    <div className="flex justify-between text-sm text-f1-text">
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
          <div className="rounded-xl border border-f1-gray/30 bg-f1-surface-soft/70 p-4">
            <h3 className="text-lg font-semibold text-f1-text mb-3">Points to Leader</h3>
            <div className="space-y-2">
              {drivers.slice(1, 6).map(driver => {
                const leaderPoints = parseInt(drivers[0]?.points || '0');
                const driverPoints = parseInt(driver.points);
                const gap = leaderPoints - driverPoints;
                return (
                  <div key={driver.Driver.driverId} className="flex justify-between items-center text-sm">
                    <span className="text-f1-text">{driver.Driver.familyName}</span>
                    <span className="px-2 py-1 rounded-full bg-f1-red/10 text-f1-red">
                      -{gap} pts
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Constructor Dominance */}
          <div className="rounded-xl border border-f1-gray/30 bg-f1-surface-soft/70 p-4">
            <h3 className="text-lg font-semibold text-f1-text mb-3">Constructor Dominance</h3>
            <div className="space-y-3">
              {constructors.slice(0, 5).map(constructor => {
                const winsCount = drivers
                  .filter(d => d.Constructors[0].constructorId === constructor.Constructor.constructorId)
                  .reduce((total, driver) => total + parseInt(driver.wins), 0);
                return (
                  <div key={constructor.Constructor.constructorId} className="flex justify-between items-center">
                    <span className="text-sm text-f1-text">{constructor.Constructor.name}</span>
                    <div className="flex items-center space-x-2">
                      <Trophy className="w-4 h-4 text-f1-red" />
                      <span className="text-sm text-f1-text">{winsCount}</span>
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
          <h2 className="text-2xl font-semibold text-f1-text flex items-center">
            <Users className="w-6 h-6 mr-2 text-f1-red" />
            Driver Standings
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="f1-table">
            <thead>
              <tr>
                <th>Position</th>
                <th>Driver</th>
                <th>Constructor</th>
                <th>Points</th>
                <th>Wins</th>
              </tr>
            </thead>
            <tbody>
              {drivers.map((driver) => (
                <tr key={driver.position}>
                  <td className="whitespace-nowrap">
                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full 
                      ${driver.position === '1' ? 'bg-f1-red text-white' :
                        driver.position === '2' ? 'bg-gray-600 text-white' :
                          driver.position === '3' ? 'bg-amber-700 text-white' :
                            'bg-f1-gray/20 text-f1-text'}`}>
                      {driver.position}
                    </span>
                  </td>
                  <td className="whitespace-nowrap">
                    <div className="text-sm text-f1-text font-medium">{driver.Driver.givenName} {driver.Driver.familyName}</div>
                    <div className="text-sm text-f1-muted">{driver.Driver.nationality}</div>
                  </td>
                  <td className="whitespace-nowrap text-sm text-f1-text">{driver.Constructors[0].name}</td>
                  <td className="whitespace-nowrap">
                    <span className="px-3 py-1 rounded-full bg-f1-red/10 text-f1-red font-medium">
                      {driver.points} pts
                    </span>
                  </td>
                  <td className="whitespace-nowrap">
                    <div className="flex items-center text-sm text-f1-text">
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
          <h2 className="text-2xl font-semibold text-f1-text flex items-center">
            <Building2 className="w-6 h-6 mr-2 text-f1-red" />
            Constructor Standings
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="f1-table">
            <thead>
              <tr>
                <th>Position</th>
                <th>Constructor</th>
                <th>Nationality</th>
                <th>Points</th>
                <th>Wins</th>
              </tr>
            </thead>
            <tbody>
              {constructors.map((constructor) => (
                <tr key={constructor.position}>
                  <td className="whitespace-nowrap">
                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full 
                      ${constructor.position === '1' ? 'bg-f1-red text-white' :
                        constructor.position === '2' ? 'bg-gray-600 text-white' :
                          constructor.position === '3' ? 'bg-amber-700 text-white' :
                            'bg-f1-gray/20 text-f1-text'}`}>
                      {constructor.position}
                    </span>
                  </td>
                  <td className="whitespace-nowrap text-sm text-f1-text">{constructor.Constructor.name}</td>
                  <td className="whitespace-nowrap">
                    <div className="flex items-center text-sm text-f1-text">
                      <Flag className="w-4 h-4 mr-2 text-f1-red" />
                      {constructor.Constructor.nationality}
                    </div>
                  </td>
                  <td className="whitespace-nowrap">
                    <span className="px-3 py-1 rounded-full bg-f1-red/10 text-f1-red font-medium">
                      {constructor.points} pts
                    </span>
                  </td>
                  <td className="whitespace-nowrap">
                    <div className="flex items-center text-sm text-f1-text">
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
          <h2 className="text-2xl font-semibold text-f1-text flex items-center mb-6">
            <Users className="w-6 h-6 mr-2 text-f1-red" />
            Teammate Battles
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {teamBattles.map((battle) => (
              <div
                key={battle.constructor}
                className="rounded-xl border border-f1-gray/30 bg-f1-surface-soft/80 p-4 transition-colors duration-200 hover:bg-f1-surface-soft"
              >
                <div className="mb-2 flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-lg font-semibold text-f1-text">{battle.constructor}</h3>
                    <span className="px-3 py-1 rounded-full bg-f1-red/10 text-f1-red text-sm font-medium">
                      {battle.totalPoints} pts
                    </span>
                  </div>
                  <span className="text-xs text-f1-muted px-2 py-1 bg-f1-gray/20 rounded-full">
                    P{constructors.findIndex(c => c.Constructor.name === battle.constructor) + 1}
                  </span>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-f1-text">
                      {battle.driver1.name}
                      <span className="ml-2 px-2 py-1 rounded-full bg-f1-red/10 text-f1-red">
                        {battle.driver1.points} pts
                      </span>
                    </span>
                    <span className="text-f1-text">
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

                  <div className="flex justify-between text-xs text-f1-muted">
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
