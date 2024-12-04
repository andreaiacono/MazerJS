import { Cell, Position } from '../types';
import { removeWalls, getUnvisitedNeighbors, getVisitedNeighbors } from './utils'


export const recursiveBacktracker = (
  rows: number,
  columns: number,
  branchingProbability: number,
  deadEndDensity: number
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

  const stack: Position[] = [];
  const startPos: Position = { row: 0, col: 0 };
  maze[startPos.row][startPos.col].visited = true;
  stack.push(startPos);

  while (stack.length > 0) {
    const current = stack[stack.length - 1];
    const neighbors = getUnvisitedNeighbors(current, maze, rows, columns);

    if (neighbors.length > 0 && Math.random() < branchingProbability) {
      // Choose random unvisited neighbor
      const randomIndex = Math.floor(Math.random() * neighbors.length);
      const next = neighbors[randomIndex];

      // Remove walls between current and chosen cell
      removeWalls(current, next, maze);

      // Mark chosen cell as visited and push to stack
      maze[next.row][next.col].visited = true;
      stack.push(next);
    } else {
      if (Math.random() > deadEndDensity) {
        // Create additional connections to reduce dead ends
        const visitedNeighbors = getVisitedNeighbors(current, maze, rows, columns);
        if (visitedNeighbors.length > 1) {
          const randomVisited = visitedNeighbors[
            Math.floor(Math.random() * visitedNeighbors.length)
          ];
          removeWalls(current, randomVisited, maze);
        }
      }
      stack.pop();
    }
  }

  return maze;
};

