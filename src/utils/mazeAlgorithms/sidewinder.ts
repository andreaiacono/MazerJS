import { Cell } from '../types';

export const sidewinderMaze = (
  rows: number,
  columns: number,
  horizontalBias: number,
  branchingProbability: number
): Cell[][] => {
  // Initialize maze with all walls
  const maze: Cell[][] = Array(rows).fill(null).map(() =>
    Array(columns).fill(null).map(() => ({
      northWall: true,
      southWall: true,
      eastWall: true,
      westWall: true,
      visited: false
    }))
  );

  // Process each row
  for (let row = 0; row < rows; row++) {
    let runStart = 0;

    for (let col = 0; col < columns; col++) {
      // Skip first row - no northern passages
      if (row === 0) {
        if (col < columns - 1) {
          // Carve east in first row
          maze[row][col].eastWall = false;
          maze[row][col + 1].westWall = false;
        }
        continue;
      }

      const atEasternBoundary = col === columns - 1;
      const shouldCloseRun = atEasternBoundary || 
        Math.random() >= horizontalBias;

      if (!atEasternBoundary && !shouldCloseRun) {
        // Carve east
        maze[row][col].eastWall = false;
        maze[row][col + 1].westWall = false;
      }

      if (shouldCloseRun && Math.random() < branchingProbability) {
        // Choose random cell in run to connect north
        const northCell = runStart + Math.floor(Math.random() * (col - runStart + 1));
        maze[row][northCell].northWall = false;
        maze[row - 1][northCell].southWall = false;
        runStart = col + 1;
      }
    }
  }

  return maze;
};