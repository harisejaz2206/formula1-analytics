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
      className="f1-select"
    >
      {rounds.map((round) => (
        <option
          key={round.round}
          value={round.round}
          className="bg-f1-surface text-f1-text"
        >
          Round {round.round} - {round.raceName}
        </option>
      ))}
    </select>
  );
};

export default RoundSelector;
