import React, { useRef, useEffect } from 'react';
import { Cell, FrameType, Position } from '../../utils/types';
import { getArrowPadding } from '../../utils/helpers/drawing';
import { useMazeDrawing } from '../../hooks/useMazeDrawing';
import { getMazeDimensions } from '../../utils/helpers/misc';

interface CanvasProps {
  maze: Cell[][];
  frameType: FrameType;
  rows: number;
  columns: number;
  cellSize: number;
  wallColor: string;
  backgroundColor: string;
  wallThickness: number;
  solutionColor: string
  showArrows: boolean;
  sides: number;
  solutionPath?: Position[];
  text: string;
  perpendicularWalls: boolean;
  letterSize: number;
  letterDistance: number;
  upperLetterConnector: boolean;
  lowerLetterConnector: boolean;
}

export const Canvas: React.FC<CanvasProps> = ({
  maze,
  frameType,
  rows,
  columns,
  cellSize,
  wallColor,
  backgroundColor,
  wallThickness,
  solutionColor,
  showArrows,
  sides,
  solutionPath,
  text,
  perpendicularWalls,
  letterSize,
  letterDistance,
  upperLetterConnector,
  lowerLetterConnector
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { drawMaze } = useMazeDrawing();

  const getCanvasDimensions = () => {
    const arrowPadding = getArrowPadding(cellSize);

    if (frameType === 'circular' || frameType === 'polygon') {
      return {
        width: 20 * cellSize + (2 * arrowPadding),
        height: 20 * cellSize + (2 * arrowPadding)
      };
    }
    else if (frameType === 'text') {
      const dimension = getMazeDimensions(letterSize, letterDistance, text)
      return {
        width: dimension.width * cellSize + (2 * arrowPadding),
        height: dimension.height * cellSize + (2 * arrowPadding)
      };
    }

    // For other frame types, use the original calculation
    return {
      width: columns * cellSize + (2 * arrowPadding),
      height: rows * cellSize + (2 * arrowPadding)
    };
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    const { width, height } = getCanvasDimensions();

    // Set canvas dimensions
    canvas.width = width;
    canvas.height = height;

    // Draw the maze using the drawMaze utility
    drawMaze(ctx, maze, frameType, {
      rows,
      columns,
      sides,
      cellSize,
      wallColor,
      backgroundColor,
      wallThickness,
      showArrows,
      solutionColor,
      solutionPath,
      text,
      perpendicularWalls
    });
  }, [maze, frameType, rows, columns, cellSize, wallColor, backgroundColor,
    wallThickness, showArrows, sides, solutionColor, drawMaze, solutionPath, text, perpendicularWalls]);

  const { width, height } = getCanvasDimensions();
  const arrowPadding = getArrowPadding(cellSize);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{
        backgroundColor,
        margin: 0,
        border: '5px solid #0F0',
      }}
    />
  );
};