import { Cell } from '../types';
import { createEmptyGrid, getRandomWithBias } from './utils';

export const recursiveDivision = (
  rows: number, 
  columns: number,
  horizontalBias: number
): Cell[][] => {
  horizontalBias /= 100
  const grid = createEmptyGrid(rows, columns);
  
  // Start with all internal walls removed
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns; col++) {
      if (row > 0) grid[row][col].northWall = false;
      if (row < rows-1) grid[row][col].southWall = false;
      if (col > 0) grid[row][col].westWall = false;
      if (col < columns-1) grid[row][col].eastWall = false;
    }
  }

  const divide = (
    startRow: number, 
    startCol: number, 
    height: number, 
    width: number
  ) => {
    if (height <= 1 || width <= 1) return;

    // Use horizontalBias to determine wall orientation
    const horizontal = getRandomWithBias(horizontalBias);

    if (horizontal) {
      const wallRow = startRow + Math.floor(Math.random() * (height - 1)) + 1;
      const passage = startCol + Math.floor(Math.random() * width);

      for (let col = startCol; col < startCol + width; col++) {
        if (col !== passage) {
          grid[wallRow][col].northWall = true;
          grid[wallRow-1][col].southWall = true;
        }
      }

      divide(startRow, startCol, wallRow - startRow, width);
      divide(wallRow, startCol, height - (wallRow - startRow), width);
    } else {
      const wallCol = startCol + Math.floor(Math.random() * (width - 1)) + 1;
      const passage = startRow + Math.floor(Math.random() * height);

      for (let row = startRow; row < startRow + height; row++) {
        if (row !== passage) {
          grid[row][wallCol].westWall = true;
          grid[row][wallCol-1].eastWall = true;
        }
      }

      divide(startRow, startCol, height, wallCol - startCol);
      divide(startRow, wallCol, height, width - (wallCol - startCol));
    }
  };

  divide(0, 0, rows, columns);
  return grid;
};