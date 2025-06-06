import { useCallback } from 'react';
import { Cell, FrameType, Position } from '../utils/types';
import { drawArrow, drawLine, getArrowPadding, drawArrowShape } from '../utils/helpers/drawing';

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
      text: string;
      perpendicularWalls: boolean;
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
                drawArrow(ctx, row, col, cellSize, true, arrowColor, maze.length, maze[row].length);
            }
            if (cell.isExit) {
                drawArrow(ctx, row, col, cellSize, false, arrowColor, maze.length, maze[row].length);
            }
          }
        }
      }
    }

    const drawPolygonMaze = (
      ctx: CanvasRenderingContext2D,
      maze: Cell[][],
      rows: number,
      columns: number,
      sides: number,
      cellSize: number,
      options: {
        wallColor: string;
        backgroundColor: string;
        wallThickness: number;
        showArrows: boolean;
        solutionColor: string;
        solutionPath?: Position[];
        perpendicularWalls?: boolean;
      }
    ) => {
      const { wallColor, wallThickness, showArrows, perpendicularWalls = false } = options;

      ctx.strokeStyle = wallColor;
      ctx.lineWidth = wallThickness;

      const centerX = ctx.canvas.width / 2;
      const centerY = ctx.canvas.height / 2;

      const rings = maze.length;
      const maxRadius = Math.min(centerX, centerY) * 0.8;
      const ringWidth = maxRadius / (rings + 1);
      const totalCells = maze[0]?.length || 0;

      const getPointOnRing = (radius: number, progress: number): [number, number] => {
        const sideProgress = progress * sides;
        const currentSide = Math.floor(sideProgress);
        const progressInSide = sideProgress - currentSide;

        const startAngle = (currentSide * 2 * Math.PI / sides) - (Math.PI / 2);
        const endAngle = ((currentSide + 1) * 2 * Math.PI / sides) - (Math.PI / 2);

        const startX = centerX + radius * Math.cos(startAngle);
        const startY = centerY + radius * Math.sin(startAngle);
        const endX = centerX + radius * Math.cos(endAngle);
        const endY = centerY + radius * Math.sin(endAngle);

        return [
          startX + (endX - startX) * progressInSide,
          startY + (endY - startY) * progressInSide
        ];
      };

      // Draw inner polygon
      const innerRadius = ringWidth;
      ctx.beginPath();
      for (let i = 0; i <= sides; i++) {
        const progress = i / sides;
        const [x, y] = getPointOnRing(innerRadius, progress);
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();

      // Draw each ring of the maze
      for (let ring = 0; ring < rings; ring++) {
        const currentRadius = (ring + 2) * ringWidth;

        // First draw all circumferential (ring) walls
        for (let cell = 0; cell < totalCells; cell++) {
          const currentCell = maze[ring][cell];
          if (!currentCell) continue;

          const cellProgress = cell / totalCells;
          const nextCellProgress = (cell + 1) / totalCells;

          const outerStart = getPointOnRing(currentRadius, cellProgress);
          const outerEnd = getPointOnRing(currentRadius, nextCellProgress);
          const innerStart = getPointOnRing(currentRadius - ringWidth, cellProgress);
          const innerEnd = getPointOnRing(currentRadius - ringWidth, nextCellProgress);

          // Draw circumferential wall (along the ring)
          if (currentCell.southWall) {
            ctx.beginPath();
            ctx.moveTo(...outerStart);
            ctx.lineTo(...outerEnd);
            ctx.stroke();
          }
        }

        // Then draw all radial (east) walls
        for (let cell = 0; cell < totalCells; cell++) {
          const currentCell = maze[ring][cell];
          if (!currentCell?.eastWall) continue;

          const cellProgress = cell / totalCells;
          const nextCellProgress = (cell + 1) / totalCells;

          const outerStart = getPointOnRing(currentRadius, cellProgress);
          const outerEnd = getPointOnRing(currentRadius, nextCellProgress);
          const innerStart = getPointOnRing(currentRadius - ringWidth, cellProgress);
          const innerEnd = getPointOnRing(currentRadius - ringWidth, nextCellProgress);

          // if (perpendicularWalls) {          
          if (false) {
            // Calculate tangent vector along the ring wall
            const dirX = outerEnd[0] - outerStart[0];
            const dirY = outerEnd[1] - outerStart[1];

            // Calculate normalized perpendicular vector
            const length = Math.sqrt(dirX * dirX + dirY * dirY);
            const perpX = -dirY / length;
            const perpY = dirX / length;

            // Connect outer ring wall to inner ring wall along the perpendicular direction
            ctx.beginPath();
            ctx.moveTo(...outerEnd);
            // Project the point inward to intersect with the inner ring
            const intersectX = outerEnd[0] + perpX * ringWidth * 0.866; // cos(30°) ≈ 0.866
            const intersectY = outerEnd[1] + perpY * ringWidth * 0.866;
            ctx.lineTo(intersectX, intersectY);
            ctx.stroke();
          } else {
            // Original radial walls
            ctx.beginPath();
            ctx.moveTo(...outerEnd);
            ctx.lineTo(...innerEnd);
            ctx.stroke();
          }
        }
      }

      // Draw entrance/exit arrows if enabled
      // if (showArrows) {
      //   const arrowLength = ringWidth * 0.8;
      //   const entranceRadius = (rings + 1) * ringWidth;
      //   const exitRadius = ringWidth;

      //   for (let cell = 0; cell < totalCells; cell++) {
      //     const progress = (cell + 0.5) / totalCells;

      //     if (maze[rings - 1][cell]?.isEntrance) {
      //       const [x, y] = getPointOnRing(entranceRadius, progress);
      //       const [baseX, baseY] = getPointOnRing(entranceRadius - ringWidth, progress);

      //       drawArrow(
      //         ctx,
      //         x,
      //         y,
      //         baseX,
      //         baseY,
      //         wallColor
      //       );
      //     }

      //     if (maze[0][cell]?.isExit) {
      //       const [baseX, baseY] = getPointOnRing(exitRadius, progress);
      //       const angle = Math.atan2(baseY - centerY, baseX - centerX);

      //       drawArrow(
      //         ctx,
      //         baseX,
      //         baseY,
      //         baseX - arrowLength * Math.cos(angle),
      //         baseY - arrowLength * Math.sin(angle),
      //         wallColor
      //       );
      //     }
      //   }
      // }
    };

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

      // Use fixed canvas size of 20 cells for positioning
      const fixedSize = 20 * cellSize;
      const centerX = fixedSize / 2;
      const centerY = fixedSize / 2;

      const rings = maze.length;
      const sectors = maze[0].length;
      const maxRadius = Math.min(centerX, centerY) * 0.8;
      const ringWidth = maxRadius / (rings + 1);


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

        if (cell.isEntrance || cell.isExit) {
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
              // drawArrow(ctx, 0, sector, cellSize, false, wallColor, rows, columns, 'right');
              const points = {
                fromY: centerY + (outerRadius + arrowLength) * Math.sin(angle),
                toY: centerY + outerRadius * Math.sin(angle) + cellSize/2,
                fromX:  centerX + (outerRadius + arrowLength) * Math.cos(angle),
                toX: centerX + outerRadius * Math.cos(angle),
              };   
              drawArrowShape(
                ctx,
                points,
                Math.max(20, cellSize * 0.6),
                wallColor
              );
            }
            if (cell.isExit) {
              const points = {
                fromY: centerY + outerRadius * Math.sin(angle) - cellSize/2,
                toY: centerY + (outerRadius + arrowLength) * Math.sin(angle),
                fromX:  centerX + outerRadius * Math.cos(angle),
                toX: centerX + (outerRadius + arrowLength) * Math.cos(angle),
              };   
              drawArrowShape(
                ctx,
                points,
                Math.max(20, cellSize * 0.6),
                wallColor
              );
            }
          }
        }
      }
    };

    const drawTextMaze = (
      ctx: CanvasRenderingContext2D,
      maze: Cell[][],
      options: {
        effectiveRows: number;
        effectiveColumns: number;
        cellSize: number;
        solutionColor: string;
        wallColor: string;
        showArrows: boolean;
      }) => {     const { effectiveRows, effectiveColumns, cellSize, solutionColor, showArrows } = options;
    
      if (maze == null) {
        return;
      }
      // console.log("rows", rows, "coils", columns, "maze", maze)
      // Draw only the walls for cells that are part of the text
      for (let row = 0; row < maze.length; row++) {
        if (!maze[row]) continue;
        for (let col = 0; col < maze[row].length; col++) {
          const cell = maze[row][col];
          if (!cell.visited) continue;  // Skip cells that aren't part of the text
    
          const x = col * cellSize;
          const y = row * cellSize;
    
          // Draw walls
          if (cell.northWall) drawLine(ctx, x, y, x + cellSize, y);
          if (cell.eastWall) drawLine(ctx, x + cellSize, y, x + cellSize, y + cellSize);
          if (cell.southWall) drawLine(ctx, x, y + cellSize, x + cellSize, y + cellSize);
          if (cell.westWall) drawLine(ctx, x, y, x, y + cellSize);
    
          // Draw entrance/exit arrows if enabled
          if (showArrows) {
            if (cell.isEntrance) {
              drawArrow(ctx, row, col-2, cellSize, true, wallColor, rows, columns, 'left');
            }
            if (cell.isExit) {
              drawArrow(ctx, row, col+2, cellSize, false, wallColor, rows, columns, 'right');
            }
          }
        }
      }
    };

    const { rows, columns, sides, cellSize, wallColor, backgroundColor,
      wallThickness, showArrows, solutionColor, solutionPath, text, perpendicularWalls } = options;
    const arrowPadding = getArrowPadding(cellSize);

    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.save();
    if (frameType != 'text') {
      ctx.translate(arrowPadding, arrowPadding);
    }

    ctx.strokeStyle = wallColor;
    ctx.lineWidth = wallThickness;
    ctx.fillStyle = backgroundColor;

    switch (frameType) {
      case 'circular':
        drawCircularMaze(ctx, maze, rows, columns, cellSize, wallColor, wallThickness, showArrows);
        break;
      case 'polygon':
        drawPolygonMaze(ctx, maze, rows, columns, sides, cellSize, {
          wallColor,
          backgroundColor,
          wallThickness,
          showArrows,
          solutionColor,
          solutionPath,
          perpendicularWalls
        });
        break;
      case 'text':
        const letterWidth = 15
        const letterHeight = letterWidth * 2
        const effectiveRows = letterHeight * 1.2
        const effectiveColumns = letterWidth * text.length * 1.2
        drawTextMaze(ctx, maze, {
          effectiveRows,
          effectiveColumns,
          cellSize,
          solutionColor,
          wallColor,
          showArrows
        });
        break;
      default:
        drawSquareMaze(ctx, maze, rows, columns, cellSize, solutionColor, wallColor, showArrows);
    }

    // Draw solution path if it exists
    if (solutionPath?.length) {
      const drawSolutionPath = () => {
        if (!solutionPath.length) return;

        if (frameType === 'circular') {
          // Use fixed canvas size of 20 cells for positioning
          const fixedSize = 20 * cellSize;
          const centerX = fixedSize / 2;
          const centerY = fixedSize / 2;

          const rings = maze.length;
          // const sectors = maze[0].length;
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
        } 
        else if (frameType === 'polygon') {
          const centerX = ctx.canvas.width / 2;
          const centerY = ctx.canvas.height / 2;
          const rings = maze.length;
          const maxRadius = Math.min(centerX, centerY) * 0.8;
          const ringWidth = maxRadius / (rings + 1);
          const totalCells = maze[0]?.length || 0;
          const baseLineWidth = ringWidth / 3;

          ctx.strokeStyle = solutionColor;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';

          const getPointOnRing = (radius: number, progress: number, isRadial: boolean = false): [number, number] => {
            const sideProgress = progress * sides;
            const currentSide = Math.floor(sideProgress);
            const progressInSide = sideProgress - currentSide;
            const angleOffset = isRadial ? Math.PI / (sides * 8) : 0;
            const startAngle = (currentSide * 2 * Math.PI / sides) - (Math.PI / 2) + angleOffset;
            const endAngle = ((currentSide + 1) * 2 * Math.PI / sides) - (Math.PI / 2) + angleOffset;
            const startX = centerX + radius * Math.cos(startAngle);
            const startY = centerY + radius * Math.sin(startAngle);
            const endX = centerX + radius * Math.cos(endAngle);
            const endY = centerY + radius * Math.sin(endAngle);
            
            return [
              startX + (endX - startX) * progressInSide,
              startY + (endY - startY) * progressInSide
            ];
          };
          

          for (let i = 1; i < solutionPath.length; i++) {
            const prev = solutionPath[i - 1];
            const current = solutionPath[i];

            ctx.beginPath();

            if (prev.row === current.row) {
              const currentRadius = (current.row + 2) * ringWidth - ringWidth / 2;
              const prevProgress = (prev.col + 0.5) / totalCells;
              const currentProgress = (current.col + 0.5) / totalCells;

              const circumferenceRatio = currentRadius / maxRadius;
              ctx.lineWidth = Math.max(1, baseLineWidth * circumferenceRatio);

              const steps = 10;
              const progressDelta = (currentProgress - prevProgress) / steps;

              const [startX, startY] = getPointOnRing(currentRadius, prevProgress);
              ctx.moveTo(startX, startY);

              for (let step = 1; step <= steps; step++) {
                const progress = prevProgress + progressDelta * step;
                const [x, y] = getPointOnRing(currentRadius, progress);
                ctx.lineTo(x, y);
              }
            } else {
              // For radial movement, stop at inner edge of next ring
              const currentRadius = (current.row + 2) * ringWidth - ringWidth / 1.8;
              const prevRadius = (prev.row + 2) * ringWidth - ringWidth / 1.8;
              const progress = current.col / totalCells;
              const [startX, startY] = getPointOnRing(prevRadius, progress, true);
              const [endX, endY] = getPointOnRing(currentRadius, progress, true);

              const circumferenceRatio = currentRadius / maxRadius;
              ctx.lineWidth = Math.max(1, baseLineWidth * circumferenceRatio);

              ctx.moveTo(startX, startY);
              ctx.lineTo(endX, endY);
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