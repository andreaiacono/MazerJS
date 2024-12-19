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

const tooltipClass = `
  pointer-events-none 
  absolute -top-8 
  left-1/2 
  -translate-x-1/2 
  whitespace-nowrap 
  rounded 
  bg-gray-800 
  px-2 
  py-1 
  text-sm 
  text-white 
  opacity-0 
  [transition:opacity_0ms_linear_0ms,visibility_0ms_linear_0ms] 
  group-hover:[transition:opacity_200ms_linear_800ms,visibility_200ms_linear_800ms] 
  group-hover:opacity-100
`;

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
      <div className="group relative">
        <Button
          onClick={onGenerate}
          className="hover:bg-blue-400 hover:scale-105 transition-all duration-200"
        >
          Generate
        </Button>
        <span className={tooltipClass}>
          Generate a new maze according to the settings in the sidebar
        </span>
      </div>

      <div className="group relative">
        <Button
          onClick={onSolve}
          className="hover:bg-blue-400 hover:scale-105 transition-all duration-200"
        >
          {isSolving ? 'Stop Solving' : 'Solve'}
        </Button>
        <span className={tooltipClass}>
          {isSolving ? 'Stop the solving process' : 'Start solving the maze'}
        </span>
      </div>

      <div className="group relative">
        <Button
          onClick={onShowSolution}
          disabled={isSolving}
          className="hover:bg-blue-400 hover:scale-105 transition-all duration-200 disabled:hover:bg-primary disabled:hover:scale-100"
        >
          {isSolutionShown ? 'Hide Solution' : 'Show Solution'}
        </Button>
        <span className={tooltipClass}>
          {isSolutionShown ? 'Hide the solution' : 'Display the solution on the maze'}
        </span>
      </div>

      <div className="group relative">
        <Button
          onClick={onExport}
          className="hover:bg-blue-400 hover:scale-105 transition-all duration-200"
        >
          Export
        </Button>
        <span className={tooltipClass}>
          Export the maze as an image
        </span>
      </div>
    </div>
  );
};