import { Cell, Position } from '../types';

export const huntAndKill = (
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

  let current: Position | null = { row: 0, col: 0 };
  maze[0][0].visited = true;

  while (current !== null) {
    const unvisitedNeighbors = getUnvisitedNeighbors(current, maze, rows, columns);

    if (unvisitedNeighbors.length > 0 && Math.random() < branchingProbability) {
      // Choose random unvisited neighbor
      const next = unvisitedNeighbors[
        Math.floor(Math.random() * unvisitedNeighbors.length)
      ];

      // Remove walls between current and chosen cell
      removeWalls(current, next, maze);

      // Mark chosen cell as visited and move to it
      maze[next.row][next.col].visited = true;
      current = next;

      // Occasionally create loops to reduce dead ends
      if (Math.random() > deadEndDensity) {
        const visitedNeighbors = getVisitedNeighbors(current, maze, rows, columns);
        if (visitedNeighbors.length > 1) {
          const randomVisited = visitedNeighbors[
            Math.floor(Math.random() * visitedNeighbors.length)
          ];
          removeWalls(current, randomVisited, maze);
        }
      }
    } else {
      // Hunt for a new starting point
      current = hunt(maze, rows, columns);
    }
  }

  return maze;
};

const hunt = (
  maze: Cell[][],
  rows: number,
  columns: number
): Position | null => {
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns; col++) {
      if (!maze[row][col].visited) {
        const visitedNeighbors = getVisitedNeighbors(
          { row, col },
          maze,
          rows,
          columns
        );

        if (visitedNeighbors.length > 0) {
          const randomVisited = visitedNeighbors[
            Math.floor(Math.random() * visitedNeighbors.length)
          ];
          
          removeWalls({ row, col }, randomVisited, maze);
          maze[row][col].visited = true;
          return { row, col };
        }
      }
    }
  }
  return null;
};

// Reuse helper functions from recursiveBacktracker
const getUnvisitedNeighbors = (
  pos: Position,
  maze: Cell[][],
  rows: number,
  columns: number
): Position[] => {
  const neighbors: Position[] = [];
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
      !maze[newRow][newCol].visited
    ) {
      neighbors.push({ row: newRow, col: newCol });
    }
  });

  return neighbors;
};

const getVisitedNeighbors = (
  pos: Position,
  maze: Cell[][],
  rows: number,
  columns: number
): Position[] => {
  const neighbors: Position[] = [];
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
      maze[newRow][newCol].visited
    ) {
      neighbors.push({ row: newRow, col: newCol });
    }
  });

  return neighbors;
};

const removeWalls = (current: Position, next: Position, maze: Cell[][]) => {
  const rowDiff = next.row - current.row;
  const colDiff = next.col - current.col;

  if (rowDiff === -1) { // Next is north
    maze[current.row][current.col].northWall = false;
    maze[next.row][next.col].southWall = false;
  } else if (rowDiff === 1) { // Next is south
    maze[current.row][current.col].southWall = false;
    maze[next.row][next.col].northWall = false;
  } else if (colDiff === 1) { // Next is east
    maze[current.row][current.col].eastWall = false;
    maze[next.row][next.col].westWall = false;
  } else if (colDiff === -1) { // Next is west
    maze[current.row][current.col].westWall = false;
    maze[next.row][next.col].eastWall = false;
  }
};