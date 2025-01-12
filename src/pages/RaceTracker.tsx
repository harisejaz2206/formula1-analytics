import React, { useState, useEffect } from 'react';
import { getRaceResults, getLapTimes, getSeasons, getRounds } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import SeasonSelector from '../components/SeasonSelector';
import RoundSelector from '../components/RoundSelector';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

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
        setSeasons(seasonsData);
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
      <h1 className="text-3xl font-bold text-gray-900">Race Tracker</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Season</label>
          <SeasonSelector
            seasons={seasons}
            selectedSeason={selectedSeason}
            onSeasonChange={setSelectedSeason}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Round</label>
          <RoundSelector
            rounds={rounds}
            selectedRound={selectedRound}
            onRoundChange={setSelectedRound}
          />
        </div>
      </div>
      
      {raceData && (
        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">
            {raceData.raceName} - {raceData.Circuit.circuitName}
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Driver</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Constructor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time/Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Points</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {raceData.Results.map((result: any) => (
                  <tr key={result.position}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{result.position}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {result.Driver.givenName} {result.Driver.familyName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{result.Constructor.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {result.Time?.time || result.status}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{result.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {lapTimes.length > 0 && (
        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Lap Times Analysis</h2>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lapTimes}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="lap" />
                <YAxis />
                <Tooltip />
                <Legend />
                {raceData?.Results.slice(0, 5).map((result: any) => (
                  <Line
                    key={result.Driver.driverId}
                    type="monotone"
                    dataKey={result.Driver.driverId}
                    name={`${result.Driver.givenName} ${result.Driver.familyName}`}
                    stroke={`#${Math.floor(Math.random()*16777215).toString(16)}`}
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