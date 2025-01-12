import React from 'react';

interface SeasonSelectorProps {
  seasons: string[];
  selectedSeason: string;
  onSeasonChange: (season: string) => void;
}

const SeasonSelector: React.FC<SeasonSelectorProps> = ({ seasons, selectedSeason, onSeasonChange }) => {
  return (
    <select
      value={selectedSeason}
      onChange={(e) => onSeasonChange(e.target.value)}
      className="w-full px-4 py-2.5 bg-f1-black border border-f1-gray rounded-lg
                text-f1-silver hover:border-f1-red focus:border-f1-red focus:ring-1 focus:ring-f1-red
                transition-colors duration-200"
    >
      {seasons.map((season) => (
        <option
          key={season}
          value={season}
          className="bg-f1-black text-f1-silver hover:bg-f1-gray"
        >
          Season {season}
        </option>
      ))}
    </select>
  );
};

export default SeasonSelector;