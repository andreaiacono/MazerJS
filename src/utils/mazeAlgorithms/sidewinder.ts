import { Cell } from '../types';
import { createEmptyGrid, getRandomWithBias } from './utils';

export const sidewinderMaze = (
  rows: number, 
  columns: number,
  horizontalBias: number,
  branchingProbability: number
): Cell[][] => {
  horizontalBias /=100
  const grid = createEmptyGrid(rows, columns);

  for (let row = 0; row < rows; row++) {
    let run: number[] = [];
    
    for (let col = 0; col < columns; col++) {
      run.push(col);
      
      const atEasternBoundary = col === columns - 1;
      const atNorthernBoundary = row === 0;
      
      // Use horizontalBias to determine if we should close out the run
      const shouldCloseOut = atEasternBoundary || 
        (!atNorthernBoundary && getRandomWithBias(1 - horizontalBias));

      if (shouldCloseOut) {
        // Use branchingProbability to determine if we create a vertical passage
        if (!atNorthernBoundary && getRandomWithBias(branchingProbability)) {
          const randomCol = run[Math.floor(Math.random() * run.length)];
          grid[row][randomCol].northWall = false;
          grid[row-1][randomCol].southWall = false;
        }
        run = [];
      } else {
        grid[row][col].eastWall = false;
        grid[row][col+1].westWall = false;
      }
    }
  }
  return grid;
};