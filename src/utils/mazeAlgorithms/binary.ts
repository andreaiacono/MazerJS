import { Cell } from '../types';
import { createEmptyGrid, getRandomWithBias } from './utils';

export const binaryMaze = (
  rows: number, 
  columns: number, 
  horizontalBias: number
): Cell[][] => {

  horizontalBias /= 100
  const grid = createEmptyGrid(rows, columns);

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns; col++) {
      if (row > 0 && (col === columns - 1 || getRandomWithBias(1 - horizontalBias))) {
        // Remove north wall (vertical passage)
        grid[row][col].northWall = false;
        grid[row-1][col].southWall = false;
      } else if (col < columns - 1) {
        // Remove east wall (horizontal passage)
        grid[row][col].eastWall = false;
        grid[row][col+1].westWall = false;
      }
    }
  }
  return grid;
};