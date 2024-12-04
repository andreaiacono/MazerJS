import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./components/ui/accordion";
import { Input } from './components/ui/input';
import { Button } from './components/ui/button';
import { Checkbox } from './components/ui/checkbox';
import { NumberSlider } from './components/ui/number-slider';
import {
  Card,
  CardContent,
} from './components/ui/card';
import {
  recursiveBacktracker,
  primsAlgorithm,
  recursiveDivision,
  huntAndKill,
  binaryMaze,
  sidewinderMaze,
} from './maze-algorithms';

interface Position {
  row: number;
  col: number;
}

interface SolvingState {
  currentPath: Position[];
  visited: Set<string>;
  found: boolean;
  entranceCell?: Position;
  exitCell?: Position;
}

interface Cell {
  northWall: boolean;
  southWall: boolean;
  eastWall: boolean;
  westWall: boolean;
  visited: boolean;
  isEntrance?: boolean;
  isExit?: boolean;
  isSolution?: boolean;
  circularWall?: boolean;
  radialWall?: boolean;
}

// And make sure MazeSettings is also defined
interface MazeSettings {
  horizontalBias: number;
  branchingProbability: number;
  deadEndDensity: number;
  multipleExits: boolean;
  entrancePosition: 'north' | 'south' | 'east' | 'west' | 'random';
  exitPosition: 'north' | 'south' | 'east' | 'west' | 'random' | 'farthest';
  symmetry: 'none' | 'horizontal' | 'vertical' | 'both';
}

interface AStarNode {
  position: Position;
  g: number;  // Cost from start to current node
  h: number;  // Estimated cost from current node to goal (heuristic)
  f: number;  // Total cost (g + h)
  parent: AStarNode | null;
}

interface OpenSetItem {
  node: AStarNode;
  f: number;
}

type MazeAlgorithm = 'binary' | 'sidewinder' | 'recursive-backtracker' | 'prims' | 'recursive-division' | 'hunt-and-kill';
const getArrowPadding = (cellSize: number) => Math.max(cellSize * 1.7, 20);
const CELLS_PER_LETTER = 50;
const FIXED_HEIGHT = 60;

