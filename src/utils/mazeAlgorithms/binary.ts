import { Cell } from '../types';

export const binaryMaze = (
  rows: number,
  columns: number,
  horizontalBias: number
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

  // For each cell, carve a passage either north or east
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns; col++) {
      // Skip cells on the north and east edges
      const canCarveNorth = row > 0;
      const canCarveEast = col < columns - 1;

      if (!canCarveNorth && !canCarveEast) continue;

      // Decide direction based on horizontal bias
      const shouldCarveEast = 
        !canCarveNorth || 
        (canCarveEast && Math.random() < horizontalBias);

      if (shouldCarveEast && canCarveEast) {
        // Remove walls between current cell and eastern neighbor
        maze[row][col].eastWall = false;
        maze[row][col + 1].westWall = false;
      } else if (canCarveNorth) {
        // Remove walls between current cell and northern neighbor
        maze[row][col].northWall = false;
        maze[row - 1][col].southWall = false;
      }
    }
  }

  return maze;
};