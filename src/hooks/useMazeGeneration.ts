import { useCallback } from 'react';
import { Cell, MazeSettings, FrameType, MazeAlgorithm, Position } from '../utils/types';
import {
  binaryMaze,
  sidewinderMaze,
  recursiveBacktracker,
  primsAlgorithm,
  recursiveDivision,
  huntAndKill,
  ellerMaze,
  wilsonMaze,
  aldousBroderMaze,
  kruskalMaze
} from '../utils/mazeAlgorithms';
import { isPointInPolygon, getPolygonPoints } from '../utils/helpers/geometryHelpers';
import { getMazeDimensions, mazeToString } from '../utils/helpers/misc';
import { createEmptyGrid } from '../utils/mazeAlgorithms/utils';

// Maps algorithm names to their implementation functions
const algorithmMap = {
  'binary': binaryMaze,
  'sidewinder': sidewinderMaze,
  'recursive-backtracker': recursiveBacktracker,
  'prims': primsAlgorithm,
  'recursive-division': recursiveDivision,
  'hunt-and-kill': huntAndKill,
  'eller': ellerMaze,
  'wilson': wilsonMaze,
  'kruskal': kruskalMaze,
  'aldous-broder': aldousBroderMaze
} as const;

// Factory for creating empty cells
const createEmptyCell = (isValid: boolean = true): Cell => ({
  northWall: isValid,
  southWall: isValid,
  eastWall: isValid,
  westWall: isValid,
  visited: !isValid,
  isEntrance: false,
  isExit: false,
  isSolution: false
});


export const useMazeGeneration = (
  frameType: FrameType,
  algorithm: MazeAlgorithm,
  rows: number,
  columns: number,
  mazeSettings: MazeSettings,
  text: string,
  polygonSides: number,
  cellSize: number,
  letterDistance: number,
  letterSize: number,
  upperLetterConnector: boolean,
  lowerLetterConnector: boolean,
) => {

  const generateMaze = useCallback(() => {
    try {
      // Calculate dimensions based on frame type
      let effectiveRows = rows;
      let effectiveColumns = columns;
      if (frameType === 'circular') {
        effectiveRows = Math.max(2, Math.floor(rows / 2)) - 1;  // Subtract 1 to remove inner ring
        effectiveColumns = Math.max(4, columns);
      } else if (frameType === 'polygon') {
        effectiveRows = Math.max(2, Math.floor(rows / 2));
        effectiveColumns = Math.max(2, Math.floor(columns / polygonSides)) * polygonSides;
      } else if (frameType === 'text') {
        const dimensions = getMazeDimensions(letterSize, letterDistance, text)
        effectiveRows = dimensions.height
        effectiveColumns = dimensions.width
      }

      // Call the algorithm with the appropriate parameters based on its type
      let maze;
      if (algorithm === 'sidewinder') {
        maze = sidewinderMaze(
          effectiveRows,
          effectiveColumns,
          mazeSettings.horizontalBias,
          mazeSettings.branchingProbability,
        );
      } else if (algorithm === 'recursive-backtracker') {
        maze = recursiveBacktracker(
          effectiveRows,
          effectiveColumns,
          mazeSettings.branchingProbability,
          mazeSettings.deadEndDensity
        );
      } else if (algorithm === 'prims') {
        maze = primsAlgorithm(
          effectiveRows,
          effectiveColumns,
          mazeSettings.branchingProbability
        );
      } else if (algorithm === 'recursive-division') {
        maze = recursiveDivision(
          effectiveRows,
          effectiveColumns,
          mazeSettings.horizontalBias,
        );
      } else if (algorithm === 'hunt-and-kill') {
        maze = huntAndKill(
          effectiveRows,
          effectiveColumns,
          mazeSettings.branchingProbability,
          mazeSettings.deadEndDensity,
        );
      } else if (algorithm === 'eller') {
        maze = ellerMaze(
          effectiveRows,
          effectiveColumns,
          mazeSettings.horizontalBias,
          mazeSettings.branchingProbability,
          mazeSettings.deadEndDensity,
        );
      } else if (algorithm === 'wilson') {
        maze = wilsonMaze(
          effectiveRows,
          effectiveColumns
        );
      } else if (algorithm === 'kruskal') {
        maze = kruskalMaze(
          effectiveRows,
          effectiveColumns,
        );
      } else if (algorithm === 'aldous-broder') {
        maze = aldousBroderMaze(
          effectiveRows,
          effectiveColumns,
        );
      }
      else {
        maze = binaryMaze(
          effectiveRows,
          effectiveColumns,
          mazeSettings.horizontalBias
        );
      }

      // Apply frame-specific adjustments
      if (frameType === 'circular') {
        maze = adjustMazeToCircular(maze, rows, columns, cellSize, mazeSettings);
      } else if (frameType === 'polygon') {
        maze = adjustMazeToPolygon(maze, rows, columns, polygonSides, cellSize, mazeSettings);
        maze = addEntranceAndExit(maze, effectiveRows, effectiveColumns, frameType, mazeSettings);
      } else if (frameType === 'text') {
        maze = adjustMazeToText(maze, text, effectiveRows, effectiveColumns, cellSize, letterDistance, letterSize, upperLetterConnector, lowerLetterConnector);
        maze = ensureConnectivity(maze);
        return maze;
      }
      else {
        maze = addEntranceAndExit(maze, effectiveRows, effectiveColumns, frameType, mazeSettings);
      }

      
      if (mazeSettings.symmetry !== 'none') {
        maze = applySymmetry(maze, effectiveRows, effectiveColumns, mazeSettings.symmetry);
      }

      return maze;
    } catch (error) {
      console.error('Error generating maze:', error);
      return null;
    }
  }, [frameType, algorithm, rows, columns, mazeSettings, text, polygonSides, cellSize, letterDistance, letterSize, upperLetterConnector, lowerLetterConnector]);

  return { generateMaze };
};