const MazeGenerator = () => {

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isOpen, setIsOpen] = useState(true);
  const [frameType, setFrameType] = useState('square');
  const [cellSize, setCellSize] = useState(20);
  const [rows, setRows] = useState(20);
  const [columns, setColumns] = useState(20);
  const [wallColor, setWallColor] = useState('#000000');
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');
  const [solveSpeed, setSolveSpeed] = useState(50);
  const [text, setText] = useState('MAZER');
  const [polygonSides, setPolygonSides] = useState(6);
  const [wallThickness, setWallThickness] = useState(2);
  const [maze, setMaze] = useState<Cell[][]>([]);
  const [showArrows, setShowArrows] = useState(true);
  const [algorithm, setAlgorithm] = useState<MazeAlgorithm>('recursive-backtracker');
  const [isSolving, setIsSolving] = useState(false);
  const isCurrentlySolving = useRef(false);
  const currentSolveSpeed = useRef(solveSpeed); // Add this to track current speed
  const [solutionColor, setSolutionColor] = useState('#4CAF50');
  const [dimensions, setDimensions] = useState({ width: FIXED_HEIGHT * 2, height: FIXED_HEIGHT });
  const [mazeSettings, setMazeSettings] = useState<MazeSettings>({
    horizontalBias: 90,
    branchingProbability: 90,
    deadEndDensity: 50,
    multipleExits: false,
    entrancePosition: 'west',
    exitPosition: 'east',
    symmetry: 'none'
  });


  const algorithmPresets = {
    'binary': {
      horizontalBias: 75,
      branchingProbability: 70,
      deadEndDensity: 80
    },
    'sidewinder': {
      horizontalBias: 65,
      branchingProbability: 70,
      deadEndDensity: 50
    },
    'recursive-backtracker': {
      horizontalBias: 50,
      branchingProbability: 85,
      deadEndDensity: 30
    },
    'prims': {
      horizontalBias: 50,
      branchingProbability: 80,
      deadEndDensity: 50
    },
    'recursive-division': {
      horizontalBias: 70,
      branchingProbability: 50,
      deadEndDensity: 50
    },
    'hunt-and-kill': {
      horizontalBias: 50,
      branchingProbability: 75,
      deadEndDensity: 40
    }
  }

  const getLetterPixels = (text: string, dimensions: { width: number, height: number }) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return new Set<string>();

    canvas.width = dimensions.width;
    canvas.height = dimensions.height;
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, dimensions.width, dimensions.height);

    const fontSize = dimensions.height * 0.8;
    ctx.font = `900 ${fontSize}px "Times New Roman"`;

    const letterWidths = text.split('').map(l => ctx.measureText(l).width);
    const totalWidth = letterWidths.reduce((a, b) => a + b, 0);
    const spacing = -fontSize * 0.08;

    const baseX = dimensions.width * 0.1; // Add some padding on the left

    // Draw text
    text.split('').forEach((letter, i) => {
      const x = baseX + letterWidths.slice(0, i).reduce((a, b) => a + b, 0) + spacing * i;
      ctx.fillStyle = 'black';
      ctx.textBaseline = 'middle';
      ctx.fillText(letter, x, dimensions.height / 2);
    });

    // Convert to pixel set
    const pixels = new Set<string>();
    const imageData = ctx.getImageData(0, 0, dimensions.width, dimensions.height);
    for (let y = 0; y < dimensions.height; y++) {
      for (let x = 0; x < dimensions.width; x++) {
        if (imageData.data[(y * dimensions.width + x) * 4] < 128) {
          pixels.add(`${x},${y}`);
        }
      }
    }
    return pixels;
  };

  const findEntranceExit = (maze: Cell[][], isEntrance: boolean): Position | null => {
    for (let row = 0; row < maze.length; row++) {
        for (let col = 0; col < maze[row].length; col++) {
            const cell = maze[row][col];
            if (isEntrance ? cell.isEntrance : cell.isExit) {
                return { row, col };
            }
        }
    }
    return null;
};

  const handleAlgorithmChange = (value: MazeAlgorithm) => {
    setAlgorithm(value);
    // Apply preset values
    setMazeSettings(prev => ({
      ...prev,
      horizontalBias: algorithmPresets[value].horizontalBias,
      branchingProbability: algorithmPresets[value].branchingProbability,
      deadEndDensity: algorithmPresets[value].deadEndDensity
    }));
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

  // const generateMaze = () => {
  //   if (rows <= 0 || columns <= 0) return;

  //   let newMaze: Cell[][] = [];

  //   try {
  //     // Initialize the maze grid first
  //     for (let row = 0; row < rows; row++) {
  //       newMaze[row] = [];
  //       for (let col = 0; col < columns; col++) {
  //         newMaze[row][col] = {
  //           northWall: true,
  //           southWall: true,
  //           eastWall: true,
  //           westWall: true,
  //           visited: false,
  //           isEntrance: false,
  //           isExit: false
  //         };
  //       }
  //     }

  //     // Then apply the maze generation algorithm
  //     const settings = {
  //       horizontalBias: mazeSettings.horizontalBias / 100,
  //       branchingProbability: mazeSettings.branchingProbability / 100,
  //       deadEndDensity: mazeSettings.deadEndDensity / 100
  //     };

  //     switch (algorithm) {
  //       case 'binary':
  //         newMaze = binaryMaze(rows, columns, settings.horizontalBias);
  //         break;
  //       case 'sidewinder':
  //         newMaze = sidewinderMaze(
  //           rows,
  //           columns,
  //           settings.horizontalBias,
  //           settings.branchingProbability
  //         );
  //         break;
  //       case 'recursive-backtracker':
  //         newMaze = recursiveBacktracker(
  //           rows,
  //           columns,
  //           settings.branchingProbability,
  //           settings.deadEndDensity
  //         );
  //         break;
  //       case 'prims':
  //         newMaze = primsAlgorithm(
  //           rows,
  //           columns,
  //           settings.branchingProbability
  //         );
  //         break;
  //       case 'recursive-division':
  //         newMaze = recursiveDivision(
  //           rows,
  //           columns,
  //           settings.horizontalBias
  //         );
  //         break;
  //       case 'hunt-and-kill':
  //         newMaze = huntAndKill(
  //           rows,
  //           columns,
  //           settings.branchingProbability,
  //           settings.deadEndDensity
  //         );
  //         break;
  //       default:
  //         newMaze = binaryMaze(rows, columns, 0.5);
  //     }

  //     if (frameType === 'circular') {
  //       newMaze = adjustCellsToCircular(newMaze, rows, columns, cellSize, mazeSettings);
  //     } else if (frameType === 'polygon') {
  //       newMaze = adjustCellsToPolygon(newMaze, rows, columns, polygonSides, cellSize, mazeSettings);
  //     }

  //     // Apply symmetry if needed
  //     if (mazeSettings.symmetry !== 'none') {
  //       newMaze = applySymmetry(newMaze, rows, columns, mazeSettings.symmetry);
  //     }

  //     // Add entrance and exit
  //     newMaze = addEntranceAndExit(newMaze, rows, columns, mazeSettings);

  //     if (newMaze && newMaze.length > 0) {
  //       setMaze(newMaze);
  //     }
  //   } catch (error) {
  //     console.error('Error generating maze:', error);
  //   }
  // };

  const getAlgorithmDescription = (algo: MazeAlgorithm) => {
    const descriptions = {
      'binary': "Creates mazes with a clear bias toward paths moving down and right.\n\nAffected by: Horizontal Bias",
      'sidewinder': "Creates mazes with horizontal corridors and random vertical connections.\n\nAffected by: Horizontal Bias, Branching Probability",
      'recursive-backtracker': "Creates long, winding corridors with fewer dead ends.\n\nAffected by: Branching Probability, Dead End Density",
      'prims': "Creates organic-looking mazes with many short dead ends.\n\nAffected by: Branching Probability",
      'recursive-division': "Creates geometric patterns by recursively dividing chambers.\n\nAffected by: Horizontal Bias",
      'hunt-and-kill': "Balanced algorithm with a mix of corridors and dead ends.\n\nAffected by: Branching Probability, Dead End Density"
    };
    return descriptions[algo] || "";
  };

  const getAlgorithmSettings = (algo: MazeAlgorithm) => {
    switch (algo) {
      case 'binary':
        return ['Horizontal Bias'];
      case 'sidewinder':
        return ['Horizontal Bias', 'Branching Probability'];
      case 'recursive-backtracker':
        return ['Branching Probability', 'Dead End Density'];
      case 'prims':
        return ['Branching Probability'];
      case 'recursive-division':
        return ['Horizontal Bias'];
      case 'hunt-and-kill':
        return ['Branching Probability', 'Dead End Density'];
      default:
        return [];
    }
  };

  const drawPolygonMaze = (
    ctx: CanvasRenderingContext2D,
    maze: Cell[][],
    rows: number,
    columns: number,
    sides: number,
    cellSize: number,
    settings: MazeSettings,
    wallColor: string,
    showArrows: boolean
  ) => {
    if (!maze || maze.length === 0 || !maze[0]) return;

    const mazeWidth = columns * cellSize;
    const mazeHeight = rows * cellSize;
    const centerX = mazeWidth / 2;
    const centerY = mazeHeight / 2;
    const radius = Math.min(mazeWidth, mazeHeight) / 2 * 0.8;

    // Calculate polygon points
    const points = getPolygonPoints(sides, radius, centerX, centerY);

    // Find entrance and exit points and their sides
    let entranceInfo: { point: [number, number], sideStart: [number, number], sideEnd: [number, number] } | null = null;
    let exitInfo: { point: [number, number], sideStart: [number, number], sideEnd: [number, number] } | null = null;

    // Find entrance and exit cells
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < columns; col++) {
        const cell = maze[row]?.[col];
        if (!cell) continue;

        const cellCenterX = col * cellSize + cellSize / 2;
        const cellCenterY = row * cellSize + cellSize / 2;

        if (isPointInPolygon(cellCenterX, cellCenterY, points)) {
          if (cell.isEntrance || cell.isExit) {
            // Find nearest polygon side
            let minDist = Infinity;
            let nearestSideStart: [number, number] | null = null;
            let nearestSideEnd: [number, number] | null = null;

            for (let i = 0; i < points.length; i++) {
              const start = points[i];
              const end = points[(i + 1) % points.length];
              const dist = distanceToLineSegment(
                cellCenterX,
                cellCenterY,
                start[0],
                start[1],
                end[0],
                end[1]
              );
              if (dist < minDist) {
                minDist = dist;
                nearestSideStart = start;
                nearestSideEnd = end;
              }
            }

            if (nearestSideStart && nearestSideEnd) {
              // Calculate intersection point with the polygon side
              const midX = (nearestSideStart[0] + nearestSideEnd[0]) / 2;
              const midY = (nearestSideStart[1] + nearestSideEnd[1]) / 2;

              const info = {
                point: [midX, midY] as [number, number],
                sideStart: nearestSideStart,
                sideEnd: nearestSideEnd
              };

              if (cell.isEntrance) {
                entranceInfo = info;
              } else {
                exitInfo = info;
              }
            }
          }
        }
      }
    }

    // Set up clipping region for the maze
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i][0], points[i][1]);
    }
    ctx.closePath();
    ctx.clip();

    // Draw the maze cells
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < columns; col++) {
        if (!maze[row]?.[col]) continue;

        const cell = maze[row][col];
        const x = col * cellSize;
        const y = row * cellSize;
        const cellCenterX = x + cellSize / 2;
        const cellCenterY = y + cellSize / 2;

        if (isPointInPolygon(cellCenterX, cellCenterY, points)) {
          const extensionLength = cellSize * 0.1;

          if (cell.northWall) drawLine(ctx, x - extensionLength, y, x + cellSize + extensionLength, y);
          if (cell.eastWall) drawLine(ctx, x + cellSize, y - extensionLength, x + cellSize, y + cellSize + extensionLength);
          if (cell.southWall) drawLine(ctx, x - extensionLength, y + cellSize, x + cellSize + extensionLength, y + cellSize);
          if (cell.westWall) drawLine(ctx, x, y - extensionLength, x, y + cellSize + extensionLength);
        }
      }
    }

    // Remove clipping and draw the polygon border with gaps for entrance/exit
    ctx.restore();

    // Draw the polygon border with gaps for entrance/exit
    ctx.beginPath();
    for (let i = 0; i <= points.length; i++) {
      const start = points[i];
      const end = points[(i + 1) % points.length];

      // Check if this side contains entrance or exit
      const isEntranceSide = entranceInfo &&
        start === entranceInfo.sideStart &&
        end === entranceInfo.sideEnd;
      const isExitSide = exitInfo &&
        start === exitInfo.sideStart &&
        end === exitInfo.sideEnd;

      if (isEntranceSide || isExitSide) {
        // Draw the side with a gap
        const info = isEntranceSide ? entranceInfo! : exitInfo!;
        const gapSize = cellSize;

        // Calculate unit vector along the side
        const dx = end[0] - start[0];
        const dy = end[1] - start[1];
        const length = Math.sqrt(dx * dx + dy * dy);
        const unitX = dx / length;
        const unitY = dy / length;

        // Calculate gap points
        const midX = info.point[0];
        const midY = info.point[1];
        const gapStart: [number, number] = [
          midX - (gapSize / 2) * unitX,
          midY - (gapSize / 2) * unitY
        ];
        const gapEnd: [number, number] = [
          midX + (gapSize / 2) * unitX,
          midY + (gapSize / 2) * unitY
        ];

        // Draw the two segments of the side
        ctx.lineTo(gapStart[0], gapStart[1]);
        ctx.moveTo(gapEnd[0], gapEnd[1]);
        ctx.lineTo(end[0], end[1]);
      } else {
        // Draw the full side
        ctx.lineTo(end[0], end[1]);
      }
    }
    ctx.strokeStyle = wallColor;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw arrows if enabled
    if (showArrows && (entranceInfo || exitInfo)) {
      const arrowLength = cellSize * 2; // Increase arrow length

      if (entranceInfo) {
        const { point, sideStart, sideEnd } = entranceInfo;
        const dx = sideEnd[0] - sideStart[0];
        const dy = sideEnd[1] - sideStart[1];
        const length = Math.sqrt(dx * dx + dy * dy);
        const perpX = -dy / length;  // Perpendicular vector pointing inward
        const perpY = dx / length;

        // Draw entrance arrow from outside to the gap
        drawArrow(
          ctx,
          point[0] - perpX * arrowLength,  // Start further outside
          point[1] - perpY * arrowLength,
          point[0],                        // End at the border
          point[1]
        );
      }

      if (exitInfo) {
        const { point, sideStart, sideEnd } = exitInfo;
        const dx = sideEnd[0] - sideStart[0];
        const dy = sideEnd[1] - sideStart[1];
        const length = Math.sqrt(dx * dx + dy * dy);
        const perpX = -dy / length;  // Perpendicular vector pointing inward
        const perpY = dx / length;

        // Draw exit arrow from the gap to outside
        drawArrow(
          ctx,
          point[0],                        // Start at the border
          point[1],
          point[0] - perpX * arrowLength,  // End further outside
          point[1] - perpY * arrowLength
        );
      }
    }
  };

  // Helper function to calculate distance from point to line segment
  const distanceToLineSegment = (
    px: number,
    py: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number
  ): number => {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;

    if (lenSq !== 0) {
      param = dot / lenSq;
    }

    let xx, yy;

    if (param < 0) {
      xx = x1;
      yy = y1;
    } else if (param > 1) {
      xx = x2;
      yy = y2;
    } else {
      xx = x1 + param * C;
      yy = y1 + param * D;
    }

    const dx = px - xx;
    const dy = py - yy;

    return Math.sqrt(dx * dx + dy * dy);
  };


  const getPolygonPoints = (sides: number, radius: number, centerX: number, centerY: number) => {
    const points: [number, number][] = [];
    const angleStep = (2 * Math.PI) / sides;

    for (let i = 0; i < sides; i++) {
      const angle = i * angleStep - Math.PI / 2; // Start from top center
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      points.push([x, y]);
    }

    return points;
  };

  const drawArrow = (
    ctx: CanvasRenderingContext2D,
    fromX: number,
    fromY: number,
    toX: number,
    toY: number
  ) => {
    const headlen = cellSize / 2; // Make arrowhead size relative to cell size
    const angle = Math.atan2(toY - fromY, toX - fromX);
    const length = Math.sqrt(Math.pow(toX - fromX, 2) + Math.pow(toY - fromY, 2));

    // Draw the line
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();

    // Calculate arrowhead points
    const arrowX = toX - headlen * Math.cos(angle);
    const arrowY = toY - headlen * Math.sin(angle);

    // Draw the arrowhead
    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(
      arrowX - headlen * Math.cos(angle - Math.PI / 6),
      arrowY - headlen * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
      arrowX - headlen * Math.cos(angle + Math.PI / 6),
      arrowY - headlen * Math.sin(angle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fillStyle = wallColor;
    ctx.fill();
  };
  
  const drawMaze = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx || !maze || maze.length === 0 || !maze[0]) {
      if (ctx) {
        const arrowPadding = getArrowPadding(cellSize);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      return;
    }

    const arrowPadding = getArrowPadding(cellSize);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(arrowPadding, arrowPadding);

    ctx.strokeStyle = wallColor;
    ctx.lineWidth = wallThickness;
    ctx.fillStyle = backgroundColor;

    if (frameType === 'text') {
      drawTextMaze(ctx);
    } else if (frameType === 'circular') {
      drawCircularMaze(ctx, maze, rows, columns, cellSize, mazeSettings, wallColor, showArrows);
    } else if (frameType === 'polygon') {
      drawPolygonMaze(ctx, maze, rows, columns, polygonSides, cellSize, mazeSettings, wallColor, showArrows);
    } else {
      // Square/rectangular maze drawing (your existing code)
      for (let row = 0; row < maze.length; row++) {
        if (!maze[row]) continue;

        for (let col = 0; col < maze[row].length; col++) {
          const cell = maze[row][col];
          if (!cell) continue;

          const x = col * cellSize;
          const y = row * cellSize;

          if (cell.northWall) drawLine(ctx, x, y, x + cellSize, y);
          if (cell.eastWall) drawLine(ctx, x + cellSize, y, x + cellSize, y + cellSize);
          if (cell.southWall) drawLine(ctx, x, y + cellSize, x + cellSize, y + cellSize);
          if (cell.westWall) drawLine(ctx, x, y, x, y + cellSize);

          // // Draw solution path if cell is part of solution
          // if (cell.isSolution) {
          //   ctx.fillStyle = solutionColor;
          //   ctx.fillRect(
          //     x + cellSize * 0.25,
          //     y + cellSize * 0.25,
          //     cellSize * 0.5,
          //     cellSize * 0.5
          //   );
          // }

          // Draw entrance/exit arrows if enabled
          if (showArrows) {
            const mazeWidth = columns * cellSize;
            const mazeHeight = rows * cellSize;
            const arrowLength = cellSize * 2;

            if (cell.isEntrance) {
              if (col === 0) {
                drawArrow(ctx, -arrowLength, y + cellSize / 2, 0, y + cellSize / 2);
              }
            }

            if (cell.isExit) {
              if (col === maze[row].length - 1) {
                drawArrow(ctx, mazeWidth, y + cellSize / 2, mazeWidth + arrowLength, y + cellSize / 2);
              }
            }
          }
        }
      }
    }

    ctx.restore();
  };

  // Add this new function to handle text maze drawing
  const drawTextMaze = (ctx: CanvasRenderingContext2D) => {
    // Get text pixels for reference
    const pixels = getLetterPixels(text, dimensions);

    // Draw the cells first
    for (let row = 0; row < maze.length; row++) {
      for (let col = 0; col < maze[row].length; col++) {
        const cell = maze[row][col];
        const x = col * cellSize;
        const y = row * cellSize;

        // Only draw cells that are part of the text
        if (pixels.has(`${col},${row}`)) {
          // Fill cell background
          ctx.fillStyle = cell.isSolution ? solutionColor : backgroundColor;
          ctx.fillRect(x, y, cellSize, cellSize);
        }
      }
    }

    // Then draw the walls
    for (let row = 0; row < maze.length; row++) {
      for (let col = 0; col < maze[row].length; col++) {
        const cell = maze[row][col];
        const x = col * cellSize;
        const y = row * cellSize;

        // Only draw walls for cells that are part of the text
        if (pixels.has(`${col},${row}`)) {
          ctx.strokeStyle = wallColor;
          ctx.lineWidth = wallThickness;

          if (cell.northWall) drawLine(ctx, x, y, x + cellSize, y);
          if (cell.eastWall) drawLine(ctx, x + cellSize, y, x + cellSize, y + cellSize);
          if (cell.southWall) drawLine(ctx, x, y + cellSize, x + cellSize, y + cellSize);
          if (cell.westWall) drawLine(ctx, x, y, x, y + cellSize);
        }
      }
    }

    // Draw entrance/exit arrows if enabled
    if (showArrows) {
      // Find entrance and exit positions
      for (let row = 0; row < maze.length; row++) {
        for (let col = 0; col < maze[row].length; col++) {
          const cell = maze[row][col];
          if (cell.isEntrance) {
            // Draw entrance arrow on the left
            drawArrow(
              ctx,
              -cellSize * 2,
              row * cellSize + cellSize / 2,
              0,
              row * cellSize + cellSize / 2
            );
          }
          if (cell.isExit) {
            // Draw exit arrow on the right
            const mazeWidth = columns * cellSize;
            drawArrow(
              ctx,
              mazeWidth,
              row * cellSize + cellSize / 2,
              mazeWidth + cellSize * 2,
              row * cellSize + cellSize / 2
            );
          }
        }
      }
    }
  };

  const drawLine = (
    ctx: CanvasRenderingContext2D,
    x1: number,
    y1: number,
    x2: number,
    y2: number) => {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  };

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // Helper function to calculate if a point is inside a polygon
  const isPointInPolygon = (x: number, y: number, points: [number, number][]): boolean => {
    let inside = false;
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
      const xi = points[i][0], yi = points[i][1];
      const xj = points[j][0], yj = points[j][1];

      const intersect = ((yi > y) !== (yj > y))
        && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  };


  const animateSolving = async (
    state: SolvingState,
    entrance: Position,
    exit: Position,
    ctx: CanvasRenderingContext2D,
  ): Promise<boolean> => {
    console.log("is solvign " + isSolving)
    console.log("state " + JSON.stringify(state))
    if (!isSolving) return false; // Check if solving was cancelled

    const current = state.currentPath[state.currentPath.length - 1];

    // Check if we reached the exit
    console.log("current: " + current + " exit: " + exit)
    if (current.row === exit.row && current.col === exit.col) {
      state.found = true;
      return true;
    }

    // Get valid moves from current position
    const moves = getValidMoves(current, maze, state.visited);
    console.log(moves)

    // Try each possible move
    for (const move of moves) {
      if (!isCurrentlySolving.current) return false; // Check if solving was cancelled

      // Add move to current path
      state.currentPath.push(move);
      state.visited.add(`${move.row},${move.col}`);

      // Draw current state
      drawMaze();  // Draw the base maze
      drawSolutionPath(ctx, state.currentPath);  // Draw the solution path

      // Add delay based on solve speed
      await delay(101 - solveSpeed);

      // Recursively continue solving
      if (await animateSolving(state, entrance, exit, ctx)) {
        return true;
      }

      // If we get here, this path didn't work - backtrack
      state.currentPath.pop();
    }

    return false;
  };

  // Helper function to find nearest polygon side
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

  // Helper function to remove appropriate wall based on side
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

  const exportImage = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = 'maze.png';
    link.href = canvasRef.current.toDataURL();
    link.click();
  };


  const getValidMoves = (
    pos: Position,
    maze: Cell[][],
    visited: Set<string>
  ): Position[] => {
    const moves: Position[] = [];
    const cell = maze[pos.row][pos.col];
  
    if (frameType === 'circular') {
      const sectors = maze[0].length;
  
      // Moving inward (towards center)
      if (pos.row > 0 && !cell.northWall) {
        const next = { row: pos.row - 1, col: pos.col };
        if (!visited.has(`${next.row},${next.col}`)) {
          moves.push(next);
        }
      }
  
      // Moving outward (away from center)
      if (pos.row < maze.length - 1 && !cell.southWall) {
        const next = { row: pos.row + 1, col: pos.col };
        if (!visited.has(`${next.row},${next.col}`)) {
          moves.push(next);
        }
      }
  
      // Moving clockwise
      if (!cell.eastWall) {
        const nextCol = (pos.col + 1) % sectors;
        const next = { row: pos.row, col: nextCol };
        if (!visited.has(`${next.row},${next.col}`)) {
          moves.push(next);
        }
      }
  
      // Moving counter-clockwise
      if (!cell.westWall) {
        const nextCol = (pos.col - 1 + sectors) % sectors;
        const next = { row: pos.row, col: nextCol };
        if (!visited.has(`${next.row},${next.col}`)) {
          moves.push(next);
        }
      }
    } else {
      // Original code for rectangular/polygon mazes
      if (!cell.northWall && pos.row > 0) {
        const next = { row: pos.row - 1, col: pos.col };
        if (!visited.has(`${next.row},${next.col}`)) moves.push(next);
      }
      if (!cell.southWall && pos.row < maze.length - 1) {
        const next = { row: pos.row + 1, col: pos.col };
        if (!visited.has(`${next.row},${next.col}`)) moves.push(next);
      }
      if (!cell.eastWall && pos.col < maze[0].length - 1) {
        const next = { row: pos.row, col: pos.col + 1 };
        if (!visited.has(`${next.row},${next.col}`)) moves.push(next);
      }
      if (!cell.westWall && pos.col > 0) {
        const next = { row: pos.row, col: pos.col - 1 };
        if (!visited.has(`${next.row},${next.col}`)) moves.push(next);
      }
    }
  
    return moves;
  };
  

  const lastPolygonSides = useRef(polygonSides);
  const handlePolygonSidesChange = (newValue: number) => {
    const roundedValue = Math.round(newValue);
    if (roundedValue >= 3 && roundedValue <= 10 && roundedValue !== lastPolygonSides.current) {
      setPolygonSides(roundedValue);
      lastPolygonSides.current = roundedValue;
      // Clear the maze before regenerating
      setMaze([]);
      // Use setTimeout to ensure state updates before regenerating
      setTimeout(generateMaze, 0);
    }
  };

  const lastMazeSettings = useRef(mazeSettings);
  const handleMazeSettingChange = (
    setting: 'horizontalBias' | 'branchingProbability' | 'deadEndDensity',
    newValue: number
  ) => {
    const roundedValue = Math.round(newValue / 5) * 5;
    if (roundedValue !== lastMazeSettings.current[setting]) {
      setMazeSettings(prev => {
        const newSettings = {
          ...prev,
          [setting]: roundedValue
        };
        lastMazeSettings.current = newSettings;
        generateMaze();
        return newSettings;
      });
    }
  };


  const solveMaze = async () => {
    console.log("Starting solve, current solving:", isCurrentlySolving.current);

    if (isCurrentlySolving.current) {
      console.log("Already solving, stopping");
      isCurrentlySolving.current = false;
      setIsSolving(false);
      return;
    }

    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx || !maze || maze.length === 0) return;

    // Reset any previous solution
    maze.forEach(row => row.forEach(cell => {
      cell.isSolution = false;
    }));

    const entrance = findEntranceExit(maze, true);
    const exit = findEntranceExit(maze, false);

    if (!entrance || !exit) {
      console.error('Could not find entrance or exit');
      return;
    }

    console.log("Setting solving flags to true");
    isCurrentlySolving.current = true;
    setIsSolving(true);

    const state: SolvingState = {
      currentPath: [entrance],
      visited: new Set([`${entrance.row},${entrance.col}`]),
      found: false
    };

    try {
      drawMaze();

      const solveMazeRecursive = async (state: SolvingState): Promise<boolean> => {
        if (!isCurrentlySolving.current) return false;

        const current = state.currentPath[state.currentPath.length - 1];

        if (current.row === exit.row && current.col === exit.col) {
          state.found = true;
          return true;
        }

        const moves = getValidMoves(current, maze, state.visited);

        for (const move of moves) {
          if (!isCurrentlySolving.current) return false;

          state.currentPath.push(move);
          state.visited.add(`${move.row},${move.col}`);

          drawMaze();
          drawSolutionPath(ctx, state.currentPath);

          // Use dynamic delay that checks current speed
          await dynamicDelay();

          if (await solveMazeRecursive(state)) {
            return true;
          }

          state.currentPath.pop();

          if (!isCurrentlySolving.current) return false;

          drawMaze();
          drawSolutionPath(ctx, state.currentPath);

          // Use dynamic delay for backtracking too
          await dynamicDelay();
        }

        return false;
      };

      console.log("Starting recursive solve");
      const success = await solveMazeRecursive(state);
      console.log("Solve completed, success:", success);

      if (success && isCurrentlySolving.current) {
        state.currentPath.forEach(pos => {
          maze[pos.row][pos.col].isSolution = true;
        });

        drawMaze();
        drawSolutionPath(ctx, state.currentPath);
      }
    } finally {
      console.log("In finally block, cleaning up");
      if (!isCurrentlySolving.current) {
        drawMaze();
      }
      isCurrentlySolving.current = false;
      setIsSolving(false);
    }
  };

  const generateMaze = () => {
    if (frameType === 'text') {
      if (!text) return;

      // Calculate dimensions based on text length
      const textDimensions = {
        width: CELLS_PER_LETTER * Math.max(text.length, 1),
        height: rows
      };

      setColumns(textDimensions.width); // Update columns to match text width

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
          newMaze[row][col].visited = !isTextCell; // Mark non-text cells as visited

          if (isTextCell) {
            // Remove walls between adjacent text cells
            if (pixels.has(`${col},${row - 1}`)) newMaze[row][col].northWall = false;
            if (pixels.has(`${col},${row + 1}`)) newMaze[row][col].southWall = false;
            if (pixels.has(`${col - 1},${row}`)) newMaze[row][col].westWall = false;
            if (pixels.has(`${col + 1},${row}`)) newMaze[row][col].eastWall = false;
          }
        }
      }

      // Find entrance and exit
      let entranceY = Math.floor(rows / 2);
      let exitY = Math.floor(rows / 2);
      let entranceFound = false;
      let exitFound = false;

      // Find suitable entrance and exit points
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

      // Set entrance and exit
      if (entranceFound) {
        newMaze[entranceY][0].isEntrance = true;
        newMaze[entranceY][0].westWall = false;
      }
      if (exitFound) {
        newMaze[exitY][textDimensions.width - 1].isExit = true;
        newMaze[exitY][textDimensions.width - 1].eastWall = false;
      }

      setMaze(newMaze);

    } else {


      try {
        // For polygon mazes, first calculate the valid cells
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

        // Initialize maze with only valid cells
        let newMaze: Cell[][] = [];
        for (let row = 0; row < rows; row++) {
          newMaze[row] = [];
          for (let col = 0; col < columns; col++) {
            // For polygon frame, only initialize cells that are inside the polygon
            if (frameType === 'polygon' && validCells && !validCells[row][col]) {
              newMaze[row][col] = {
                northWall: false,
                southWall: false,
                eastWall: false,
                westWall: false,
                visited: true, // Mark as visited to skip in generation
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
          horizontalBias: mazeSettings.horizontalBias / 100,
          branchingProbability: mazeSettings.branchingProbability / 100,
          deadEndDensity: mazeSettings.deadEndDensity / 100
        };

        // Modify the maze generation algorithms to respect valid cells
        const generateWithValidCells = (
          algorithm: (rows: number, columns: number, ...args: any[]) => Cell[][],
          ...args: any[]
        ) => {
          const modifiedAlgorithm = (maze: Cell[][], validCells: boolean[][] | null) => {
            // Skip cells marked as invalid during generation
            const isValidCell = (row: number, col: number) => {
              if (!validCells) return true;
              return validCells[row][col];
            };

            // Modified version of the algorithm that respects valid cells
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

        // Generate the maze using the selected algorithm
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

        // Apply frame-specific adjustments
        if (frameType === 'circular') {
          newMaze = adjustCellsToCircular(newMaze, rows, columns, cellSize, mazeSettings);
        } else if (frameType === 'polygon') {
          newMaze = adjustCellsToPolygon(newMaze, rows, columns, polygonSides, cellSize, mazeSettings);
        }

        // Apply symmetry if needed
        if (mazeSettings.symmetry !== 'none') {
          newMaze = applySymmetry(newMaze, rows, columns, mazeSettings.symmetry);
        }

        // Add entrance and exit
        if (frameType !== 'circular') {
          newMaze = addEntranceAndExit(newMaze, rows, columns, mazeSettings);
        }

        if (newMaze && newMaze.length > 0) {
          setMaze(newMaze);
        }
      }
      catch (error) {
        console.error('Error generating maze:', error);
      }
    }
  };


  const drawCircularMaze = (
    ctx: CanvasRenderingContext2D,
    maze: Cell[][],
    rows: number,
    columns: number,
    cellSize: number,
    settings: MazeSettings,
    wallColor: string,
    showArrows: boolean
  ) => {
    if (!maze || maze.length === 0 || !maze[0]) return;
  
    const rings = maze.length;
    const sectors = maze[0].length;
    const centerX = (columns * cellSize) / 2;
    const centerY = (rows * cellSize) / 2;
    const maxRadius = Math.min(centerX, centerY) * 0.8;
    const ringWidth = maxRadius / (rings + 1); // Add 1 to account for empty inner ring
  
    ctx.strokeStyle = wallColor;
    ctx.lineWidth = wallThickness;
  
    // First draw the empty inner circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, ringWidth, 0, 2 * Math.PI);
    ctx.stroke();
  
    // Draw the rest of the maze rings and sectors
    for (let ring = 0; ring < rings; ring++) {
      const currentRadius = (ring + 2) * ringWidth; // Add 2 to skip the inner empty ring
  
      for (let sector = 0; sector < sectors; sector++) {
        if (!maze[ring] || !maze[ring][sector]) continue;
  
        const cell = maze[ring][sector];
        const startAngle = (sector * 2 * Math.PI) / sectors;
        const endAngle = ((sector + 1) * 2 * Math.PI) / sectors;
  
        // Draw circular wall (between sectors)
        if (cell.eastWall) {
          ctx.beginPath();
          ctx.moveTo(
            centerX + currentRadius * Math.cos(endAngle),
            centerY + currentRadius * Math.sin(endAngle)
          );
          ctx.lineTo(
            centerX + (currentRadius - ringWidth) * Math.cos(endAngle),
            centerY + (currentRadius - ringWidth) * Math.sin(endAngle)
          );
          ctx.stroke();
        }
  
        // Draw radial wall (between rings)
        if (cell.southWall && ring < rings - 1) {
          ctx.beginPath();
          ctx.arc(centerX, centerY, currentRadius, startAngle, endAngle);
          ctx.stroke();
        }
      }
    }
  
    // Draw outer boundary with gaps for entrance/exit
    const outerRadius = (rings + 1) * ringWidth;
    ctx.beginPath();
    for (let sector = 0; sector < sectors; sector++) {
      const startAngle = (sector * 2 * Math.PI) / sectors;
      const endAngle = ((sector + 1) * 2 * Math.PI) / sectors;
  
      // Check if this sector contains entrance or exit
      const cell = maze[rings - 1][sector];
      if (cell && (cell.isEntrance || cell.isExit)) {
        // Draw the boundary with a gap
        const gapSize = Math.PI / (3 * sectors);
        const midAngle = (startAngle + endAngle) / 2;
        
        ctx.arc(centerX, centerY, outerRadius, startAngle, midAngle - gapSize);
        ctx.moveTo(
          centerX + outerRadius * Math.cos(midAngle + gapSize),
          centerY + outerRadius * Math.sin(midAngle + gapSize)
        );
        ctx.arc(centerX, centerY, outerRadius, midAngle + gapSize, endAngle);
      } else {
        ctx.arc(centerX, centerY, outerRadius, startAngle, endAngle);
      }
    }
    ctx.stroke();
  
    // Draw arrows if enabled
    if (showArrows) {
      const arrowLength = cellSize * 1.5;
      
      for (let sector = 0; sector < sectors; sector++) {
        const cell = maze[rings - 1][sector];
        if (!cell) continue;
  
        if (cell.isEntrance || cell.isExit) {
          const angle = ((sector + 0.5) * 2 * Math.PI) / sectors;
  
          if (cell.isEntrance) {
            drawArrow(
              ctx,
              centerX + (outerRadius + arrowLength) * Math.cos(angle),
              centerY + (outerRadius + arrowLength) * Math.sin(angle),
              centerX + outerRadius * Math.cos(angle),
              centerY + outerRadius * Math.sin(angle)
            );
          }
          if (cell.isExit) {
            drawArrow(
              ctx,
              centerX + outerRadius * Math.cos(angle),
              centerY + outerRadius * Math.sin(angle),
              centerX + (outerRadius + arrowLength) * Math.cos(angle),
              centerY + (outerRadius + arrowLength) * Math.sin(angle)
            );
          }
        }
      }
    }
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
      rectangularMaze = binaryMaze(rings, sectors, settings.horizontalBias / 100);
      break;
    case 'sidewinder':
      rectangularMaze = sidewinderMaze(rings, sectors, settings.horizontalBias / 100, settings.branchingProbability / 100);
      break;
    case 'recursive-backtracker':
      rectangularMaze = recursiveBacktracker(rings, sectors, settings.branchingProbability / 100, settings.deadEndDensity / 100);
      break;
    case 'prims':
      rectangularMaze = primsAlgorithm(rings, sectors, settings.branchingProbability / 100);
      break;
    case 'recursive-division':
      rectangularMaze = recursiveDivision(rings, sectors, settings.horizontalBias / 100);
      break;
    case 'hunt-and-kill':
      rectangularMaze = huntAndKill(rings, sectors, settings.branchingProbability / 100, settings.deadEndDensity / 100);
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

  const dynamicDelay = async () => {
    await new Promise(resolve => setTimeout(resolve, 101 - currentSolveSpeed.current));
  };

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
  
  // Helper function to verify if a path exists
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
  
  // Helper function to create a path between entrance and exit
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
  
  // Helper function to find shortest path using A*
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
  
  const manhattanDistance = (pos1: Position, pos2: Position): number => {
    return Math.abs(pos1.row - pos2.row) + Math.abs(pos1.col - pos2.col);
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

  const drawSolutionPath = (
    ctx: CanvasRenderingContext2D,
    path: Position[],
  ) => {
    if (!path.length) return;
    
    const arrowPadding = getArrowPadding(cellSize);
    ctx.save();
    ctx.translate(arrowPadding, arrowPadding);
  
    if (frameType === 'circular') {
      const rings = maze.length;
      const sectors = maze[0].length;
      const centerX = (columns * cellSize) / 2;
      const centerY = (rows * cellSize) / 2;
      const maxRadius = Math.min(centerX, centerY) * 0.8;
      const ringWidth = maxRadius / (rings + 1);
  
      // Base line width for outermost ring
      const baseLineWidth = ringWidth / 3;
      
      ctx.strokeStyle = solutionColor;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
  
      // Calculate first cell center and line width
      let radius = (path[0].row + 2) * ringWidth - ringWidth/2;
      let angle = (path[0].col + 0.5) * (2 * Math.PI / sectors);
      let x = centerX + radius * Math.cos(angle);
      let y = centerY + radius * Math.sin(angle);
      
      // Draw each segment separately to allow different line widths
      for (let i = 1; i < path.length; i++) {
        const prev = path[i - 1];
        const current = path[i];
        
        // Calculate radius for current position
        radius = (current.row + 2) * ringWidth - ringWidth/2;
        
        // Scale line width based on current radius
        // We use the ratio of current circumference to maximum circumference
        const circumferenceRatio = radius / maxRadius;
        ctx.lineWidth = Math.max(1, baseLineWidth * circumferenceRatio);
        
        ctx.beginPath();
        if (prev.row === current.row) {
          // Same ring - draw an arc
          const prevAngle = (prev.col + 0.5) * (2 * Math.PI / sectors);
          const currentAngle = (current.col + 0.5) * (2 * Math.PI / sectors);
          
          // Determine shortest arc
          let deltaAngle = currentAngle - prevAngle;
          if (deltaAngle > Math.PI) deltaAngle -= 2 * Math.PI;
          if (deltaAngle < -Math.PI) deltaAngle += 2 * Math.PI;
  
          // Move to start point
          x = centerX + radius * Math.cos(prevAngle);
          y = centerY + radius * Math.sin(prevAngle);
          ctx.moveTo(x, y);
          
          // Draw arc
          ctx.arc(
            centerX,
            centerY,
            radius,
            prevAngle,
            prevAngle + deltaAngle,
            deltaAngle < 0
          );
        } else {
          // Different rings - draw straight line
          const angle = (current.col + 0.5) * (2 * Math.PI / sectors);
          const prevRadius = (prev.row + 2) * ringWidth - ringWidth/2;
          
          // Start point
          x = centerX + prevRadius * Math.cos(angle);
          y = centerY + prevRadius * Math.sin(angle);
          ctx.moveTo(x, y);
          
          // End point
          x = centerX + radius * Math.cos(angle);
          y = centerY + radius * Math.sin(angle);
          ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    } else {
      // Original code for rectangular/polygon mazes...
      ctx.strokeStyle = solutionColor;
      ctx.lineWidth = cellSize / 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      ctx.beginPath();
      path.forEach((pos, index) => {
        const x = (pos.col + 0.5) * cellSize;
        const y = (pos.row + 0.5) * cellSize;
  
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.stroke();
    }
  
    ctx.restore();
  };

  // Update the useEffect for maze generation to include polygonSides
  useEffect(() => {
    generateMaze();
  }, [frameType, algorithm, rows, columns, mazeSettings, polygonSides]); // Added polygonSides here


  useEffect(() => {
    drawMaze();
  }, [maze, cellSize, wallColor, backgroundColor, wallThickness, showArrows]); // Added showArrows here

  useEffect(() => {
    currentSolveSpeed.current = solveSpeed;
  }, [solveSpeed]);

  useEffect(() => {
    if (frameType === 'text') {
      setDimensions({
        width: CELLS_PER_LETTER * Math.max(text.length, 1),
        height: rows
      });
    }
  }, [text, frameType]);

  const showSolution = () => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx || !maze || maze.length === 0) return;

    // Reset any previous solution
    maze.forEach(row => row.forEach(cell => {
      cell.isSolution = false;
    }));

    // Find entrance and exit
    const entrance = findEntranceExit(maze, true);
    const exit = findEntranceExit(maze, false);

    if (!entrance || !exit) {
      console.error('Could not find entrance or exit');
      return;
    }

    // Initialize state for solving
    const state: SolvingState = {
      currentPath: [entrance],
      visited: new Set([`${entrance.row},${entrance.col}`]),
      found: false
    };

    // Non-animated recursive solve function
    const findSolutionPath = (state: SolvingState): boolean => {
      const current = state.currentPath[state.currentPath.length - 1];

      // Check if we reached the exit
      if (current.row === exit.row && current.col === exit.col) {
        state.found = true;
        return true;
      }

      // Get valid moves from current position
      const moves = getValidMoves(current, maze, state.visited);

      // Try each possible move
      for (const move of moves) {
        state.currentPath.push(move);
        state.visited.add(`${move.row},${move.col}`);

        if (findSolutionPath(state)) {
          return true;
        }

        // If we get here, this path didn't work - backtrack
        state.currentPath.pop();
      }

      return false;
    };

    // Find the solution
    const success = findSolutionPath(state);

    if (success) {
      // Mark solution path in the maze
      state.currentPath.forEach(pos => {
        maze[pos.row][pos.col].isSolution = true;
      });

      // Draw the maze with solution
      drawMaze();
      drawSolutionPath(ctx, state.currentPath);
    }
  };

  const ActionButtons = () => (
    <div className="absolute top-8 left-8 z-20 flex gap-2">
      <Button onClick={generateMaze}>Generate</Button>
      <Button onClick={solveMaze}>Solve</Button>
      <Button onClick={showSolution}>Show Solution</Button>
      <Button onClick={exportImage}>Export</Button>
    </div>
  );


  const Controls = () => {
    const sliderConfigs = {
      square: [
        { label: "Rows", value: rows, onChange: setRows },
        { label: "Columns", value: columns, onChange: setColumns }
      ],
      circular: [
        { label: "Rings", value: rows, onChange: setRows },
        { label: "Sectors", value: columns, onChange: setColumns }
      ],
      polygon: [
        { label: "Number of Sides", value: polygonSides, onChange: handlePolygonSidesChange, min: 3, max: 10, step: 1 },
        { label: "Rows", value: rows, onChange: setRows },
        { label: "Columns", value: columns, onChange: setColumns }
      ]
    };

    return (
      <Card className="h-full">
        <CardContent className="p-6 bg-background relative z-10">
          <div className="space-y-6">
            {/* Basic Controls - Always visible */}
            <div className="flex flex-col gap-6">
              <div>
                <label className="block mb-2 font-medium">Frame Type</label>
                <Select value={frameType} onValueChange={setFrameType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select frame type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="square">Square/Rectangle</SelectItem>
                    <SelectItem value="polygon">Polygon</SelectItem>
                    <SelectItem value="circular">Circular</SelectItem>
                    <SelectItem value="text">Text</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block mb-2 font-medium">Algorithm</label>
                <Select value={algorithm} onValueChange={handleAlgorithmChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select algorithm" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="binary">Binary Tree</SelectItem>
                    <SelectItem value="sidewinder">Sidewinder</SelectItem>
                    <SelectItem value="recursive-backtracker">
                      Recursive Backtracker (DFS)
                    </SelectItem>
                    <SelectItem value="prims">Prim's Algorithm</SelectItem>
                    <SelectItem value="recursive-division">
                      Recursive Division
                    </SelectItem>
                    <SelectItem value="hunt-and-kill">Hunt and Kill</SelectItem>
                  </SelectContent>
                </Select>
                <div className="mt-2 text-sm text-gray-600 whitespace-pre-line">
                  {getAlgorithmDescription(algorithm)}
                </div>
              </div>
            </div>

            {/* Collapsible Sections */}
            <Accordion type="multiple" defaultValue={["solving", "appearance", "characteristics"]} className="space-y-4">


              {/* Appearance Section */}
              <AccordionItem value="appearance" className="border-t">
                <AccordionTrigger className="text-lg font-medium">Appearance</AccordionTrigger>
                <AccordionContent>
                  <div className="pt-4 space-y-4">
                    {sliderConfigs[frameType]?.map(({ label, ...props }, index) => (
                      <NumberSlider
                        key={index}
                        label={label}
                        min={props.min ?? 5}
                        max={props.max ?? 80}
                        {...props}
                      />
                    ))}
                    {frameType === 'text' && (
                      <div>
                        <label className="block mb-2 font-small">Text</label>
                        <Input
                          value={text}
                          onChange={(e) => setText(e.target.value.toUpperCase())}
                          maxLength={10}
                        />
                      </div>
                    )}
                    <NumberSlider
                      label="Cell Size"
                      value={cellSize}
                      onChange={setCellSize}
                      min={10}
                      max={80}
                    />

                    <NumberSlider
                      label="Wall Thickness"
                      value={wallThickness}
                      onChange={setWallThickness}
                      min={1}
                      max={10}
                    />

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="show-arrows"
                        checked={showArrows}
                        onCheckedChange={(checked: boolean) => setShowArrows(checked)}
                      />
                      <label
                        htmlFor="show-arrows"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Show Entrance/Exit Arrows
                      </label>
                    </div>

                    <div className="flex gap-4 items-center">
                      <div className="flex-1">
                        <label className="block mb-2 font-small">Wall</label>
                        <Input
                          type="color"
                          value={wallColor}
                          onChange={(e) => setWallColor(e.target.value)}
                          className="h-10 w-full"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block mb-2 font-small">Background</label>
                        <Input
                          type="color"
                          value={backgroundColor}
                          onChange={(e) => setBackgroundColor(e.target.value)}
                          className="h-10 w-full"
                        />
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Maze Generation Section */}
              <AccordionItem value="characteristics" className="border-t">
                <AccordionTrigger className="text-lg font-medium">Maze Generation</AccordionTrigger>
                <AccordionContent>
                  <div className="pt-4 space-y-4">
                    {getAlgorithmSettings(algorithm).includes('Horizontal Bias') && (
                      <NumberSlider
                        label="Horizontal Bias (%)"
                        value={mazeSettings.horizontalBias}
                        onChange={(value) => handleMazeSettingChange('horizontalBias', value)}
                        min={0}
                        max={100}
                        step={1}
                      />
                    )}

                    {getAlgorithmSettings(algorithm).includes('Branching Probability') && (
                      <NumberSlider
                        label="Branching Probability (%)"
                        value={mazeSettings.branchingProbability}
                        onChange={(value) => handleMazeSettingChange('branchingProbability', value)}
                        min={30}
                        max={100}
                        step={1}
                      />
                    )}

                    {getAlgorithmSettings(algorithm).includes('Dead End Density') && (
                      <NumberSlider
                        label="Dead End Density (%)"
                        value={mazeSettings.deadEndDensity}
                        onChange={(value) => handleMazeSettingChange('deadEndDensity', value)}
                        min={0}
                        max={100}
                        step={1}
                      />
                    )}

                    <div className="space-y-4">
                      <div>
                        <label className="block mb-2 font-small">Entrance Position</label>
                        <Select
                          value={mazeSettings.entrancePosition}
                          onValueChange={(value: any) => setMazeSettings(prev => ({
                            ...prev,
                            entrancePosition: value
                          }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select entrance position" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="north">North</SelectItem>
                            <SelectItem value="south">South</SelectItem>
                            <SelectItem value="east">East</SelectItem>
                            <SelectItem value="west">West</SelectItem>
                            <SelectItem value="random">Random</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="block mb-2 font-small">Exit Position</label>
                        <Select
                          value={mazeSettings.exitPosition}
                          onValueChange={(value: any) => setMazeSettings(prev => ({
                            ...prev,
                            exitPosition: value
                          }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select exit position" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="north">North</SelectItem>
                            <SelectItem value="south">South</SelectItem>
                            <SelectItem value="east">East</SelectItem>
                            <SelectItem value="west">West</SelectItem>
                            <SelectItem value="random">Random</SelectItem>
                            <SelectItem value="farthest">Farthest from Entrance</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="block mb-2 font-small">Symmetry</label>
                        <Select
                          value={mazeSettings.symmetry}
                          onValueChange={(value: any) => setMazeSettings(prev => ({
                            ...prev,
                            symmetry: value
                          }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select symmetry type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            <SelectItem value="horizontal">Horizontal</SelectItem>
                            <SelectItem value="vertical">Vertical</SelectItem>
                            <SelectItem value="both">Both</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>


              {/* Solving Section */}
              <AccordionItem value="solving" className="border-t">
                <AccordionTrigger className="text-lg font-medium">Solving</AccordionTrigger>
                <AccordionContent>
                  <div className="pt-4 space-y-4">
                    <NumberSlider
                      label="Animation Speed"
                      value={solveSpeed}
                      onChange={setSolveSpeed}
                      min={1}
                      max={100}
                      step={1}
                    />
                    {/* 
                    <div className="text-sm text-gray-600">
                      Adjust the speed of the maze solving animation and the color of the solution path
                    </div> */}
                    {/* Add color picker for solution line */}
                    <div>
                      <label className="block mb-2 font-small">Solution Color</label>
                      <Input
                        type="color"
                        value={solutionColor}
                        onChange={(e) => setSolutionColor(e.target.value)}
                        className="h-10 w-full"
                      />
                    </div>

                  </div>
                </AccordionContent>
              </AccordionItem>

            </Accordion>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div
        className={`
          fixed top-0 left-0 h-full bg-white shadow-lg
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          w-80 z-10
        `}
      >
        <div className="h-full overflow-y-auto">
          <Controls />
        </div>

        <button
          className={`
            absolute top-1/2 -translate-y-1/2
            right-0 transform translate-x-full
            bg-white rounded-r-lg p-2 shadow-md hover:bg-gray-50
          `}
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
      </div>

      {/* Main content */}
      <div className={`flex-1 p-4 transition-all duration-300 ease-in-out ${isOpen ? 'ml-80' : 'ml-0'}`}>
        <div className="h-full border rounded-lg bg-white p-4 flex items-center justify-center relative">
          <ActionButtons />
          <canvas
            ref={canvasRef}
            width={columns * cellSize + (2 * getArrowPadding(cellSize))}
            height={rows * cellSize + (2 * getArrowPadding(cellSize))}
            style={{
              backgroundColor,
              margin: -getArrowPadding(cellSize)
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default MazeGenerator;