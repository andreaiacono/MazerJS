import { ArrowDirection } from "../types";

export const getArrowPadding = (cellSize: number) => Math.max(cellSize * 1.7, 50);

export const drawLine = (
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number
) => {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
};

export const getArrowDirection = (
  row: number,
  col: number,
  mazeRows: number,
  mazeCols: number
): ArrowDirection => {
  if (row === 0) return 'up';
  if (row === mazeRows - 1) return 'down';
  if (col === 0) return 'left';
  if (col === mazeCols - 1) return 'right';
  
  const centerRow = Math.floor(mazeRows / 2);
  const centerCol = Math.floor(mazeCols / 2);
  const rowDist = Math.abs(row - centerRow);
  const colDist = Math.abs(col - centerCol);
  
  if (rowDist >= colDist) {
    return row < centerRow ? 'up' : 'down';
  } else {
    return col < centerCol ? 'left' : 'right';
  }
};

interface ArrowPoints {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
}

export const drawArrowShape = (
  ctx: CanvasRenderingContext2D,
  points: ArrowPoints,
  arrowSize: number,
  color: string
) => {
  const { fromX, fromY, toX, toY } = points;
  const originalWidth = ctx.lineWidth;
  const headLength = arrowSize / 2;
  const angle = Math.atan2(toY - fromY, toX - fromX);

  ctx.strokeStyle = color;
  ctx.lineWidth = 2;

  // Draw arrow shaft
  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(toX, toY);
  ctx.stroke();

  // Draw arrow head
  ctx.beginPath();
  ctx.moveTo(toX, toY);
  ctx.lineTo(
    toX - headLength * Math.cos(angle - Math.PI / 6),
    toY - headLength * Math.sin(angle - Math.PI / 6)
  );
  ctx.moveTo(toX, toY);
  ctx.lineTo(
    toX - headLength * Math.cos(angle + Math.PI / 6),
    toY - headLength * Math.sin(angle + Math.PI / 6)
  );
  ctx.stroke();

  ctx.lineWidth = originalWidth;
};

export const drawArrow = (
  ctx: CanvasRenderingContext2D,
  row: number,
  col: number,
  cellSize: number,
  isEntrance: boolean,
  color: string,
  mazeRows: number,
  mazeCols: number,
  arrowDirection: ArrowDirection = getArrowDirection(row, col, mazeRows, mazeCols)
) => {
  const centerX = (col + 0.5) * cellSize;
  const centerY = (row + 0.5) * cellSize;
  const arrowSize = Math.max(20, cellSize * 0.6);
  const arrowDistance = 10;
  
  const isBorderCell = row === 0 || row === mazeRows - 1 || col === 0 || col === mazeCols - 1;
  const offset = isBorderCell ? arrowDistance : cellSize / 4;

  let points: ArrowPoints = { fromX: 0, fromY: 0, toX: 0, toY: 0 };

  switch (arrowDirection) {
    case 'up':
      points = {
        fromX: centerX,
        toX: centerX,
        fromY: isEntrance ? centerY - arrowSize - offset : centerY - offset,
        toY: isEntrance ? centerY - offset : centerY - arrowSize - offset
      };
      break;
    case 'down':
      points = {
        fromX: centerX,
        toX: centerX,
        fromY: isEntrance ? centerY + arrowSize + offset : centerY + offset,
        toY: isEntrance ? centerY + offset : centerY + arrowSize + offset
      };
      break;
    case 'left':
      const rightOffset = cellSize;
      points = {
        fromY: centerY,
        toY: centerY,
        fromX: isEntrance ? centerX + rightOffset - arrowSize - offset : centerX + rightOffset - offset,
        toX: isEntrance ? centerX + rightOffset - offset : centerX + rightOffset - arrowSize - offset
      };
      break;
    case 'right':
      const leftOffset = -cellSize;
      points = {
        fromY: centerY,
        toY: centerY,
        fromX: isEntrance ? centerX + leftOffset + arrowSize + offset : centerX + leftOffset + offset,
        toX: isEntrance ? centerX + leftOffset + offset : centerX + leftOffset + arrowSize + offset
      };
      break;
  }

  drawArrowShape(ctx, points, arrowSize, color);
};