import { useCallback } from 'react';
import { Cell, MazeSettings, Position, FrameType, MazeAlgorithm } from '../utils/types';
import {
  binaryMaze,
  sidewinderMaze,
  recursiveBacktracker,
  primsAlgorithm,
  recursiveDivision,
  huntAndKill
} from '../utils/mazeAlgorithms';
import { isPointInPolygon, getPolygonPoints, distanceToLineSegment } from '../utils/helpers/geometryHelpers';
import { manhattanDistance } from '../utils/helpers/pathfinding';
import { getLetterPixels } from './../utils/helpers/drawing'

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

  const generateMaze = useCallback(() => {
    if (frameType === 'text') {
      return generateTextMaze();
    }

    try {
      let validCells: boolean[][] | null = null;
      if (frameType === 'polygon') {
        const mazeWidth = columns * cellSize;
        const mazeHeight = rows * cellSize;
        const centerX = mazeWidth / 2;
        const centerY = mazeHeight / 2;
        const radius = Math.min(mazeWidth, mazeHeight) / 2 * 0.8;
        const points = getPolygonPoints(polygonSides, radius, centerX, centerY);

        validCells = Array(rows).fill(null).map(() => Array(columns).fill(false));

        for (let row = 0; row < rows; row++) {
          for (let col = 0; col < columns; col++) {
            const cellCenterX = (col + 0.5) * cellSize;
            const cellCenterY = (row + 0.5) * cellSize;
            validCells[row][col] = isPointInPolygon(cellCenterX, cellCenterY, points);
          }
        }
      }

      let newMaze: Cell[][] = [];
      for (let row = 0; row < rows; row++) {
        newMaze[row] = [];
        for (let col = 0; col < columns; col++) {
          if (frameType === 'polygon' && validCells && !validCells[row][col]) {
            newMaze[row][col] = {
              northWall: false,
              southWall: false,
              eastWall: false,
              westWall: false,
              visited: true,
              isEntrance: false,
              isExit: false,
              isSolution: false
            };
          } else {
            newMaze[row][col] = {
              northWall: true,
              southWall: true,
              eastWall: true,
              westWall: true,
              visited: false,
              isEntrance: false,
              isExit: false,
              isSolution: false
            };
          }
        }
      }

      const settings = {
        horizontalBias: mazeSettings.horizontalBias,
        branchingProbability: mazeSettings.branchingProbability,
        deadEndDensity: mazeSettings.deadEndDensity
      };

      const generateWithValidCells = (
        algorithm: (rows: number, columns: number, ...args: any[]) => Cell[][],
        ...args: any[]
      ) => {
        const modifiedAlgorithm = (maze: Cell[][], validCells: boolean[][] | null) => {
          const isValidCell = (row: number, col: number) => {
            if (!validCells) return true;
            return validCells[row][col];
          };

          let result = algorithm(rows, columns, ...args);

          for (let row = 0; row < rows; row++) {
            for (let col = 0; col < columns; col++) {
              if (!isValidCell(row, col)) {
                result[row][col] = {
                  northWall: false,
                  southWall: false,
                  eastWall: false,
                  westWall: false,
                  visited: true,
                  isEntrance: false,
                  isExit: false,
                  isSolution: false
                };
              }
            }
          }

          return result;
        };

        return modifiedAlgorithm(newMaze, validCells);
      };

      switch (algorithm) {
        case 'binary':
          newMaze = generateWithValidCells(binaryMaze, settings.horizontalBias);
          break;
        case 'sidewinder':
          newMaze = generateWithValidCells(
            sidewinderMaze,
            settings.horizontalBias,
            settings.branchingProbability
          );
          break;
        case 'recursive-backtracker':
          newMaze = generateWithValidCells(
            recursiveBacktracker,
            settings.branchingProbability,
            settings.deadEndDensity
          );
          break;
        case 'prims':
          newMaze = generateWithValidCells(
            primsAlgorithm,
            settings.branchingProbability
          );
          break;
        case 'recursive-division':
          newMaze = generateWithValidCells(
            recursiveDivision,
            settings.horizontalBias
          );
          break;
        case 'hunt-and-kill':
          newMaze = generateWithValidCells(
            huntAndKill,
            settings.branchingProbability,
            settings.deadEndDensity
          );
          break;
        default:
          newMaze = generateWithValidCells(binaryMaze, 0.5);
      }

      if (frameType === 'circular') {
        newMaze = adjustCellsToCircular(newMaze, rows, columns, cellSize, mazeSettings);
      } else if (frameType === 'polygon') {
        newMaze = adjustCellsToPolygon(newMaze, rows, columns, polygonSides, cellSize, mazeSettings);
      }

      if (mazeSettings.symmetry !== 'none') {
        newMaze = applySymmetry(newMaze, rows, columns, mazeSettings.symmetry);
      }

      if (frameType !== 'circular') {
        newMaze = addEntranceAndExit(newMaze, rows, columns, mazeSettings);
      }

      if (newMaze && newMaze.length > 0) {
        return newMaze;
      }
      return null;
    }
    catch (error) {
      console.error('Error generating maze:', error);
      return null;
    }
  }, [frameType, algorithm, rows, columns, mazeSettings, text, polygonSides, cellSize]);

  const generateTextMaze = useCallback(() => {
    if (!text) return null;
  
    // Calculate dimensions based on text length
    const textDimensions = {
      width: 50 * Math.max(text.length, 1),
      height: rows
    };
  
    // Initialize empty maze array
    const newMaze: Cell[][] = Array(rows)
      .fill(null)
      .map(() => Array(textDimensions.width)
        .fill(null)
        .map(() => ({
          northWall: true,
          southWall: true,
          eastWall: true,
          westWall: true,
          visited: false,
          isEntrance: false,
          isExit: false,
          isSolution: false,
          circularWall: false,
          radialWall: false
        }))
      );
  
    // Get pixels for the text
    const pixels = getLetterPixels(text, textDimensions);
  
    // Process each cell
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < textDimensions.width; col++) {
        const isTextCell = pixels.has(`${col},${row}`);
        newMaze[row][col].visited = !isTextCell;
  
        if (isTextCell) {
          if (pixels.has(`${col},${row - 1}`)) newMaze[row][col].northWall = false;
          if (pixels.has(`${col},${row + 1}`)) newMaze[row][col].southWall = false;
          if (pixels.has(`${col - 1},${row}`)) newMaze[row][col].westWall = false;
          if (pixels.has(`${col + 1},${row}`)) newMaze[row][col].eastWall = false;
        }
      }
    }
  
    let entranceY = Math.floor(rows / 2);
    let exitY = Math.floor(rows / 2);
    let entranceFound = false;
    let exitFound = false;
  
    for (let offset = 0; offset < Math.floor(rows / 2); offset++) {
      const checkPositions = [
        Math.floor(rows / 2) + offset,
        Math.floor(rows / 2) - offset
      ];
  
      for (const y of checkPositions) {
        if (y >= 0 && y < rows) {
          if (!entranceFound && pixels.has(`0,${y}`)) {
            entranceY = y;
            entranceFound = true;
          }
          if (!exitFound && pixels.has(`${textDimensions.width - 1},${y}`)) {
            exitY = y;
            exitFound = true;
          }
        }
      }
  
      if (entranceFound && exitFound) break;
    }
  
    if (entranceFound) {
      newMaze[entranceY][0].isEntrance = true;
      newMaze[entranceY][0].westWall = false;
    }
    if (exitFound) {
      newMaze[exitY][textDimensions.width - 1].isExit = true;
      newMaze[exitY][textDimensions.width - 1].eastWall = false;
    }
  
    return newMaze;
  }, [text, rows]);
  
  const adjustCellsToPolygon = (
    maze: Cell[][],
    rows: number,
    columns: number,
    sides: number,
    cellSize: number,
    settings: MazeSettings
  ): Cell[][] => {
    // Initialize new maze
    const newMaze = Array(rows).fill(null).map(() =>
      Array(columns).fill(null).map(() => ({
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
  
    // Calculate polygon parameters
    const mazeWidth = columns * cellSize;
    const mazeHeight = rows * cellSize;
    const centerX = mazeWidth / 2;
    const centerY = mazeHeight / 2;
    const radius = Math.min(mazeWidth, mazeHeight) / 2 * 0.8;
    const points = getPolygonPoints(sides, radius, centerX, centerY);
  
    // First, identify valid cells (inside polygon)
    const validCells: boolean[][] = Array(rows).fill(null)
      .map(() => Array(columns).fill(false));
  
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < columns; col++) {
        const cellCenterX = (col + 0.5) * cellSize;
        const cellCenterY = (row + 0.5) * cellSize;
        validCells[row][col] = isPointInPolygon(cellCenterX, cellCenterY, points);
      }
    }
  
    // Copy valid cells from original maze
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < columns; col++) {
        if (validCells[row][col] && maze[row]?.[col]) {
          newMaze[row][col] = { ...maze[row][col] };
        } else {
          // Mark cells outside polygon as invalid
          newMaze[row][col].visited = true;
        }
      }
    }
  
    // Find entrance and exit positions
    const entranceCell = findEntrancePosition(validCells, points, settings.entrancePosition);
    let exitCell = findExitPosition(validCells, points, settings.exitPosition, entranceCell);
  
    // Set entrance and exit
    if (entranceCell) {
      const [entranceRow, entranceCol] = entranceCell;
      newMaze[entranceRow][entranceCol].isEntrance = true;
      // Remove appropriate wall based on nearest edge
      const nearestSide = findNearestPolygonSide(
        (entranceCol + 0.5) * cellSize,
        (entranceRow + 0.5) * cellSize,
        points
      );
      removeWallForSide(newMaze[entranceRow][entranceCol], nearestSide);
    }
  
    if (exitCell) {
      const [exitRow, exitCol] = exitCell;
      newMaze[exitRow][exitCol].isExit = true;
      // Remove appropriate wall based on nearest edge
      const nearestSide = findNearestPolygonSide(
        (exitCol + 0.5) * cellSize,
        (exitRow + 0.5) * cellSize,
        points
      );
      removeWallForSide(newMaze[exitRow][exitCol], nearestSide);
    }
  
    // Verify path exists between entrance and exit
    if (entranceCell && exitCell) {
      const pathExists = verifyPath(
        newMaze,
        { row: entranceCell[0], col: entranceCell[1] },
        { row: exitCell[0], col: exitCell[1] },
        validCells
      );
  
      if (!pathExists) {
        // If no path exists, create one
        createPath(
          newMaze,
          { row: entranceCell[0], col: entranceCell[1] },
          { row: exitCell[0], col: exitCell[1] },
          validCells
        );
      }
    }
  
    return newMaze;
  };
  
  const adjustCellsToCircular = (
    maze: Cell[][],
    rows: number,
    columns: number,
    cellSize: number,
    settings: MazeSettings
  ): Cell[][] => {
    // Calculate dimensions but skip innermost ring
    const rings = Math.max(2, Math.floor(rows / 2)) - 1;  // Subtract 1 to remove inner ring
    const sectors = Math.max(4, columns);
  
    // First, generate a rectangular maze using the existing algorithm but with one less ring
    let rectangularMaze: Cell[][] = [];
  
    switch (algorithm) {
      case 'binary':
        rectangularMaze = binaryMaze(rings, sectors, settings.horizontalBias);
        break;
      case 'sidewinder':
        rectangularMaze = sidewinderMaze(rings, sectors, settings.horizontalBias, settings.branchingProbability);
        break;
      case 'recursive-backtracker':
        rectangularMaze = recursiveBacktracker(rings, sectors, settings.branchingProbability, settings.deadEndDensity);
        break;
      case 'prims':
        rectangularMaze = primsAlgorithm(rings, sectors, settings.branchingProbability);
        break;
      case 'recursive-division':
        rectangularMaze = recursiveDivision(rings, sectors, settings.horizontalBias);
        break;
      case 'hunt-and-kill':
        rectangularMaze = huntAndKill(rings, sectors, settings.branchingProbability, settings.deadEndDensity);
        break;
      default:
        rectangularMaze = binaryMaze(rings, sectors, 0.5);
    }
  
    // Create circular maze with same dimensions
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
        circCell.eastWall = rectCell.eastWall;
        circCell.westWall = rectCell.westWall;
  
        // Handle sector wraparound
        if (sector === sectors - 1) {
          // Last sector connects to first sector
          circCell.eastWall = rectCell.eastWall;
          circularMaze[ring][0].westWall = rectCell.eastWall;
        }
  
        // For innermost ring (ring 0), always have north wall
        if (ring === 0) {
          circCell.northWall = true;
        }
      }
    }
  
    // Add entrance and exit
    const entranceSector = Math.floor(sectors * 0.25);  // Place at 90 degrees
    const exitSector = Math.floor(sectors * 0.75);      // Place at 270 degrees
  
    // Set entrance
    circularMaze[rings - 1][entranceSector].isEntrance = true;
    circularMaze[rings - 1][entranceSector].southWall = false;
  
    // Set exit
    circularMaze[rings - 1][exitSector].isExit = true;
    circularMaze[rings - 1][exitSector].southWall = false;

    return circularMaze;
  };
  
  const addEntranceAndExit = (maze: Cell[][], rows: number, columns: number, settings: MazeSettings): Cell[][] => {
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
  
  const verifyPath = (
    maze: Cell[][],
    start: Position,
    end: Position,
    validCells: boolean[][]
  ): boolean => {
    const visited = new Set<string>();
    const queue: Position[] = [start];
    visited.add(`${start.row},${start.col}`);

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current.row === end.row && current.col === end.col) {
        return true;
      }

      const neighbors = getValidNeighbors(current, maze, validCells);
      for (const neighbor of neighbors) {
        const key = `${neighbor.row},${neighbor.col}`;
        if (!visited.has(key)) {
          visited.add(key);
          queue.push(neighbor);
        }
      }
    }

    return false;
  };

  const findShortestPath = (
    maze: Cell[][],
    start: Position,
    end: Position,
    validCells: boolean[][]
  ): Position[] | null => {
    const openSet = new Set<string>([`${start.row},${start.col}`]);
    const cameFrom = new Map<string, Position>();

    const gScore = new Map<string, number>();
    gScore.set(`${start.row},${start.col}`, 0);

    const fScore = new Map<string, number>();
    fScore.set(`${start.row},${start.col}`, manhattanDistance(start, end));

    while (openSet.size > 0) {
      let current = getLowestFScore(openSet, fScore);
      if (current.row === end.row && current.col === end.col) {
        return reconstructPath(cameFrom, current);
      }

      openSet.delete(`${current.row},${current.col}`);
      const neighbors = getValidNeighbors(current, maze, validCells);

      for (const neighbor of neighbors) {
        const tentativeGScore = gScore.get(`${current.row},${current.col}`)! + 1;

        if (!gScore.has(`${neighbor.row},${neighbor.col}`) ||
          tentativeGScore < gScore.get(`${neighbor.row},${neighbor.col}`)!) {
          cameFrom.set(`${neighbor.row},${neighbor.col}`, current);
          gScore.set(`${neighbor.row},${neighbor.col}`, tentativeGScore);
          fScore.set(`${neighbor.row},${neighbor.col}`,
            tentativeGScore + manhattanDistance(neighbor, end));
          openSet.add(`${neighbor.row},${neighbor.col}`);
        }
      }
    }

    return null;
  };

  const reconstructPath = (cameFrom: Map<string, Position>, current: Position): Position[] => {
    const path = [current];
    let currentKey = `${current.row},${current.col}`;

    while (cameFrom.has(currentKey)) {
      current = cameFrom.get(currentKey)!;
      path.unshift(current);
      currentKey = `${current.row},${current.col}`;
    }

    return path;
  };

  const getValidNeighbors = (
    pos: Position,
    maze: Cell[][],
    validCells: boolean[][]
  ): Position[] => {
    const neighbors: Position[] = [];
    const cell = maze[pos.row][pos.col];

    // Check each direction
    if (!cell.northWall && pos.row > 0 && validCells[pos.row - 1][pos.col]) {
      neighbors.push({ row: pos.row - 1, col: pos.col });
    }
    if (!cell.southWall && pos.row < maze.length - 1 && validCells[pos.row + 1][pos.col]) {
      neighbors.push({ row: pos.row + 1, col: pos.col });
    }
    if (!cell.eastWall && pos.col < maze[0].length - 1 && validCells[pos.row][pos.col + 1]) {
      neighbors.push({ row: pos.row, col: pos.col + 1 });
    }
    if (!cell.westWall && pos.col > 0 && validCells[pos.row][pos.col - 1]) {
      neighbors.push({ row: pos.row, col: pos.col - 1 });
    }

    return neighbors;
  };

  const getLowestFScore = (openSet: Set<string>, fScore: Map<string, number>): Position => {
    let lowest = Infinity;
    let lowestPos: Position | null = null;

    for (const posStr of openSet) {
      const score = fScore.get(posStr) || Infinity;
      if (score < lowest) {
        lowest = score;
        const [row, col] = posStr.split(',').map(Number);
        lowestPos = { row, col };
      }
    }

    return lowestPos!;
  };

  const createPath = (
    maze: Cell[][],
    start: Position,
    end: Position,
    validCells: boolean[][]
  ) => {
    const path = findShortestPath(maze, start, end, validCells);
    if (path) {
      for (let i = 0; i < path.length - 1; i++) {
        const current = path[i];
        const next = path[i + 1];
        removeWallsBetween(maze[current.row][current.col], maze[next.row][next.col], current, next);
      }
    }
  };

  const removeWallForSide = (
    cell: Cell,
    side: 'north' | 'south' | 'east' | 'west'
  ) => {
    switch (side) {
      case 'north': cell.northWall = false; break;
      case 'south': cell.southWall = false; break;
      case 'east': cell.eastWall = false; break;
      case 'west': cell.westWall = false; break;
    }
  };

  const removeWallsBetween = (cell1: Cell, cell2: Cell, pos1: Position, pos2: Position) => {
    if (pos1.row < pos2.row) {
      cell1.southWall = false;
      cell2.northWall = false;
    } else if (pos1.row > pos2.row) {
      cell1.northWall = false;
      cell2.southWall = false;
    } else if (pos1.col < pos2.col) {
      cell1.eastWall = false;
      cell2.westWall = false;
    } else {
      cell1.westWall = false;
      cell2.eastWall = false;
    }
  };

  const findNearestPolygonSide = (
    x: number,
    y: number,
    points: [number, number][]
  ): 'north' | 'south' | 'east' | 'west' => {
    let minDist = Infinity;
    let nearestSideIndex = 0;

    for (let i = 0; i < points.length; i++) {
      const start = points[i];
      const end = points[(i + 1) % points.length];
      const dist = distanceToLineSegment(x, y, start[0], start[1], end[0], end[1]);

      if (dist < minDist) {
        minDist = dist;
        nearestSideIndex = i;
      }
    }

    // Convert side index to cardinal direction
    const angle = Math.atan2(
      points[nearestSideIndex][1] - y,
      points[nearestSideIndex][0] - x
    );
    const degrees = (angle * 180 / Math.PI + 360) % 360;

    if (degrees >= 315 || degrees < 45) return 'east';
    if (degrees >= 45 && degrees < 135) return 'north';
    if (degrees >= 135 && degrees < 225) return 'west';
    return 'south';
  };

  const findExitPosition = (
    validCells: boolean[][],
    points: [number, number][],
    exitPosition: string,
    entranceCell: [number, number] | null
  ): [number, number] | null => {
    if (!entranceCell) return null;

    const rows = validCells.length;
    const cols = validCells[0].length;
    const validEdgeCells: [number, number][] = [];

    // Find all valid edge cells except the entrance
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        if (!validCells[row][col]) continue;
        if (row === entranceCell[0] && col === entranceCell[1]) continue;

        // Check if it's an edge cell
        const isEdge = (
          (row > 0 && !validCells[row - 1][col]) ||
          (row < rows - 1 && !validCells[row + 1][col]) ||
          (col > 0 && !validCells[row][col - 1]) ||
          (col < cols - 1 && !validCells[row][col + 1])
        );

        if (isEdge) {
          validEdgeCells.push([row, col]);
        }
      }
    }

    if (validEdgeCells.length === 0) return null;

    if (exitPosition === 'random') {
      return validEdgeCells[Math.floor(Math.random() * validEdgeCells.length)];
    }

    if (exitPosition === 'farthest') {
      let farthestCell = validEdgeCells[0];
      let maxDistance = 0;

      validEdgeCells.forEach(([row, col]) => {
        const distance = Math.abs(row - entranceCell[0]) + Math.abs(col - entranceCell[1]);
        if (distance > maxDistance) {
          maxDistance = distance;
          farthestCell = [row, col];
        }
      });

      return farthestCell;
    }

    // Find cells closest to desired position
    let bestCell = validEdgeCells[0];
    let bestScore = Infinity;

    validEdgeCells.forEach(([row, col]) => {
      let score;
      switch (exitPosition) {
        case 'north':
          score = row;
          break;
        case 'south':
          score = -row;
          break;
        case 'east':
          score = -col;
          break;
        case 'west':
          score = col;
          break;
        default:
          score = 0;
      }

      if (score < bestScore) {
        bestScore = score;
        bestCell = [row, col];
      }
    });

    return bestCell;
  };

  const findEntrancePosition = (
    validCells: boolean[][],
    points: [number, number][],
    entrancePosition: string
  ): [number, number] | null => {
    const rows = validCells.length;
    const cols = validCells[0].length;
    const validEdgeCells: [number, number][] = [];

    // Find all valid cells near the edges
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        if (!validCells[row][col]) continue;

        // Check if it's an edge cell (has an invalid neighbor)
        const isEdge = (
          (row > 0 && !validCells[row - 1][col]) ||
          (row < rows - 1 && !validCells[row + 1][col]) ||
          (col > 0 && !validCells[row][col - 1]) ||
          (col < cols - 1 && !validCells[row][col + 1])
        );

        if (isEdge) {
          validEdgeCells.push([row, col]);
        }
      }
    }

    if (validEdgeCells.length === 0) return null;

    if (entrancePosition === 'random') {
      return validEdgeCells[Math.floor(Math.random() * validEdgeCells.length)];
    }

    // Find cells closest to desired position
    let bestCell = validEdgeCells[0];
    let bestScore = Infinity;

    validEdgeCells.forEach(([row, col]) => {
      let score;
      switch (entrancePosition) {
        case 'north':
          score = row;
          break;
        case 'south':
          score = -row;
          break;
        case 'east':
          score = -col;
          break;
        case 'west':
          score = col;
          break;
        default:
          score = 0;
      }

      if (score < bestScore) {
        bestScore = score;
        bestCell = [row, col];
      }
    });

    return bestCell;
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


  return {
    generateMaze
  };
};