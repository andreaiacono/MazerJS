import { useCallback } from 'react';
import { Cell, FrameType, Position } from '../utils/types';
import { drawLine, drawArrow, getArrowPadding } from '../utils/helpers/drawing';
import { isPointInPolygon, getPolygonPoints, distanceToLineSegment } from '../utils/helpers/geometryHelpers';

export const useMazeDrawing = () => {

  const drawMaze = useCallback((
    ctx: CanvasRenderingContext2D,
    maze: Cell[][],
    frameType: FrameType,
    options: {
      rows: number;
      columns: number;
      sides: number;
      cellSize: number;
      wallColor: string;
      backgroundColor: string;
      wallThickness: number;
      showArrows: boolean;
      solutionColor: string;
      solutionPath?: Position[];
    }
  ) => {

    const drawSquareMaze = (ctx: CanvasRenderingContext2D,
      maze: Cell[][],
      rows: number,
      columns: number,
      cellSize: number,
      solutionColor: string,
      arrowColor: string,
      showArrows: boolean) => {

      for (let row = 0; row < maze.length; row++) {
        if (!maze[row]) continue;

        for (let col = 0; col < maze[row].length; col++) {
          const cell = maze[row][col];
          const x = col * cellSize;
          const y = row * cellSize;

          if (cell.northWall) drawLine(ctx, x, y, x + cellSize, y);
          if (cell.eastWall) drawLine(ctx, x + cellSize, y, x + cellSize, y + cellSize);
          if (cell.southWall) drawLine(ctx, x, y + cellSize, x + cellSize, y + cellSize);
          if (cell.westWall) drawLine(ctx, x, y, x, y + cellSize);

          // Draw entrance/exit arrows if enabled
          if (showArrows) {
            const mazeWidth = columns * cellSize;
            const arrowLength = cellSize * 1.2;
            if (cell.isEntrance) {
              if (col === 0) {
                drawArrow(ctx, -arrowLength, y + arrowLength / 2, 0, y + arrowLength / 2, arrowColor);
              }
            }

            if (cell.isExit) {
              if (col === maze[row].length - 1) {
                drawArrow(ctx, mazeWidth, y + arrowLength / 2, mazeWidth + arrowLength, y + arrowLength / 2, arrowColor);
              }
            }
          }
        }
      }
    }

    const drawCircularMaze = (
      ctx: CanvasRenderingContext2D,
      maze: Cell[][],
      rows: number,
      columns: number,
      cellSize: number,
      wallColor: string,
      wallThickness: number,
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
                centerY + outerRadius * Math.sin(angle),
                wallColor
              );
            }
            if (cell.isExit) {
              drawArrow(
                ctx,
                centerX + outerRadius * Math.cos(angle),
                centerY + outerRadius * Math.sin(angle),
                centerX + (outerRadius + arrowLength) * Math.cos(angle),
                centerY + (outerRadius + arrowLength) * Math.sin(angle),
                wallColor
              );
            }
          }
        }
      }
    };

    const drawPolygonMaze = (
      ctx: CanvasRenderingContext2D,
      maze: Cell[][],
      rows: number,
      columns: number,
      sides: number,
      cellSize: number,
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
            point[1],
            wallColor
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
            point[1] - perpY * arrowLength,
            wallColor
          );
        }
      }
    };

    const drawTextMaze = (
      ctx: CanvasRenderingContext2D,
      maze: Cell[][],
      columns: number,
      cellSize: number,
      wallColor: string,
      wallThickness: number,
      showArrows: boolean,
      text: string,
      solutionColor: string,
      backgroundColor: string
    ) => {
      // Get text pixels for reference
      const pixels = getLetterPixels(text, { width: 400, height: 100 });

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
                row * cellSize + cellSize / 2,
                wallColor
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
                row * cellSize + cellSize / 2,
                wallColor
              );
            }
          }
        }
      }
    };

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
      // const totalWidth = letterWidths.reduce((a, b) => a + b, 0);
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

    const { rows, columns, sides, cellSize, wallColor, backgroundColor, wallThickness, solutionColor, solutionPath, showArrows } = options;
    const arrowPadding = getArrowPadding(cellSize);

    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.save();
    ctx.translate(arrowPadding, arrowPadding);

    ctx.strokeStyle = wallColor;
    ctx.lineWidth = wallThickness;
    ctx.fillStyle = backgroundColor;

    switch (frameType) {
      case 'circular':
        drawCircularMaze(ctx, maze, rows, columns, cellSize, wallColor, wallThickness, showArrows);
        break;
      case 'polygon':
        drawPolygonMaze(ctx, maze, rows, columns, sides, cellSize, wallColor, showArrows);
        break;
      case 'text':
        drawTextMaze(ctx, maze, columns, cellSize, wallColor, wallThickness, showArrows, "MAZE", "#00FF00", backgroundColor);
        break;
      default:
        drawSquareMaze(ctx, maze, rows, columns, cellSize, solutionColor, wallColor, showArrows);
    }

    // Draw solution path if it exists
    if (solutionPath?.length) {
      const drawSolutionPath = () => {
        if (!solutionPath.length) return;

        if (frameType === 'circular') {
          const rings = maze.length;
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
          let radius = (solutionPath[0].row + 2) * ringWidth - ringWidth / 2;
          let angle = (solutionPath[0].col + 0.5) * (2 * Math.PI / columns);
          let x = centerX + radius * Math.cos(angle);
          let y = centerY + radius * Math.sin(angle);

          // Draw each segment separately to allow different line widths
          for (let i = 1; i < solutionPath.length; i++) {
            const prev = solutionPath[i - 1];
            const current = solutionPath[i];

            radius = (current.row + 2) * ringWidth - ringWidth / 2;

            const circumferenceRatio = radius / maxRadius;
            ctx.lineWidth = Math.max(1, baseLineWidth * circumferenceRatio);

            ctx.beginPath();
            if (prev.row === current.row) {
              const prevAngle = (prev.col + 0.5) * (2 * Math.PI / columns);
              const currentAngle = (current.col + 0.5) * (2 * Math.PI / columns);

              let deltaAngle = currentAngle - prevAngle;
              if (deltaAngle > Math.PI) deltaAngle -= 2 * Math.PI;
              if (deltaAngle < -Math.PI) deltaAngle += 2 * Math.PI;

              x = centerX + radius * Math.cos(prevAngle);
              y = centerY + radius * Math.sin(prevAngle);
              ctx.moveTo(x, y);

              ctx.arc(
                centerX,
                centerY,
                radius,
                prevAngle,
                prevAngle + deltaAngle,
                deltaAngle < 0
              );
            } else {
              const angle = (current.col + 0.5) * (2 * Math.PI / columns);
              const prevRadius = (prev.row + 2) * ringWidth - ringWidth / 2;

              x = centerX + prevRadius * Math.cos(angle);
              y = centerY + prevRadius * Math.sin(angle);
              ctx.moveTo(x, y);

              x = centerX + radius * Math.cos(angle);
              y = centerY + radius * Math.sin(angle);
              ctx.lineTo(x, y);
            }
            ctx.stroke();
          }
        } else {
          ctx.strokeStyle = solutionColor;
          ctx.lineWidth = cellSize / 3;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';

          ctx.beginPath();
          solutionPath.forEach((pos, index) => {
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
      };

      drawSolutionPath();
    }

    ctx.restore();
  }, []);

  return {
    drawMaze,
  };
};