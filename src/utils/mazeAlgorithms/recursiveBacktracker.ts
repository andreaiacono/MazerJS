import { Cell, Position } from '../types';
import { removeWalls, getUnvisitedNeighbors, getVisitedNeighbors, createEmptyGrid, getRandomWithBias } from './utils'


export const recursiveBacktracker = (
  rows: number,
  columns: number,
  branchingProbability: number,
  deadEndDensity: number
): Cell[][] => {

  branchingProbability /= 100
  deadEndDensity /= 100
  
  const grid = createEmptyGrid(rows, columns);
  const stack: [number, number][] = [];
  
  // Start from random cell
  let current: [number, number] = [
    Math.floor(Math.random() * rows),
    Math.floor(Math.random() * columns)
  ];
  grid[current[0]][current[1]].visited = true;
  stack.push(current);

  while (stack.length > 0) {
    const [row, col] = current;
    
    // Get unvisited neighbors
    let neighbors: [number, number, string][] = [];
    if (row > 0 && !grid[row-1][col].visited) 
      neighbors.push([row-1, col, 'north']);
    if (row < rows-1 && !grid[row+1][col].visited) 
      neighbors.push([row+1, col, 'south']);
    if (col > 0 && !grid[row][col-1].visited) 
      neighbors.push([row, col-1, 'west']);
    if (col < columns-1 && !grid[row][col+1].visited) 
      neighbors.push([row, col+1, 'east']);

    // Use branchingProbability to potentially reduce available directions
    neighbors = neighbors.filter(() => getRandomWithBias(branchingProbability));

    if (neighbors.length > 0) {
      const [nextRow, nextCol, direction] = neighbors[
        Math.floor(Math.random() * neighbors.length)
      ];
      
      // Remove walls
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
      stack.push([nextRow, nextCol]);
      current = [nextRow, nextCol];
    } else {
      current = stack.pop()!;
    }
  }

  // Apply dead end density by potentially reopening some dead ends
  if (deadEndDensity < 1) {
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < columns; col++) {
        const isDeadEnd = 
          (grid[row][col].northWall ? 1 : 0) +
          (grid[row][col].southWall ? 1 : 0) +
          (grid[row][col].eastWall ? 1 : 0) +
          (grid[row][col].westWall ? 1 : 0) === 3;

        if (isDeadEnd && !getRandomWithBias(deadEndDensity)) {
          // Remove a random wall to reduce dead ends
          const walls = [];
          if (row > 0 && grid[row][col].northWall) walls.push('north');
          if (row < rows-1 && grid[row][col].southWall) walls.push('south');
          if (col > 0 && grid[row][col].westWall) walls.push('west');
          if (col < columns-1 && grid[row][col].eastWall) walls.push('east');

          const wallToRemove = walls[Math.floor(Math.random() * walls.length)];
          if (wallToRemove === 'north') {
            grid[row][col].northWall = false;
            grid[row-1][col].southWall = false;
          } else if (wallToRemove === 'south') {
            grid[row][col].southWall = false;
            grid[row+1][col].northWall = false;
          } else if (wallToRemove === 'west') {
            grid[row][col].westWall = false;
            grid[row][col-1].eastWall = false;
          } else {
            grid[row][col].eastWall = false;
            grid[row][col+1].westWall = false;
          }
        }
      }
    }
  }

  return grid;
};