// Generate the valid cells grid based on text
export const generateTextValidCells = (
  text: string,
  rows: number,
  columns: number,
  cellSize: number,
  letterDistance: number,
  letterSize: number,
  upperLetterConnector: boolean,
  lowerLetterConnector: boolean,
): boolean[][] => {
  // letterDistance = MAX_LETTER_DISTANCE - letterDistance - 4
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return Array(rows).fill([]).map(() => Array(columns).fill(false));

  canvas.width = columns * cellSize;
  canvas.height = rows * cellSize;

  // Clear canvas
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Setup text
  const fontSize = letterSize * cellSize * 1.1
  ctx.font = `900 ${fontSize}px "Sans Serif"`;
  ctx.fillStyle = 'black';
  ctx.textBaseline = 'middle';

  // Calculate text positioning
  const letterWidths = text.split('').map(l => ctx.measureText(l).width);
  const spacing = fontSize * (letterDistance / 25);
  const baseX = cellSize;

  // Draw text and connectors 
  let currentX = baseX;
  text.split('').forEach((letter, i) => {
    ctx.fillText(letter, currentX, canvas.height / 2);
    ctx.fillText(letter, currentX + 15, canvas.height / 2);

    if (i < text.length - 1) {
      const currentLetter = letter;
      const nextLetter = text[i + 1];
      if (upperLetterConnector) {
        const xOffset = ['A', 'D', 'O'].includes(currentLetter) ? 0.5 : 0.8;
        ctx.fillRect(
          currentX + letterWidths[i] * xOffset,
          canvas.height / 2 - fontSize * 0.43,
          letterWidths[i] / 1.3 + letterDistance * cellSize,
          fontSize * 0.12
        );
      }
      if (lowerLetterConnector) {
        const xOffset = ['D', 'O'].includes(currentLetter) ? 0.5 : 0.8;
        ctx.fillRect(
          currentX + letterWidths[i] * xOffset,
          canvas.height / 2 + fontSize * 0.17,
          letterWidths[i] / 1.3 + letterDistance * cellSize,
          fontSize * 0.12
        );
      }
    }

    currentX += letterWidths[i] + spacing;
  });

  // Convert to boolean grid
  const validCells = Array(rows).fill(null).map(() => Array(columns).fill(false));
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < columns; x++) {
      const pixelX = Math.floor(x * cellSize);
      const pixelY = Math.floor(y * cellSize);
      const index = (pixelY * canvas.width + pixelX) * 4;
      validCells[y][x] = imageData.data[index] < 128;
    }
  }

  return validCells;
};

