import { Cell } from '../types';

export const recursiveDivision = (
  rows: number,
  columns: number,
  horizontalBias: number
): Cell[][] => {
  // Initialize maze with NO walls (opposite of other algorithms)
  const maze: Cell[][] = Array(rows).fill(null).map(() =>
    Array(columns).fill(null).map(() => ({
      northWall: false,
      southWall: false,
      eastWall: false,
      westWall: false,
      visited: false
    }))
  );

  // Add outer walls
  for (let i = 0; i < rows; i++) {
    maze[i][0].westWall = true;
    maze[i][columns - 1].eastWall = true;
  }
  for (let i = 0; i < columns; i++) {
    maze[0][i].northWall = true;
    maze[rows - 1][i].southWall = true;
  }

  // Start recursive division
  divide(maze, 0, 0, rows, columns, horizontalBias);

  return maze;
};

const divide = (
  maze: Cell[][],
  startRow: number,
  startCol: number,
  height: number,
  width: number,
  horizontalBias: number
) => {
  if (height <= 2 || width <= 2) return;

  const horizontal = Math.random() < horizontalBias;
  
  if (horizontal) {
    const row = startRow + Math.floor(Math.random() * (height - 2)) + 1;
    const passage = startCol + Math.floor(Math.random() * width);

    // Add horizontal wall
    for (let col = startCol; col < startCol + width; col++) {
      if (col !== passage) {
        maze[row][col].southWall = true;
        maze[row - 1][col].northWall = true;
      }
    }

    // Recursively divide regions
    divide(maze, startRow, startCol, row - startRow, width, horizontalBias);
    divide(maze, row, startCol, height - (row - startRow), width, horizontalBias);
  } else {
    const col = startCol + Math.floor(Math.random() * (width - 2)) + 1;
    const passage = startRow + Math.floor(Math.random() * height);

    // Add vertical wall
    for (let row = startRow; row < startRow + height; row++) {
      if (row !== passage) {
        maze[row][col].eastWall = true;
        maze[row][col - 1].westWall = true;
      }
    }

    // Recursively divide regions
    divide(maze, startRow, startCol, height, col - startCol, horizontalBias);
    divide(maze, startRow, col, height, width - (col - startCol), horizontalBias);
  }
};