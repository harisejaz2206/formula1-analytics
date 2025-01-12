import React from 'react';

interface Round {
  round: string;
  raceName: string;
}

interface RoundSelectorProps {
  rounds: Round[];
  selectedRound: string;
  onRoundChange: (round: string) => void;
}

const RoundSelector: React.FC<RoundSelectorProps> = ({ rounds, selectedRound, onRoundChange }) => {
  return (
    <select
      value={selectedRound}
      onChange={(e) => onRoundChange(e.target.value)}
      className="w-full px-4 py-2.5 bg-f1-black border border-f1-gray rounded-lg
                text-f1-silver hover:border-f1-red focus:border-f1-red focus:ring-1 focus:ring-f1-red
                transition-colors duration-200"
    >
      {rounds.map((round) => (
        <option
          key={round.round}
          value={round.round}
          className="bg-f1-black text-f1-silver hover:bg-f1-gray"
        >
          Round {round.round} - {round.raceName}
        </option>
      ))}
    </select>
  );
};

export default RoundSelector;