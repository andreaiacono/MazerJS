import { useCallback } from 'react';
import { Cell, MazeSettings, FrameType, MazeAlgorithm } from '../utils/types';
import {
  binaryMaze,
  sidewinderMaze,
  recursiveBacktracker,
  primsAlgorithm,
  recursiveDivision,
  huntAndKill
} from '../utils/mazeAlgorithms';
import { isPointInPolygon, getPolygonPoints } from '../utils/helpers/geometryHelpers';
import { getLetterPixels } from './../utils/helpers/drawing';

// Maps algorithm names to their implementation functions
const algorithmMap = {
  'binary': binaryMaze,
  'sidewinder': sidewinderMaze,
  'recursive-backtracker': recursiveBacktracker,
  'prims': primsAlgorithm,
  'recursive-division': recursiveDivision,
  'hunt-and-kill': huntAndKill
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

// Factory for creating maze grid
const createMazeGrid = (rows: number, columns: number, validCells?: boolean[][]): Cell[][] => {
  return Array(rows).fill(null).map((_, row) =>
    Array(columns).fill(null).map((_, col) =>
      createEmptyCell(validCells ? validCells[row][col] : true)
    )
  );
};

export const useMazeGeneration = (
  frameType: FrameType,
  algorithm: MazeAlgorithm,
  rows: number,
  columns: number,
  mazeSettings: MazeSettings,
  text: string,
  polygonSides: number,
  cellSize: number,
  setLetterCells: (cells: Set<string>) => void
) => {
  const generateValidCells = useCallback((frameType: FrameType): boolean[][] | null => {
    if (frameType !== 'polygon') return null;

    const mazeWidth = columns * cellSize;
    const mazeHeight = rows * cellSize;
    const centerX = mazeWidth / 2;
    const centerY = mazeHeight / 2;
    const radius = Math.min(mazeWidth, mazeHeight) / 2 * 0.8;
    const points = getPolygonPoints(polygonSides, radius, centerX, centerY);

    return Array(rows).fill(null).map((_, row) =>
      Array(columns).fill(null).map((_, col) => {
        const cellCenterX = (col + 0.5) * cellSize;
        const cellCenterY = (row + 0.5) * cellSize;
        return isPointInPolygon(cellCenterX, cellCenterY, points);
      })
    );
  }, [rows, columns, cellSize, polygonSides]);

  const generateTextMaze = useCallback(() => {
    if (!text) return null;

    const textDimensions = {
      width: 50 * Math.max(text.length, 1),
      height: rows
    };

    const directions = {
      north: [0, -1],
      south: [0, 1],
      east: [1, 0],
      west: [-1, 0]
    }
    type Direction = 'north' | 'south' | 'east' | 'west';
    const maze = createMazeGrid(rows, textDimensions.width);
    const pixels = getLetterPixels(text, textDimensions);

    // Process text cells
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < textDimensions.width; col++) {
        const isTextCell = pixels.has(`${col},${row}`);
        maze[row][col].visited = !isTextCell;

        if (isTextCell) {
          (['north', 'south', 'east', 'west'] as const).forEach((direction: Direction) => {
            const [dx, dy] = directions[direction];
            if (pixels.has(`${col + dx},${row + dy}`)) {
              maze[row][col][`${direction}Wall`] = false;
            }
          });
        }
      }
    }

    // Add entrance and exit
    const findEntryPoint = (side: 'start' | 'end'): number => {
      const col = side === 'start' ? 0 : textDimensions.width - 1;
      for (let offset = 0; offset < Math.floor(rows / 2); offset++) {
        for (const y of [Math.floor(rows / 2) + offset, Math.floor(rows / 2) - offset]) {
          if (y >= 0 && y < rows && pixels.has(`${col},${y}`)) {
            return y;
          }
        }
      }
      return Math.floor(rows / 2);
    };

    const entranceY = findEntryPoint('start');
    const exitY = findEntryPoint('end');

    maze[entranceY][0].isEntrance = true;
    maze[entranceY][0].westWall = false;
    maze[exitY][textDimensions.width - 1].isExit = true;
    maze[exitY][textDimensions.width - 1].eastWall = false;

    return maze;
  }, [text, rows]);

  const generateMaze = useCallback(() => {
    if (frameType === 'text') {
      return generateTextMaze();
    }

    try {
      const validCells = generateValidCells(frameType);

      // Calculate dimensions based on frame type
      let effectiveRows = rows;
      let effectiveColumns = columns;
      if (frameType === 'circular') {
        effectiveRows = Math.max(2, Math.floor(rows / 2)) - 1;  // Subtract 1 to remove inner ring
        effectiveColumns = Math.max(4, columns);
      } else if (frameType === 'polygon') {
        effectiveRows = Math.max(2, Math.floor(rows / 2));
        effectiveColumns = Math.max(2, Math.floor(columns / polygonSides)) * polygonSides;
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
      } else if (validCells) {
        // For rectangular mazes, apply the valid cells mask if needed
        maze = maze.map((row, i) =>
          row.map((cell, j) =>
            validCells[i][j] ? cell : createEmptyCell(false)
          )
        );
      }

      // Apply additional transformations
      if (mazeSettings.symmetry !== 'none') {
        maze = applySymmetry(maze, effectiveRows, effectiveColumns, mazeSettings.symmetry);
      }

      if (frameType !== 'circular') {
        maze = addEntranceAndExit(maze, effectiveRows, effectiveColumns, frameType, mazeSettings);
      }

      return maze;
    } catch (error) {
      console.error('Error generating maze:', error);
      return null;
    }
  }, [frameType, algorithm, rows, columns, mazeSettings, text, polygonSides, cellSize]);

  return { generateMaze };
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


