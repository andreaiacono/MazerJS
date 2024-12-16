import React, { useState, useCallback } from 'react';
import { MazeContext } from './MazeContext';
import {
  Cell,
  MazeSettings,
  FrameType,
  Position,
  MazeAlgorithm,
  AppearanceSettings,
  SolverSettings
} from '../utils/types';
import { useMazeSolving } from '../hooks/useMazeSolving';
import { useMazeGeneration } from '../hooks/useMazeGeneration';  // Add this import

export const MazeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Core maze state
  const [maze, setMaze] = useState<Cell[][]>([]);
  const [frameType, setFrameType] = useState<FrameType>('square');
  const [algorithm, setAlgorithm] = useState<MazeAlgorithm>('recursive-backtracker');
  const [letterCells, setLetterCells] = useState<Set<string>>(new Set());

  // Settings states
  const [mazeSettings, setMazeSettings] = useState<MazeSettings>({
    horizontalBias: 90,
    branchingProbability: 90,
    deadEndDensity: 50,
    multipleExits: false,
    entrancePosition: 'west',
    exitPosition: 'east',
    symmetry: 'none'
  });

  const [appearanceSettings, setAppearanceSettings] = useState<AppearanceSettings>({
    rows: 10,
    columns: 10,
    polygonSides: 6,
    cellSize: 30,
    wallThickness: 2,
    showArrows: true,
    wallColor: "#000000",
    backgroundColor: "#ffffff",
    text: "MAZE",
    letterDistance: 5,
    letterSize: 5
  });

  const [solverSettings, setSolverSettings] = useState<SolverSettings>({
    speed: 50,
    solutionColor: '#4CAF50',
    isSolving: false
  });

  const [solutionPath, setSolutionPath] = useState<Position[]>([]);

  const { solveMaze: solveWithAnimation, abortSolving, isSolving, isSolutionShown, setIsSolutionShown } = useMazeSolving(
    maze,
    solverSettings.speed,
    frameType as 'square' | 'circular' | 'polygon' | 'text'
  );

  // Add path update handler
  const handlePathUpdate = useCallback((path: Position[]) => {
    setSolutionPath(path);
  }, []);

  // Use the custom hook
  const { generateMaze: generateMazeFromHook } = useMazeGeneration(
    frameType,
    algorithm,
    appearanceSettings.rows,
    appearanceSettings.columns,
    mazeSettings,
    appearanceSettings.text,
    appearanceSettings.polygonSides,
    appearanceSettings.cellSize,
    setLetterCells
  );

  const generateMaze = useCallback(() => {
    abortSolving();
    setSolutionPath([]);
    setSolverSettings(prev => ({ ...prev, isSolving: false }));
    
    const newMaze = generateMazeFromHook();
    setMaze(newMaze);
  }, [generateMazeFromHook, abortSolving]);


  const showSolution = useCallback(async () => {
    if (isSolutionShown) {
      setSolutionPath([]);
      setIsSolutionShown(false);
    } else {
      try {
        await solveWithAnimation(handlePathUpdate, false, (shown) => setIsSolutionShown(shown));
        setIsSolutionShown(true);
      } catch (error) {
        console.error('Error showing solution:', error);
      }
    }
  }, [solveWithAnimation, handlePathUpdate, isSolutionShown, setIsSolutionShown]);

  const handleSolveMaze = useCallback(async () => {
    setSolutionPath([]);
    setIsSolutionShown(isSolutionShown)
    if (isSolving) {
      abortSolving();
      return;
    }

    try {
      await solveWithAnimation(handlePathUpdate, true, (shown) => setIsSolutionShown(shown)  // Pass callback to handle solution shown state
      );
    } catch (error) {
      console.error('Error during maze solving:', error);
    }
  }, [solveWithAnimation, handlePathUpdate, isSolving, abortSolving, isSolutionShown, setIsSolutionShown]);


  const exportMaze = useCallback(() => {

  }, []);

  const updateSolverSettings = (updates: Partial<SolverSettings>) => {
    setSolverSettings(prev => ({ ...prev, ...updates }));
  };

  const contextValue = {
    // Core state
    maze,
    setMaze,
    frameType,
    setFrameType,
    algorithm,
    setAlgorithm,
    solutionPath,
    isSolving,

    // Settings
    mazeSettings,
    setMazeSettings,
    appearanceSettings,
    setAppearanceSettings,
    solverSettings,
    updateSolverSettings,
    letterCells,
    setLetterCells,

    // Actions
    generateMaze,
    solveMaze: handleSolveMaze,
    showSolution,
    exportMaze,
    isSolutionShown,
    setSolutionPath
  };

  return (
    <MazeContext.Provider value={contextValue}>
      {children}
    </MazeContext.Provider>
  );
};