// Find entrance and exit points for the text maze
export const findTextEntranceExit = (
  validCells: boolean[][],
  rows: number,
  columns: number
): { entrance: Position; exit: Position } => {
  let entrance: Position = { row: 0, col: 0 };
  let exit: Position = { row: 0, col: 0 };

  // Find leftmost valid cell in middle third
  for (let y = Math.floor(rows / 3); y < Math.floor(2 * rows / 3); y++) {
    for (let x = 0; x < columns; x++) {
      if (validCells[y][x]) {
        entrance = { row: y, col: x };
        break;
      }
    }
    if (entrance.col !== 0) break;
  }

  // Find rightmost valid cell in middle third
  for (let y = Math.floor(rows / 3); y < Math.floor(2 * rows / 3); y++) {
    for (let x = columns - 1; x >= 0; x--) {
      if (validCells[y][x]) {
        exit = { row: y, col: x };
        break;
      }
    }
    if (exit.col !== 0) break;
  }

  return { entrance, exit };
};

// Adjust a regular maze to fit the text shape
export const adjustMazeToText = (
  maze: Cell[][],
  text: string,
  rows: number,
  columns: number,
  cellSize: number,
  letterDistance: number,
  letterSize: number,
  upperLetterConnector: boolean,
  lowerLetterConnector: boolean,
): Cell[][] => {
  // Generate valid cells based on text
  const validCells = generateTextValidCells(text, rows, columns, cellSize, letterDistance, letterSize, upperLetterConnector, lowerLetterConnector);
  const { entrance, exit } = findTextEntranceExit(validCells, rows, columns);

  // Create new maze array
  const adjustedMaze: Cell[][] = Array(rows).fill(null).map(() =>
    Array(columns).fill(null).map(() => ({
      northWall: true,
      southWall: true,
      eastWall: true,
      westWall: true,
      visited: false
    }))
  );

  if (text === '') {
    return adjustedMaze
  }

  // Copy maze structure for valid cells and add boundary walls
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns; col++) {
      if (!validCells[row][col]) continue;

      // Copy the cell from the original maze
      adjustedMaze[row][col] = {
        ...maze[row][col],
      };
      adjustedMaze[row][col] = {
        // Add walls at text boundaries
        northWall: !validCells[row - 1][col] ? true : maze[row][col].northWall,
        southWall: !validCells[row + 1][col] ? true : maze[row][col].southWall,
        eastWall: !validCells[row][col + 1] ? true : maze[row][col].eastWall,
        westWall: !validCells[row][col - 1] ? true : maze[row][col].westWall,
        visited: true
      };


    }
  }

  // Set entrance and exit
  if (adjustedMaze[entrance.row][entrance.col]) {
    adjustedMaze[entrance.row][entrance.col].isEntrance = true;
    adjustedMaze[entrance.row][entrance.col].westWall = false;
  }
  if (adjustedMaze[exit.row][exit.col]) {
    adjustedMaze[exit.row][exit.col].isExit = true;
    adjustedMaze[exit.row][exit.col].eastWall = false;
  }

  return adjustedMaze;
};

