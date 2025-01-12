import React from 'react';

interface SeasonSelectorProps {
  seasons: { season: string }[];
  selectedSeason: string;
  onSeasonChange: (season: string) => void;
}

const SeasonSelector: React.FC<SeasonSelectorProps> = ({ seasons, selectedSeason, onSeasonChange }) => (
  <select
    value={selectedSeason}
    onChange={(e) => onSeasonChange(e.target.value)}
    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
  >
    {seasons.map(({ season }) => (
      <option key={season} value={season}>
        {season} Season
      </option>
    ))}
  </select>
);

export default SeasonSelector;