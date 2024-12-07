import React from 'react';
import { Button } from '../../components/ui/button';

interface ActionButtonsProps {
  onGenerate: () => void;
  onSolve: () => void;
  onShowSolution: () => void;
  onExport: () => void;
  isSolving: boolean;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  onGenerate,
  onSolve,
  onShowSolution,
  onExport,
  isSolving
}) => {
  return (
    <div className="absolute top-8 left-8 z-20 flex gap-2">
      <Button onClick={onGenerate}>Generate</Button>
      <Button onClick={onSolve}> {isSolving ? 'Stop Solving' : 'Solve'}</Button>
      <Button onClick={onShowSolution}>Show Solution</Button>
      <Button onClick={onExport}>Export</Button>
    </div>
  );
};