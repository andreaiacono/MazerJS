import { useState, useCallback, useRef, useEffect } from 'react';
import { Cell, Position, SolvingState } from '../utils/types';
import { getValidMoves } from '../utils/helpers/pathfinding';
// import { drawLine, getArrowPadding } from '../utils/helpers/drawing';

export const useMazeSolving = (
  maze: Cell[][],
  solveSpeed: number,
  frameType: 'square' | 'circular' | 'polygon' | 'text'
) => {
  const [isSolving, setIsSolving] = useState(false);
  const isCurrentlySolving = useRef(false);
  const speedRef = useRef(solveSpeed);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isCleaningUp = useRef(false);

  useEffect(() => {
    speedRef.current = solveSpeed;
  }, [solveSpeed]);

  const abortSolving = useCallback(() => {
    if (abortControllerRef.current) {
      // Set cleanup flag before aborting
      isCleaningUp.current = true;
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      isCurrentlySolving.current = false;
      setIsSolving(false);
    }
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

  const solveMaze = useCallback(async (onDrawPath: (path: Position[]) => void) => {

    if (isCleaningUp.current) {
      isCleaningUp.current = false;
      return;
    }

    // Clear any existing solving process
    abortSolving();

    // onDrawPath([]);
    // await delay(0);
    abortControllerRef.current = new AbortController();
    const { signal } = abortControllerRef.current;

    const animateSolving = async (
      state: SolvingState,
      entrance: Position,
      exit: Position,
      onDrawPath: (path: Position[]) => void
    ): Promise<boolean> => {

      if (isCleaningUp.current || signal.aborted) {
        return false;
      }

      if (signal.aborted) return false;

      // if (!isCurrentlySolving.current) return false;

      const current = state.currentPath[state.currentPath.length - 1];

      if (current.row === exit.row && current.col === exit.col) {
        state.found = true;
        return true;
      }

      const moves = getValidMoves(current, maze, state.visited, frameType);

      for (const move of moves) {
        if (!isCurrentlySolving.current) return false;

        state.currentPath.push({ row: move.row, col: move.col });
        state.visited.add(`${move.row},${move.col}`);

        onDrawPath([...state.currentPath]);
        try {
          await Promise.race([
            delay(101 - speedRef.current),
            new Promise((_, reject) => {
              signal.addEventListener('abort', () => reject(new Error('Animation aborted')));
            })
          ]);
        } catch (error) {
          return false;
        }

        // console.log(solveSpeed)
        // await delay(101 - speedRef.current);

        if (await animateSolving(state, entrance, exit, onDrawPath)) {
          return true;
        }

        state.currentPath.pop();
        onDrawPath([...state.currentPath]);
      }

      return false;
    };
    // Start new animation
    
    isCurrentlySolving.current = true;
    setIsSolving(true);
    onDrawPath([]); // Clear existing path

    try {
      const entrance = findEntranceExit(true);
      const exit = findEntranceExit(false);

      if (!entrance || !exit) {
        console.error('No entrance or exit found');
        return;
      }

      const state: SolvingState = {
        currentPath: [{ row: entrance.row, col: entrance.col }],
        visited: new Set([`${entrance.row},${entrance.col}`]),
        found: false
      };

      await animateSolving(state, entrance, exit, onDrawPath);
    } finally {
      if (!signal.aborted) {
        abortSolving();
      }
    }
  }, [maze, frameType, findEntranceExit, abortSolving]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortSolving();
    };
  }, [abortSolving]);

  return {
    isSolving,
    solveMaze,
    abortSolving
  };
};

//     if (isCurrentlySolving.current) {
//       isCurrentlySolving.current = false;
//       setIsSolving(false);
//       return;
//     }

//     onDrawPath([]);

//     const entrance = findEntranceExit(true);
//     const exit = findEntranceExit(false);

//     if (!entrance || !exit) {
//       console.error('No entrance or exit found');
//       return;
//     }

//     isCurrentlySolving.current = true;
//     setIsSolving(true);

//     const state: SolvingState = {
//       currentPath: [{ row: entrance.row, col: entrance.col }],
//       visited: new Set([`${entrance.row},${entrance.col}`]),
//       found: false
//     };

//     try {
//       console.log("Starting solve with entrance:", entrance, "exit:", exit);
//       const success = await animateSolving(state, entrance, exit, onDrawPath);
//       console.log("Solve completed:", success ? "Solution found" : "No solution");
//     } finally {
//       isCurrentlySolving.current = false;
//       setIsSolving(false);
//     }
//   }, [frameType, maze, findEntranceExit]);

//   return {
//     isSolving,
//     solveMaze
//   };
// };
