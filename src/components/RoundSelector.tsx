import React from 'react';

interface RoundSelectorProps {
  rounds: { round: string; raceName: string }[];
  selectedRound: string;
  onRoundChange: (round: string) => void;
}

const RoundSelector: React.FC<RoundSelectorProps> = ({ rounds, selectedRound, onRoundChange }) => (
  <select
    value={selectedRound}
    onChange={(e) => onRoundChange(e.target.value)}
    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
  >
    {rounds.map(({ round, raceName }) => (
      <option key={round} value={round}>
        Round {round} - {raceName}
      </option>
    ))}
  </select>
);

export default RoundSelector;