const adjustMazeToCircular = (
  rectangularMaze: Cell[][],
  rows: number,
  columns: number,
  cellSize: number,
  settings: MazeSettings
): Cell[][] => {
  const rings = Math.max(2, Math.floor(rows / 2)) - 1;
  const sectors = Math.max(4, columns);

  // Create circular maze structure
  const circularMaze: Cell[][] = Array(rings).fill(null).map(() =>
    Array(sectors).fill(null).map(() => ({
      northWall: true,
      southWall: true,
      eastWall: true,
      westWall: true,
      visited: false,
      isEntrance: false,
      isExit: false,
      isSolution: false
    }))
  );

  // Map the rectangular maze to circular
  for (let ring = 0; ring < rings; ring++) {
    for (let sector = 0; sector < sectors; sector++) {
      const rectCell = rectangularMaze[ring][sector];
      const circCell = circularMaze[ring][sector];

      // Map the walls
      circCell.northWall = rectCell.northWall;
      circCell.southWall = rectCell.southWall;

      // Handle east/west walls normally for non-wraparound case
      if (sector < sectors - 1) {
        circCell.eastWall = rectCell.eastWall;
        circCell.westWall = rectCell.westWall;
      }

      // For innermost ring (ring 0), always have north wall
      if (ring === 0) {
        circCell.northWall = true;
      }
    }
  }

  // Handle wraparound connections
  for (let ring = 0; ring < rings; ring++) {
    const lastSector = sectors - 1;
    const circLastCell = circularMaze[ring][lastSector];
    const circFirstCell = circularMaze[ring][0];

    if (Math.random() > 0.5) {
      // Remove walls between first and last sectors
      circLastCell.eastWall = false;
      circFirstCell.westWall = false;
    }
  }

  // Add entrance and exit
  const entranceSector = Math.floor(sectors * 0.25);  // Place at 90 degrees
  const exitSector = Math.floor(sectors * 0.75);      // Place at 270 degrees

  circularMaze[rings - 1][entranceSector].isEntrance = true;
  circularMaze[rings - 1][entranceSector].southWall = false;
  circularMaze[rings - 1][exitSector].isExit = true;
  circularMaze[rings - 1][exitSector].southWall = false;

  return circularMaze;
};

const adjustMazeToPolygon = (
  rectangularMaze: Cell[][],
  rows: number,
  columns: number,
  sides: number,
  cellSize: number,
  settings: MazeSettings
): Cell[][] => {
  const rings = Math.max(2, Math.floor(rows / 2));
  const sectorsPerSide = Math.max(2, Math.floor(columns / sides));
  const totalSectors = sectorsPerSide * sides;

  // Create polygon maze structure
  const polygonMaze: Cell[][] = Array(rings).fill(null).map(() =>
    Array(totalSectors).fill(null).map(() => ({
      northWall: false,
      southWall: false,
      eastWall: false,
      westWall: false,
      visited: false,
      isEntrance: false,
      isExit: false,
      isSolution: false
    }))
  );

  // Map the rectangular maze to polygon structure
  for (let ring = 0; ring < rings; ring++) {
    for (let sector = 0; sector < totalSectors; sector++) {
      if (!rectangularMaze[ring] || !rectangularMaze[ring][sector]) continue;

      const rectCell = rectangularMaze[ring][sector];
      const polyCell = polygonMaze[ring][sector];

      // Calculate position within the polygon structure
      const currentSide = Math.floor(sector / sectorsPerSide);
      const positionInSide = sector % sectorsPerSide;

      // Copy most walls directly
      polyCell.northWall = rectCell.northWall;
      polyCell.southWall = rectCell.southWall;

      // Handle east/west walls with special vertex consideration
      if (positionInSide === sectorsPerSide - 1) {
        // We're at a vertex - use probability to decide if walls should exist
        const isVertexWall = Math.random() < settings.branchingProbability * 0.7;
        // If we create a passage at a vertex, ensure proper connection
        if (!isVertexWall && sector < totalSectors - 1) {
          polyCell.eastWall = false;
          polygonMaze[ring][(sector + 1) % totalSectors].westWall = false;
        }
      } else {
        // Normal cell within a side
        polyCell.eastWall = rectCell.eastWall;
        polyCell.westWall = rectCell.westWall;
      }

      // Special handling for innermost ring
      if (ring === 0) {
        // Allow some gaps in the center pentagon walls
        polyCell.northWall = Math.random() < 0.7; // 70% chance of wall
      }
    }
  }

  // Add entrance and exit on different sides
  const entranceSide = Math.floor(Math.random() * sides);
  let exitSide;
  do {
    exitSide = Math.floor(Math.random() * sides);
  } while (exitSide === entranceSide);

  const entranceCell = (entranceSide * sectorsPerSide) + Math.floor(sectorsPerSide / 2);
  const exitCell = (exitSide * sectorsPerSide) + Math.floor(sectorsPerSide / 2);

  polygonMaze[rings - 1][entranceCell].isEntrance = true;
  polygonMaze[rings - 1][entranceCell].southWall = false;
  polygonMaze[0][exitCell].isExit = true;
  polygonMaze[0][exitCell].northWall = false;

  return polygonMaze;
};

