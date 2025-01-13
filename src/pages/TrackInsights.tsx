import React, { useState, useEffect } from 'react';
import { getCircuits, getSeasons } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import SeasonSelector from '../components/SeasonSelector';
import { MapPin, Calendar, Globe2, Trophy, Flag, ExternalLink, Clock, Zap, Activity } from 'lucide-react';

interface Circuit {
  circuitId: string;
  circuitName: string;
  Location: {
    lat: string;
    long: string;
    locality: string;
    country: string;
  };
  url: string;
}

const TrackInsights: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [circuits, setCircuits] = useState<Circuit[]>([]);
  const [seasons, setSeasons] = useState<string[]>([]);
  const [selectedSeason, setSelectedSeason] = useState('2024');
  const [selectedCircuit, setSelectedCircuit] = useState<Circuit | null>(null);

  useEffect(() => {
    const fetchSeasons = async () => {
      try {
        const seasonsData = await getSeasons();
        // Transform the seasons data to array of strings
        const transformedSeasons = seasonsData.map((season: any) => season.season.toString());
        setSeasons(transformedSeasons);
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
        if (circuitsData.length > 0) {
          setSelectedCircuit(circuitsData[0]);
        }
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
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-f1-black to-f1-gray p-8 mb-8">
        <div className="relative z-10">
          <h1 className="text-4xl font-bold text-white mb-2">Track Insights</h1>
          <p className="text-f1-silver/80 text-lg">Circuit Details and Analysis</p>
        </div>
        <div className="absolute top-0 right-0 w-1/3 h-full opacity-10">
          <Flag className="w-full h-full" />
        </div>
      </div>

      {/* Selectors Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="f1-card p-6 backdrop-blur-sm">
          <label className="block text-sm font-medium text-f1-silver mb-2 uppercase tracking-wider flex items-center">
            <Calendar className="w-4 h-4 mr-2 text-f1-red" />
            Season
          </label>
          <SeasonSelector
            seasons={seasons}
            selectedSeason={selectedSeason}
            onSeasonChange={setSelectedSeason}
          />
        </div>
        <div className="f1-card p-6 backdrop-blur-sm">
          <label className="block text-sm font-medium text-f1-silver mb-2 uppercase tracking-wider flex items-center">
            <MapPin className="w-4 h-4 mr-2 text-f1-red" />
            Circuit
          </label>
          <select
            value={selectedCircuit?.circuitId || ''}
            onChange={(e) => {
              const circuit = circuits.find(c => c.circuitId === e.target.value);
              if (circuit) setSelectedCircuit(circuit);
            }}
            className="w-full px-4 py-2.5 bg-f1-black border border-f1-gray rounded-lg
                      text-f1-silver hover:border-f1-red focus:border-f1-red focus:ring-1 focus:ring-f1-red
                      transition-colors duration-200"
          >
            {circuits.map((circuit) => (
              <option
                key={circuit.circuitId}
                value={circuit.circuitId}
                className="bg-f1-black text-f1-silver hover:bg-f1-gray"
              >
                {circuit.circuitName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedCircuit && (
        <>
          {/* Circuit Map Section */}
          <section className="f1-card p-6 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-f1-red/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <Globe2 className="w-6 h-6 mr-2 text-f1-red" />
              Circuit Map
            </h2>
            <div className="aspect-w-16 aspect-h-9 rounded-lg overflow-hidden">
              <div className="w-full h-[400px] rounded-lg border-2 border-f1-gray/20 bg-f1-black/50 
                              flex flex-col items-center justify-center p-8 text-center">
                <MapPin className="w-16 h-16 text-f1-red mb-4 animate-bounce" />
                <h3 className="text-2xl font-bold text-white mb-2">
                  Interactive Circuit Map Coming Soon
                </h3>
                <p className="text-f1-silver/60 max-w-md mb-6">
                  We're working on bringing you detailed 3D circuit maps with sector information,
                  DRS zones, and historical racing lines.
                </p>
                <div className="flex gap-4 text-sm">
                  <div className="flex items-center text-f1-silver/80">
                    <Clock className="w-4 h-4 mr-2 text-f1-red" />
                    Sector Times
                  </div>
                  <div className="flex items-center text-f1-silver/80">
                    <Zap className="w-4 h-4 mr-2 text-f1-red" />
                    DRS Zones
                  </div>
                  <div className="flex items-center text-f1-silver/80">
                    <Activity className="w-4 h-4 mr-2 text-f1-red" />
                    Racing Lines
                  </div>
                </div>
                <div className="mt-8 flex gap-2">
                  <span className="w-2 h-2 rounded-full bg-f1-red animate-pulse"></span>
                  <span className="w-2 h-2 rounded-full bg-f1-red animate-pulse delay-100"></span>
                  <span className="w-2 h-2 rounded-full bg-f1-red animate-pulse delay-200"></span>
                </div>
              </div>
            </div>
          </section>

          {/* Circuit Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Location Details */}
            <section className="f1-card p-6 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-f1-red/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                <MapPin className="w-6 h-6 mr-2 text-f1-red" />
                Location Details
              </h2>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Flag className="w-5 h-5 text-f1-red mt-1" />
                  <div>
                    <p className="text-f1-silver font-medium">{selectedCircuit.Location.locality}</p>
                    <p className="text-f1-silver/60">{selectedCircuit.Location.country}</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Globe2 className="w-5 h-5 text-f1-red mt-1" />
                  <div>
                    <p className="text-f1-silver/60">Coordinates</p>
                    <p className="text-f1-silver font-medium">
                      {selectedCircuit.Location.lat}, {selectedCircuit.Location.long}
                    </p>
                  </div>
                </div>
                <a
                  href={selectedCircuit.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2 text-f1-red hover:text-f1-red/80 transition-colors duration-300"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Official Circuit Website</span>
                </a>
              </div>
            </section>

            {/* Track Records */}
            <section className="f1-card p-6 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-f1-red/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                <Trophy className="w-6 h-6 mr-2 text-f1-red" />
                Track Records
              </h2>
              <div className="space-y-4">
                <div className="f1-card bg-f1-black/30 p-4 backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-f1-silver/60 text-sm">Lap Record (Race)</span>
                    <Clock className="w-4 h-4 text-f1-red" />
                  </div>
                  <div className="text-f1-silver">Data not available</div>
                </div>
                <div className="f1-card bg-f1-black/30 p-4 backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-f1-silver/60 text-sm">Fastest Lap (Qualifying)</span>
                    <Clock className="w-4 h-4 text-f1-red" />
                  </div>
                  <div className="text-f1-silver">Data not available</div>
                </div>
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
};

export default TrackInsights;