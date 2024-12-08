import React, { createContext, useContext } from 'react';
import { Cell, MazeSettings, FrameType, MazeAlgorithm, AppearanceSettings, SolverSettings, Position } from '../utils/types';
// import { useMazeDrawing } from '../hooks/useMazeDrawing';

interface MazeContextType {
  // Core state
  maze: Cell[][];
  setMaze: React.Dispatch<React.SetStateAction<Cell[][]>>;
  
  // Frame settings
  frameType: FrameType;
  setFrameType: React.Dispatch<React.SetStateAction<FrameType>>;
  
  // Algorithm settings
  algorithm: MazeAlgorithm;
  setAlgorithm: React.Dispatch<React.SetStateAction<MazeAlgorithm>>;
  mazeSettings: MazeSettings;
  setMazeSettings: React.Dispatch<React.SetStateAction<MazeSettings>>;
  
  // Appearance settings
  appearanceSettings: AppearanceSettings;
  setAppearanceSettings: React.Dispatch<React.SetStateAction<AppearanceSettings>>;
  
  // Solver settings
  solverSettings: SolverSettings;
  updateSolverSettings: (updates: Partial<SolverSettings>) => void;
  
  solutionPath: Position[];
  setSolutionPath: (path: Position[]) => void;

  // Actions
  generateMaze: () => void;
  // drawMaze: () => void;
  solveMaze: () => void;
  showSolution: () => void;
  exportMaze: () => void;
  isSolving: boolean;
  isSolutionShown: boolean;
}

export const MazeContext = createContext<MazeContextType | undefined>(undefined);

export const useMazeContext = () => {
  const context = useContext(MazeContext);
  if (context === undefined) {
    throw new Error('useMazeContext must be used within a MazeProvider');
  }
  return context;
};