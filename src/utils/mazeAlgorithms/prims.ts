import { Cell, Position } from '../types';
import { removeWalls, getVisitedNeighbors } from './utils'

export const primsAlgorithm = (
  rows: number,
  columns: number,
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

  const frontier: Position[] = [];
  const startPos: Position = { row: 0, col: 0 };
  maze[startPos.row][startPos.col].visited = true;

  // Add initial cell's neighbors to frontier
  addNeighborsToFrontier(startPos, maze, rows, columns, frontier);

  while (frontier.length > 0 && Math.random() < branchingProbability) {
    // Choose random frontier cell
    const randomIndex = Math.floor(Math.random() * frontier.length);
    const current = frontier[randomIndex];
    frontier.splice(randomIndex, 1);

    // Get visited neighbors
    const visitedNeighbors = getVisitedNeighbors(current, maze, rows, columns);
    
    if (visitedNeighbors.length > 0) {
      // Connect to a random visited neighbor
      const randomNeighbor = visitedNeighbors[
        Math.floor(Math.random() * visitedNeighbors.length)
      ];
      removeWalls(current, randomNeighbor, maze);

      // Mark current as visited and add its unvisited neighbors to frontier
      maze[current.row][current.col].visited = true;
      addNeighborsToFrontier(current, maze, rows, columns, frontier);
    }
  }

  return maze;
};

const addNeighborsToFrontier = (
  pos: Position,
  maze: Cell[][],
  rows: number,
  columns: number,
  frontier: Position[]
) => {
  const directions = [
    { row: -1, col: 0 }, // North
    { row: 1, col: 0 },  // South
    { row: 0, col: 1 },  // East
    { row: 0, col: -1 }  // West
  ];

  directions.forEach(({ row: dx, col: dy }) => {
    const newRow = pos.row + dx;
    const newCol = pos.col + dy;

    if (
      newRow >= 0 && newRow < rows &&
      newCol >= 0 && newCol < columns &&
      !maze[newRow][newCol].visited &&
      !frontier.some(p => p.row === newRow && p.col === newCol)
    ) {
      frontier.push({ row: newRow, col: newCol });
    }
  });
};

// Reuse getVisitedNeighbors and removeWalls from recursiveBacktracker