const getNeighbors = (pos: Position, maze: Cell[][]): Position[] => {
  const neighbors: Position[] = [];
  const { row, col } = pos;

  // Only check neighbors if the current cell is part of the text
  if (!maze[row][col].visited) return neighbors;

  // Check all four directions
  const directions = [
    { row: -1, col: 0, wall: 'northWall' },
    { row: 1, col: 0, wall: 'southWall' },
    { row: 0, col: 1, wall: 'eastWall' },
    { row: 0, col: -1, wall: 'westWall' }
  ] as const;

  for (const dir of directions) {
    const newRow = row + dir.row;
    const newCol = col + dir.col;

    if (newRow >= 0 && newRow < maze.length &&
      newCol >= 0 && newCol < maze[0].length &&
      maze[newRow][newCol].visited &&
      !maze[row][col][dir.wall]) {
      neighbors.push({ row: newRow, col: newCol });
    }
  }

  return neighbors;
};

const findConnectableCells = (from: Position, component: Set<string>, maze: Cell[][]): Position[] => {
  const MAX_DISTANCE = 3; // Allow connections within 3 cells
  const candidates: Position[] = [];

  for (let rowOffset = -MAX_DISTANCE; rowOffset <= MAX_DISTANCE; rowOffset++) {
    for (let colOffset = -MAX_DISTANCE; colOffset <= MAX_DISTANCE; colOffset++) {
      const newRow = from.row + rowOffset;
      const newCol = from.col + colOffset;

      // Skip if out of bounds or same cell
      if (newRow < 0 || newRow >= maze.length ||
        newCol < 0 || newCol >= maze[0].length ||
        (rowOffset === 0 && colOffset === 0)) {
        continue;
      }

      // Check if cell is in the other component and is part of the text
      const key = `${newRow},${newCol}`;
      if (component.has(key) && maze[newRow][newCol].visited) {
        candidates.push({ row: newRow, col: newCol });
      }
    }
  }

  return candidates;
};

const findComponents = (maze: Cell[][]): Set<string>[] => {
  const visited = new Set<string>();
  const components: Set<string>[] = [];

  // First find entrance component
  let entranceFound = false;
  for (let row = 0; row < maze.length && !entranceFound; row++) {
    for (let col = 0; col < maze[0].length; col++) {
      if (maze[row][col].isEntrance) {
        const component = new Set<string>();
        const stack = [{ row, col }];

        while (stack.length > 0) {
          const current = stack.pop()!;
          const key = `${current.row},${current.col}`;

          if (visited.has(key)) continue;
          visited.add(key);
          component.add(key);

          getNeighbors(current, maze).forEach(neighbor => {
            stack.push(neighbor);
          });
        }

        components.push(component);
        entranceFound = true;
        break;
      }
    }
  }

  // Then find remaining components
  for (let row = 0; row < maze.length; row++) {
    for (let col = 0; col < maze[0].length; col++) {
      if (!maze[row][col].visited || visited.has(`${row},${col}`)) continue;

      const component = new Set<string>();
      const stack = [{ row, col }];

      while (stack.length > 0) {
        const current = stack.pop()!;
        const key = `${current.row},${current.col}`;

        if (visited.has(key)) continue;
        visited.add(key);
        component.add(key);

        getNeighbors(current, maze).forEach(neighbor => {
          stack.push(neighbor);
        });
      }

      if (component.size > 0) {
        components.push(component);
      }
    }
  }

  return components;
};

