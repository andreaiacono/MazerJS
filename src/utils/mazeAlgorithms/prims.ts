import { Cell, Position } from '../types';
import { removeWalls, getVisitedNeighbors, createEmptyGrid, getRandomWithBias } from './utils'

export const primsAlgorithm = (
  rows: number,
  columns: number,
  branchingProbability: number
): Cell[][] => {

  branchingProbability /= 100

  const grid = createEmptyGrid(rows, columns);
  const walls: [number, number, string][] = [];
  
  // Start from random cell
  const startRow = Math.floor(Math.random() * rows);
  const startCol = Math.floor(Math.random() * columns);
  grid[startRow][startCol].visited = true;

  // Add starting walls
  if (startRow > 0) walls.push([startRow, startCol, 'north']);
  if (startRow < rows-1) walls.push([startRow, startCol, 'south']);
  if (startCol > 0) walls.push([startRow, startCol, 'west']);
  if (startCol < columns-1) walls.push([startRow, startCol, 'east']);

  while (walls.length > 0) {
    // Use branchingProbability to potentially skip some walls
    if (getRandomWithBias(branchingProbability)) {
      const index = Math.floor(Math.random() * walls.length);
      const [row, col, direction] = walls[index];
      walls.splice(index, 1);

      let nextRow = row, nextCol = col;
      if (direction === 'north') nextRow--;
      else if (direction === 'south') nextRow++;
      else if (direction === 'west') nextCol--;
      else nextCol++;

      if (!grid[nextRow][nextCol].visited) {
        // Remove the wall
        if (direction === 'north') {
          grid[row][col].northWall = false;
          grid[nextRow][nextCol].southWall = false;
        } else if (direction === 'south') {
          grid[row][col].southWall = false;
          grid[nextRow][nextCol].northWall = false;
        } else if (direction === 'west') {
          grid[row][col].westWall = false;
          grid[nextRow][nextCol].eastWall = false;
        } else {
          grid[row][col].eastWall = false;
          grid[nextRow][nextCol].westWall = false;
        }

        grid[nextRow][nextCol].visited = true;

        // Add new walls
        if (nextRow > 0 && !grid[nextRow-1][nextCol].visited) 
          walls.push([nextRow, nextCol, 'north']);
        if (nextRow < rows-1 && !grid[nextRow+1][nextCol].visited) 
          walls.push([nextRow, nextCol, 'south']);
        if (nextCol > 0 && !grid[nextRow][nextCol-1].visited) 
          walls.push([nextRow, nextCol, 'west']);
        if (nextCol < columns-1 && !grid[nextRow][nextCol+1].visited) 
          walls.push([nextRow, nextCol, 'east']);
      }
    } else {
      walls.pop(); // Skip this wall
    }
  }

  return grid;
};
