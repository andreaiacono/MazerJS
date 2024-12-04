// import { Position } from '../types';

export const getArrowPadding = (cellSize: number) => Math.max(cellSize * 1.7, 20);

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

export const drawArrow = (
  ctx: CanvasRenderingContext2D,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  arrowColor: string,
  
) => {
  ctx.strokeStyle = arrowColor;
  const initialWidth = ctx.lineWidth
  ctx.lineWidth = 3
  const angle = Math.atan2(toY - fromY, toX - fromX);
  const headlen = (toX - fromX) / 3
  // Draw the line
  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(toX -headlen, toY);
  ctx.stroke();

  // Calculate arrowhead points
  const arrowX = toX - headlen * Math.cos(angle);
  const arrowY = toY - headlen * Math.sin(angle);

  // Draw the arrowhead
  ctx.beginPath();
  ctx.fillStyle = arrowColor;
  ctx.moveTo(toX, toY);
  ctx.lineTo(
    arrowX - headlen * Math.cos(angle - Math.PI / 6),
    arrowY - headlen * Math.sin(angle - Math.PI / 6)
  );
  ctx.lineTo(
    arrowX - headlen * Math.cos(angle + Math.PI / 6),
    arrowY - headlen * Math.sin(angle + Math.PI / 6)
  );
  ctx.lineTo(toX, toY); // Connect back to the tip
  ctx.closePath();
  ctx.fill();
  ctx.lineWidth = initialWidth
};