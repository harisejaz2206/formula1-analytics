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
      className="f1-select"
    >
      {seasons.map((season) => (
        <option
          key={season}
          value={season}
          className="bg-f1-surface text-f1-text"
        >
          Season {season}
        </option>
      ))}
    </select>
  );
};

export default SeasonSelector;
