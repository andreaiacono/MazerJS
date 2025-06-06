import { Cell, Position, MazeSettings } from '../types';

export const createEmptyGrid = (rows: number, columns: number, createWalls: boolean = true): Cell[][] => {
  return Array(rows).fill(null).map(() => 
    Array(columns).fill(null).map(() => ({
      northWall: createWalls,
      southWall: createWalls,
      eastWall: createWalls,
      westWall: createWalls,
      visited: false,
      isEntrance: false, 
      isExit: false,
      isSolution: false
    }))
  );
};

export const getRandomElement = <T>(array: T[]): T => {
  return array[Math.floor(Math.random() * array.length)];
};

export const getRandomWithBias = (bias: number): boolean => {
  return Math.random() < bias;
};

export const getUnvisitedNeighbors = (
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

export const getVisitedNeighbors = (
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

export const removeWalls = (current: Position, next: Position, maze: Cell[][]) => {
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

export const applySymmetry = (maze: Cell[][], rows: number, columns: number, symmetry: string): Cell[][] => {
  const newMaze = JSON.parse(JSON.stringify(maze));

  if (symmetry === 'horizontal' || symmetry === 'both') {
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < Math.floor(columns / 2); col++) {
        const mirrorCol = columns - 1 - col;
        newMaze[row][mirrorCol] = {
          ...newMaze[row][col],
          eastWall: newMaze[row][col].westWall,
          westWall: newMaze[row][col].eastWall,
        };
      }
    }
  }

  if (symmetry === 'vertical' || symmetry === 'both') {
    for (let row = 0; row < Math.floor(rows / 2); row++) {
      for (let col = 0; col < columns; col++) {
        const mirrorRow = rows - 1 - row;
        newMaze[mirrorRow][col] = {
          ...newMaze[row][col],
          northWall: newMaze[row][col].southWall,
          southWall: newMaze[row][col].northWall,
        };
      }
    }
  }

  return newMaze;
};
