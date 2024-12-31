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

export const addEntranceAndExit = (maze: Cell[][], rows: number, columns: number, settings: MazeSettings, frameType: string): Cell[][] => {
  const newMaze = JSON.parse(JSON.stringify(maze));

  // Special handling for circular maze
  if (frameType === 'circular') {
    const rings = Math.floor(rows / 2);
    const sectors = columns;

    // For circular maze, add entrance at outer ring and exit at inner ring
    if (maze[0] && maze[0][0]) {  // Outer ring, first sector
      newMaze[0][0].isEntrance = true;
      newMaze[0][0].northWall = false;  // Remove outer wall for entrance
    }

    const exitSector = Math.floor(sectors / 2);
    if (maze[rings - 1] && maze[rings - 1][exitSector]) {  // Inner ring, opposite side
      newMaze[rings - 1][exitSector].isExit = true;
      newMaze[rings - 1][exitSector].southWall = false;  // Remove inner wall for exit
    }

    return newMaze;
  }

  // Original rectangular maze handling
  const getPosition = (position: 'north' | 'south' | 'east' | 'west' | 'random'): [number, number] => {
    switch (position) {
      case 'north':
        return [0, Math.floor(Math.random() * columns)];
      case 'south':
        return [rows - 1, Math.floor(Math.random() * columns)];
      case 'east':
        return [Math.floor(Math.random() * rows), columns - 1];
      case 'west':
        return [Math.floor(Math.random() * rows), 0];
      case 'random':
        const edge = ['north', 'south', 'east', 'west'][Math.floor(Math.random() * 4)];
        return getPosition(edge as 'north');
      default:
        return [0, 0];
    }
  };

  // Add entrance
  const [entranceRow, entranceCol] = getPosition(settings.entrancePosition);
  if (entranceRow === 0) {
    newMaze[entranceRow][entranceCol].northWall = false;
  } else if (entranceRow === rows - 1) {
    newMaze[entranceRow][entranceCol].southWall = false;
  } else if (entranceCol === 0) {
    newMaze[entranceRow][entranceCol].westWall = false;
  } else {
    newMaze[entranceRow][entranceCol].eastWall = false;
  }
  newMaze[entranceRow][entranceCol].isEntrance = true;

  // Add exit
  let exitRow: number, exitCol: number;
  if (settings.exitPosition === 'farthest') {
    // Find the cell farthest from entrance using simple distance
    let maxDistance = 0;
    let farthestCell: [number, number] = [0, 0];

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < columns; col++) {
        const distance = Math.abs(row - entranceRow) + Math.abs(col - entranceCol);
        if (distance > maxDistance) {
          maxDistance = distance;
          farthestCell = [row, col];
        }
      }
    }
    [exitRow, exitCol] = farthestCell;
  } else {
    [exitRow, exitCol] = getPosition(settings.exitPosition);
  }

  if (exitRow === 0) {
    newMaze[exitRow][exitCol].northWall = false;
  } else if (exitRow === rows - 1) {
    newMaze[exitRow][exitCol].southWall = false;
  } else if (exitCol === 0) {
    newMaze[exitRow][exitCol].westWall = false;
  } else {
    newMaze[exitRow][exitCol].eastWall = false;
  }
  newMaze[exitRow][exitCol].isExit = true;

  return newMaze;
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
