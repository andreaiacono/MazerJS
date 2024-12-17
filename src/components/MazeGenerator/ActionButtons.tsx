import React from 'react';
import { Button } from '../../components/ui/button';

interface ActionButtonsProps {
  onGenerate: () => void;
  onSolve: () => void;
  onShowSolution: () => void;
  onExport: () => void;
  isSolving: boolean;
  isSolutionShown: boolean;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  onGenerate,
  onSolve,
  onShowSolution,
  onExport,
  isSolving,
  isSolutionShown
}) => {
  return (
    <div className="absolute top-8 left-8 z-20 flex gap-2">
      <Button 
        onClick={onGenerate}
        className="hover:bg-blue-400 hover:scale-105 transition-all duration-200"
      >
        Generate
      </Button>
      <Button 
        onClick={onSolve}
        className="hover:bg-blue-400 hover:scale-105 transition-all duration-200"
      >
        {isSolving ? 'Stop Solving' : 'Solve'}
      </Button>
      <Button 
        onClick={onShowSolution}
        disabled={isSolving}
        className="hover:bg-blue-400 hover:scale-105 transition-all duration-200 disabled:hover:bg-primary disabled:hover:scale-100"
      >
        {isSolutionShown ? 'Hide Solution' : 'Show Solution'}
      </Button>
      <Button 
        onClick={onExport}
        className="hover:bg-blue-400 hover:scale-105 transition-all duration-200"
      >
        Export
      </Button>
    </div>
  );
};