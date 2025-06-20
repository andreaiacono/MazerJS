import { useState, useCallback, useRef, useEffect } from 'react';
import { Cell, Position, SolvingState } from '../utils/types';
import { getValidMoves } from '../utils/helpers/pathfinding';

export const useMazeSolving = (
  maze: Cell[][],
  solveSpeed: number,
  frameType: 'square' | 'circular' | 'polygon' | 'text'
) => {
  const [isSolving, setIsSolving] = useState(false);
  const [isSolutionShown, setIsSolutionShown] = useState(false);
  const isCurrentlySolving = useRef(false);
  const speedRef = useRef(solveSpeed);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    speedRef.current = solveSpeed;
  }, [solveSpeed]);

  const abortSolving = useCallback((onDrawPath?: (path: Position[]) => void) => {
    // Clear the path first, before any state changes
    if (onDrawPath) {
      onDrawPath([]);
    }

    // Then abort the controller and reset states
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    isCurrentlySolving.current = false;
    setIsSolving(false);
    setIsSolutionShown(false)
  }, []);

  const findEntranceExit = useCallback((isEntrance: boolean): Position | null => {
    for (let row = 0; row < maze.length; row++) {
      for (let col = 0; col < maze[row].length; col++) {
        if (isEntrance ? maze[row][col].isEntrance : maze[row][col].isExit) {
          return { row, col };
        }
      }
    }
    return null;
  }, [maze]);

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const findSolution = useCallback(async (
    state: SolvingState,
    entrance: Position,
    exit: Position,
    onDrawPath: (path: Position[]) => void,
    showAnimation: boolean,
    signal: AbortSignal
  ): Promise<boolean> => {
    if (signal.aborted) {
      return false;
    }

    const current = state.currentPath[state.currentPath.length - 1];

    if (current.row === exit.row && current.col === exit.col) {
      state.found = true;
      return true;
    }

    const moves = getValidMoves(current, maze, state.visited, frameType);

    for (const move of moves) {
      if (signal.aborted) return false;

      state.currentPath.push({ row: move.row, col: move.col });
      state.visited.add(`${move.row},${move.col}`);

      if (showAnimation) {
        onDrawPath([...state.currentPath]);

        try {
          await Promise.race([
            delay(100 - speedRef.current),
            new Promise((_, reject) => {
              signal.addEventListener('abort', () => reject(new Error('Animation aborted')));
            })
          ]);
        } catch (error) {
          if (!signal.aborted) {
            onDrawPath([]);
          }
          return false;
        }
      }
      if (await findSolution(state, entrance, exit, onDrawPath, showAnimation, signal)) {
        return true;
      }

      state.currentPath.pop();
      if (!signal.aborted && showAnimation) {
        onDrawPath([...state.currentPath]);
      }
    }

    return false;
  }, [maze, frameType]);

  const solveMaze = useCallback(async (
    onDrawPath: (path: Position[]) => void,
    showAnimation: boolean,
    onSolutionShown?: (shown: boolean) => void  // Add callback parameter
  ) => {
    // If already solving, abort and clear path first
    if (isCurrentlySolving.current) {
      abortSolving(onDrawPath);
      return;
    }

    abortControllerRef.current = new AbortController();
    const { signal } = abortControllerRef.current;

 
    isCurrentlySolving.current = true;
    setIsSolving(true);
    onDrawPath([]); // Clear existing path

    try {
      const entrance = findEntranceExit(true);
      const exit = findEntranceExit(false);

      if (!entrance || !exit) {
        console.error('No entrance or exit found');
        abortSolving(onDrawPath);
        return;
      }

      const state: SolvingState = {
        currentPath: [{ row: entrance.row, col: entrance.col }],
        visited: new Set([`${entrance.row},${entrance.col}`]),
        found: false
      };

      const solved = await findSolution(state, entrance, exit, onDrawPath, showAnimation, signal);

      if (solved) {
        onDrawPath([...state.currentPath]);
        // On successful completion, only reset the solving states
        isCurrentlySolving.current = false;
        setIsSolving(false);
        setIsSolutionShown(true)
        abortControllerRef.current = null;
      } else if (!signal.aborted) {
        // If not solved and not manually aborted, clear everything
        abortSolving(onDrawPath);
      }
    } catch (error) {
      console.error('Error during maze solving:', error);
      abortSolving(onDrawPath);
    }
  }, [findEntranceExit, abortSolving, findSolution]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortSolving();
    };
  }, [abortSolving]);

  return {
    isSolving,
    isSolutionShown,
    solveMaze,
    abortSolving,
    setIsSolutionShown
  };
};