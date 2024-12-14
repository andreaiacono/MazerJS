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