const createPath = (from: Position, to: Position, maze: Cell[][]): void => {
  const path: Position[] = [];
  let current = from;

  // Create a path following either horizontal then vertical, or vertical then horizontal
  if (Math.random() < 0.5) {
    // Horizontal then vertical
    while (current.col !== to.col) {
      path.push(current);
      current = {
        row: current.row,
        col: current.col + (current.col < to.col ? 1 : -1)
      };
    }
    while (current.row !== to.row) {
      path.push(current);
      current = {
        row: current.row + (current.row < to.row ? 1 : -1),
        col: current.col
      };
    }
  } else {
    // Vertical then horizontal
    while (current.row !== to.row) {
      path.push(current);
      current = {
        row: current.row + (current.row < to.row ? 1 : -1),
        col: current.col
      };
    }
    while (current.col !== to.col) {
      path.push(current);
      current = {
        row: current.row,
        col: current.col + (current.col < to.col ? 1 : -1)
      };
    }
  }
  path.push(current);

  // Remove walls along the path
  for (let i = 0; i < path.length - 1; i++) {
    const curr = path[i];
    const next = path[i + 1];

    if (curr.row === next.row) {
      // Horizontal connection
      if (curr.col < next.col) {
        maze[curr.row][curr.col].eastWall = false;
        maze[next.row][next.col].westWall = false;
      } else {
        maze[curr.row][curr.col].westWall = false;
        maze[next.row][next.col].eastWall = false;
      }
    } else {
      // Vertical connection
      if (curr.row < next.row) {
        maze[curr.row][curr.col].southWall = false;
        maze[next.row][next.col].northWall = false;
      } else {
        maze[curr.row][curr.col].northWall = false;
        maze[next.row][next.col].southWall = false;
      }
    }
  }
};

const ensureConnectivity = (maze: Cell[][]): Cell[][] => {
  const components = findComponents(maze);

  if (components.length <= 1) return maze;

  // Start with the entrance component and connect others progressively
  for (let i = 0; i < components.length - 1; i++) {
    let bestConnection: { from: Position; to: Position } | null = null;
    let minDistance = Infinity;

    // Try to find the best connection between current component and any unconnected component
    for (const pos1 of components[i]) {
      const [row1, col1] = pos1.split(',').map(Number);

      // Look for connectable cells in other components
      for (let j = i + 1; j < components.length; j++) {
        const candidates = findConnectableCells({ row: row1, col: col1 }, components[j], maze);

        for (const candidate of candidates) {
          const distance = Math.abs(candidate.row - row1) + Math.abs(candidate.col - col1);
          if (distance < minDistance) {
            minDistance = distance;
            bestConnection = {
              from: { row: row1, col: col1 },
              to: candidate
            };
          }
        }
      }
    }

    // Create a path between the best connection found
    if (bestConnection) {
      createPath(bestConnection.from, bestConnection.to, maze);
    }
  }

  return maze;
};

const addEntranceAndExit = (maze: Cell[][], rows: number, columns: number, frameType: string, settings: MazeSettings): Cell[][] => {
  const newMaze = JSON.parse(JSON.stringify(maze));

  // Special handling for circular maze
  if (frameType === 'circular' || frameType == 'polygon') {
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
        return [0, 1 + Math.floor(Math.random() * (columns - 1))];
      case 'south':
        return [rows - 1, Math.floor(Math.random() * columns)];
      case 'east':
        return [1 + Math.floor(Math.random() * (rows - 2)), columns - 1];
      case 'west':
        return [1 + Math.floor(Math.random() * (rows - 2)), 0];
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
  [exitRow, exitCol] = getPosition(settings.exitPosition);

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

const applySymmetry = (maze: Cell[][], rows: number, columns: number, symmetry: string): Cell[][] => {
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


