import React, { useState, useEffect } from 'react';
import { getCircuits, getSeasons } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import SeasonSelector from '../components/SeasonSelector';

const TrackInsights: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [circuits, setCircuits] = useState<any[]>([]);
  const [seasons, setSeasons] = useState<any[]>([]);
  const [selectedSeason, setSelectedSeason] = useState('2024');
  const [selectedCircuit, setSelectedCircuit] = useState<any>(null);

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
    const fetchCircuits = async () => {
      setLoading(true);
      try {
        const circuitsData = await getCircuits(selectedSeason);
        setCircuits(circuitsData);
        setSelectedCircuit(circuitsData[0]);
      } catch (err) {
        setError('Failed to load circuits');
      } finally {
        setLoading(false);
      }
    };
    fetchCircuits();
  }, [selectedSeason]);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-gray-900">Track Insights</h1>

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
          <label className="block text-sm font-medium text-gray-700">Circuit</label>
          <select
            value={selectedCircuit?.circuitId}
            onChange={(e) => setSelectedCircuit(circuits.find(c => c.circuitId === e.target.value))}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
          >
            {circuits.map((circuit) => (
              <option key={circuit.circuitId} value={circuit.circuitId}>
                {circuit.circuitName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedCircuit && (
        <>
          {/* Circuit Map Section */}
          <section className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Circuit Map</h2>
            <div className="aspect-w-16 aspect-h-9">
              <iframe
                className="w-full h-[400px] rounded-lg"
                src={`https://www.google.com/maps/embed/v1/place?key=YOUR_GOOGLE_MAPS_API_KEY&q=${selectedCircuit.Location.lat},${selectedCircuit.Location.long}&zoom=14`}
                allowFullScreen
              ></iframe>
            </div>
          </section>

          {/* Circuit Details Section */}
          <section className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Circuit Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Location</h3>
                <p className="text-gray-600">
                  {selectedCircuit.Location.locality}, {selectedCircuit.Location.country}
                </p>
                <p className="text-gray-600 mt-1">
                  Coordinates: {selectedCircuit.Location.lat}, {selectedCircuit.Location.long}
                </p>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Track Information</h3>
                <p className="text-gray-600">
                  <a
                    href={selectedCircuit.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-red-600 hover:text-red-800"
                  >
                    Official Circuit Website
                  </a>
                </p>
              </div>
            </div>
          </section>

          {/* Track Records Section */}
          <section className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Track Records</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Record Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Driver</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {/* Note: This is placeholder data as the API doesn't provide track records */}
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Lap Record (Race)</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Data not available</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">-</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">-</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Fastest Lap (Qualifying)</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Data not available</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">-</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">-</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
};

export default TrackInsights;