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
  color: string,
) => {
  const originalWidth = ctx.lineWidth
  const size = Math.abs(toX - fromX)
  fromX += size / 8
  toX -= size / 8

  const headLength = size / 2;
  const angle = Math.atan2(toY - fromY, toX - fromX);

  ctx.strokeStyle = color;
  ctx.lineWidth = 2

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

  ctx.lineWidth = originalWidth
};

export const getLetterPixels = (text: string, dimensions: { width: number; height: number }) => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return new Set<string>();

  canvas.width = dimensions.width;
  canvas.height = dimensions.height;
  
  // Clear background
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, dimensions.width, dimensions.height);

  // Set up text properties
  const fontSize = dimensions.height * 0.8;
  ctx.font = `900 ${fontSize}px "Times New Roman"`;
  ctx.textBaseline = 'middle';
  
  // Calculate text positioning
  const letterWidths = text.split('').map(l => ctx.measureText(l).width);
  // const totalWidth = letterWidths.reduce((a, b) => a + b, 0);
  const spacing = -fontSize * 0.08;
  const baseX = dimensions.width * 0.1; // 10% padding from left

  // Draw text with stroke effect
  text.split('').forEach((letter, i) => {
    const x = baseX + letterWidths.slice(0, i).reduce((a, b) => a + b, 0) + spacing * i;
    
    // Draw outlined text
    ctx.strokeStyle = 'black';
    ctx.lineWidth = fontSize * 0.15;  // Thicker outline
    ctx.strokeText(letter, x, dimensions.height/2);
    
    // Fill text
    ctx.fillStyle = 'black';
    ctx.fillText(letter, x, dimensions.height/2);
  });

  // Convert to pixel map
  const pixels = new Set<string>();
  const imageData = ctx.getImageData(0, 0, dimensions.width, dimensions.height);
  
  for (let y = 0; y < dimensions.height; y++) {
    for (let x = 0; x < dimensions.width; x++) {
      const idx = (y * dimensions.width + x) * 4;
      if (imageData.data[idx] < 128) {  // Check if pixel is dark
        pixels.add(`${x},${y}`);
      }
    }
  }

  return pixels;
};
