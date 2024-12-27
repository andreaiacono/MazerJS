import { useCallback } from 'react';
import { Cell, FrameType, Position } from '../utils/types';
import { drawArrow, drawLine, getArrowPadding, getLetterPixels } from '../utils/helpers/drawing';
import { isPointInPolygon, getPolygonPoints, distanceToLineSegment } from '../utils/helpers/geometryHelpers';
// import { getLetterPixels } from './../utils/helpers/drawing'

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
      if (showArrows) {
        const arrowLength = ringWidth * 0.8;
        const entranceRadius = (rings + 1) * ringWidth;
        const exitRadius = ringWidth;
    
        for (let cell = 0; cell < totalCells; cell++) {
          const progress = (cell + 0.5) / totalCells;
          
          if (maze[rings - 1][cell]?.isEntrance) {
            const [x, y] = getPointOnRing(entranceRadius, progress);
            const [baseX, baseY] = getPointOnRing(entranceRadius - ringWidth, progress);
            
            drawArrow(
              ctx,
              x,
              y,
              baseX,
              baseY,
              wallColor
            );
          }
          
          if (maze[0][cell]?.isExit) {
            const [baseX, baseY] = getPointOnRing(exitRadius, progress);
            const angle = Math.atan2(baseY - centerY, baseX - centerX);
            
            drawArrow(
              ctx,
              baseX,
              baseY,
              baseX - arrowLength * Math.cos(angle),
              baseY - arrowLength * Math.sin(angle),
              wallColor
            );
          }
        }
      }
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

    const drawTextMaze = (
      ctx: CanvasRenderingContext2D,
      maze: Cell[][],
      options: {
        rows: number;
        columns: number;
        cellSize: number;
        wallColor: string;
        backgroundColor: string;
        wallThickness: number;
        solutionColor: string;
        showArrows: boolean;
        text: string;
      }
    ) => {
      const { cellSize, wallColor, wallThickness } = options;
      const pixels = getLetterPixels(options.text, { width: Math.max(10, 50 * options.text.length), height: options.rows });

      // Draw walls
      Array.from({ length: options.rows + 1 }, (_, y) =>
        Array.from({ length: options.columns + 1 }, (_, x) => {
          const shouldDrawHorizontal = y < options.rows && shouldShowWall(x, y, true, pixels);
          const shouldDrawVertical = x < options.columns && shouldShowWall(x, y, false, pixels);

          ctx.strokeStyle = wallColor;
          ctx.lineWidth = wallThickness;

          if (shouldDrawHorizontal && maze[y]?.[x]?.northWall) {
            ctx.beginPath();
            ctx.moveTo(x * cellSize, y * cellSize);
            ctx.lineTo((x + 1) * cellSize, y * cellSize);
            ctx.stroke();
          }

          if (shouldDrawVertical && maze[y]?.[x]?.westWall) {
            ctx.beginPath();
            ctx.moveTo(x * cellSize, y * cellSize);
            ctx.lineTo(x * cellSize, (y + 1) * cellSize);
            ctx.stroke();
          }
        })
      );

      // // Draw solution path if it exists
      // if (options.solutionPath?.length) {
      //   ctx.strokeStyle = options.solutionColor;
      //   ctx.lineWidth = cellSize / 3;
      //   ctx.lineCap = 'round';
      //   ctx.lineJoin = 'round';

      //   ctx.beginPath();
      //   options.solutionPath.forEach((pos, index) => {
      //     const x = (pos.col + 0.5) * cellSize;
      //     const y = (pos.row + 0.5) * cellSize;
      //     if (index === 0) ctx.moveTo(x, y);
      //     else ctx.lineTo(x, y);
      //   });
      //   ctx.stroke();
      // }
    };

    const shouldShowWall = (x: number, y: number, isHorizontal: boolean, pixels: Set<string>) => {
      if (isHorizontal) {
        return pixels.has(`${x},${y}`) || (y > 0 && pixels.has(`${x},${y - 1}`));
      } else {
        return pixels.has(`${x},${y}`) || (x > 0 && pixels.has(`${x - 1},${y}`));
      }
    };

    // const getLetterPixels = (text: string, dimensions: { width: number; height: number }) => {
    //   const canvas = document.createElement('canvas');
    //   const ctx = canvas.getContext('2d');
    //   if (!ctx) return new Set<string>();

    //   canvas.width = dimensions.width;
    //   canvas.height = dimensions.height;
    //   ctx.fillStyle = 'white';
    //   ctx.fillRect(0, 0, dimensions.width, dimensions.height);

    //   const fontSize = dimensions.height * 0.8;
    //   ctx.font = `900 ${fontSize}px "Times New Roman"`;

    //   const letterWidths = text.split('').map(l => ctx.measureText(l).width);
    //   // const totalWidth = letterWidths.reduce((a, b) => a + b, 0);
    //   const spacing = -fontSize * 0.08;
    //   const baseX = fontSize;

    //   text.split('').forEach((letter, i) => {
    //     const x = baseX + letterWidths.slice(0, i).reduce((a, b) => a + b, 0) + spacing * i;
    //     ctx.fillStyle = 'black';
    //     ctx.textBaseline = 'middle';
    //     ctx.fillText(letter, x, dimensions.height / 2);
    //   });

    //   const pixels = new Set<string>();
    //   const imageData = ctx.getImageData(0, 0, dimensions.width, dimensions.height);
    //   for (let y = 0; y < dimensions.height; y++) {
    //     for (let x = 0; x < dimensions.width; x++) {
    //       if (imageData.data[(y * dimensions.width + x) * 4] < 128) {
    //         pixels.add(`${x},${y}`);
    //       }
    //     }
    //   }
    //   return pixels;
    // };

    const { rows, columns, sides, cellSize, wallColor, backgroundColor,
      wallThickness, showArrows, solutionColor, solutionPath, text, perpendicularWalls } = options;
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
        drawTextMaze(ctx, maze, {
          rows,
          columns,
          cellSize,
          wallColor,
          backgroundColor,
          wallThickness,
          solutionColor,
          showArrows,
          text
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