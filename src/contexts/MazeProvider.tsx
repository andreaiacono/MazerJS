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
import { addEntranceAndExit, applySymmetry } from '../utils/mazeAlgorithms/utils';
import {
  binaryMaze,
  sidewinderMaze,
  recursiveBacktracker,
  primsAlgorithm,
  recursiveDivision,
  huntAndKill
} from '../utils/mazeAlgorithms';
import { useMazeSolving } from '../hooks/useMazeSolving';
// import { getArrowPadding } from '../utils/helpers/drawing';
// import { useMazeDrawing } from '../hooks/useMazeDrawing';


export const MazeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Core maze state
  const [maze, setMaze] = useState<Cell[][]>([]);
  const [frameType, setFrameType] = useState<FrameType>('square');
  const [algorithm, setAlgorithm] = useState<MazeAlgorithm>('recursive-backtracker');

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
    letterDistance: 5
  });

  const [solverSettings, setSolverSettings] = useState<SolverSettings>({
    speed: 50,
    solutionColor: '#4CAF50',
    isSolving: false
  });

  const [solutionPath, setSolutionPath] = useState<Position[]>([]);

  const { solveMaze: solveWithAnimation, abortSolving, isSolving } = useMazeSolving(
   maze,
    solverSettings.speed,
    frameType as 'square' | 'circular' | 'polygon' | 'text'
  );

  // Add path update handler
  const handlePathUpdate = useCallback((path: Position[]) => {
    setSolutionPath(path);
  }, []);

  // Maze generation function

  const generateMaze = useCallback(() => {
    console.log('Generating maze with algorithm:', algorithm);

    abortSolving();
    setSolutionPath([]);
    setSolverSettings(prev => ({ ...prev, isSolving: false }));


    const algorithmMap = {
      'binary': () => binaryMaze(
        appearanceSettings.rows,
        appearanceSettings.columns,
        mazeSettings.horizontalBias
      ),
      'sidewinder': () => sidewinderMaze(
        appearanceSettings.rows,
        appearanceSettings.columns,
        mazeSettings.horizontalBias,
        mazeSettings.branchingProbability
      ),
      'recursive-backtracker': () => recursiveBacktracker(
        appearanceSettings.rows,
        appearanceSettings.columns,
        mazeSettings.branchingProbability,
        mazeSettings.deadEndDensity
      ),
      'prims': () => primsAlgorithm(
        appearanceSettings.rows,
        appearanceSettings.columns,
        mazeSettings.branchingProbability
      ),
      'recursive-division': () => recursiveDivision(
        appearanceSettings.rows,
        appearanceSettings.columns,
        mazeSettings.horizontalBias
      ),
      'hunt-and-kill': () => huntAndKill(
        appearanceSettings.rows,
        appearanceSettings.columns,
        mazeSettings.branchingProbability,
        mazeSettings.deadEndDensity
      )
    };

    let newMaze = algorithmMap[algorithm]?.() ||
      binaryMaze(appearanceSettings.rows, appearanceSettings.columns, 0.5);

    if (mazeSettings.symmetry !== 'none') {
      newMaze = applySymmetry(
        newMaze,
        appearanceSettings.rows,
        appearanceSettings.columns,
        mazeSettings.symmetry
      );
    }

    newMaze = addEntranceAndExit(
      newMaze,
      appearanceSettings.rows,
      appearanceSettings.columns,
      mazeSettings,
      frameType
    );

    setMaze(newMaze);
  }, [algorithm, appearanceSettings, mazeSettings, frameType, abortSolving]);


  const handleSolveMaze = useCallback(async () => {
    if (isSolving) {
      // If already solving, abort
      abortSolving();
      setSolutionPath([]);
      return;
    }

    setSolutionPath([]); // Reset path
    try {
      await solveWithAnimation(handlePathUpdate);
    } catch (error) {
      console.error('Error during maze solving:', error);
    }
  }, [solveWithAnimation, handlePathUpdate, isSolving, abortSolving]);


  const showSolution = useCallback(() => {
    // Implement solution showing logic here
  }, []);

  const exportMaze = useCallback(() => {

  }, []);

  const updateSolverSettings = (updates: Partial<SolverSettings>) => {
    setSolverSettings(prev => ({ ...prev, ...updates }));
  };

  // const { drawMaze } = useMazeDrawing();

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

    // Actions
    generateMaze,
    solveMaze: handleSolveMaze,
    showSolution,
    exportMaze,
  };

  return (
    <MazeContext.Provider value={contextValue}>
      {children}
    </MazeContext.Provider>
  );
};