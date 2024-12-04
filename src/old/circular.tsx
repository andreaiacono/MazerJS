// import React from 'react';
// import {
//     drawArrow, 
//   } from './main';
  

// const getCircularPoints = (rings: number, sectors: number, radius: number, centerX: number, centerY: number) => {
//   const points: { ring: number; sector: number; x: number; y: number }[] = [];
//   const ringSpacing = radius / rings;

//   for (let ring = 0; ring <= rings; ring++) {
//     const currentRadius = ring * ringSpacing;
//     for (let sector = 0; sector < sectors; sector++) {
//       const angle = (sector * 2 * Math.PI) / sectors;
//       const x = centerX + currentRadius * Math.cos(angle);
//       const y = centerY + currentRadius * Math.sin(angle);
//       points.push({ ring, sector, x, y });
//     }
//   }
//   return points;
// };

// const adjustCellsToCircular = (
//   maze: Cell[][],
//   rows: number,
//   columns: number,
//   cellSize: number,
//   settings: MazeSettings
// ): Cell[][] => {
//   const newMaze = JSON.parse(JSON.stringify(maze));
//   const centerX = (columns * cellSize) / 2;
//   const centerY = (rows * cellSize) / 2;
//   const maxRadius = Math.min(centerX, centerY);
  
//   // Number of rings and sectors based on maze size
//   const rings = Math.floor(rows / 2);
//   const sectors = columns;
  
//   const points = getCircularPoints(rings, sectors, maxRadius, centerX, centerY);
  
//   // Map rectangular grid cells to circular grid
//   for (let row = 0; row < rows; row++) {
//     for (let col = 0; col < columns; col++) {
//       const x = col * cellSize + cellSize / 2;
//       const y = row * cellSize + cellSize / 2;
      
//       // Calculate polar coordinates
//       const dx = x - centerX;
//       const dy = y - centerY;
//       const distance = Math.sqrt(dx * dx + dy * dy);
//       const angle = Math.atan2(dy, dx);
      
//       // Determine if cell is within circular maze
//       const ring = Math.floor((distance / maxRadius) * rings);
//       if (ring >= rings) {
//         // Cell is outside circular maze
//         newMaze[row][col].northWall = false;
//         newMaze[row][col].southWall = false;
//         newMaze[row][col].eastWall = false;
//         newMaze[row][col].westWall = false;
//         continue;
//       }
      
//       // Map angle to sector
//       const sector = Math.floor(((angle + Math.PI) / (2 * Math.PI)) * sectors);
      
//       // Adjust walls based on circular grid
//       const isRadialWall = Math.abs(angle - (sector * 2 * Math.PI) / sectors) < 0.1;
//       const isCircularWall = Math.abs(distance - ring * (maxRadius / rings)) < cellSize / 2;
      
//       newMaze[row][col].northWall = isCircularWall;
//       newMaze[row][col].southWall = isCircularWall;
//       newMaze[row][col].eastWall = isRadialWall;
//       newMaze[row][col].westWall = isRadialWall;
//     }
//   }
  
//   // Add entrance and exit
//   const entranceRing = 0;
//   const entranceSector = 0;
//   const exitRing = rings - 1;
//   const exitSector = Math.floor(sectors / 2);
  
//   // Find corresponding cells for entrance and exit
//   const entranceCell = points.find(p => p.ring === entranceRing && p.sector === entranceSector);
//   const exitCell = points.find(p => p.ring === exitRing && p.sector === exitSector);
  
//   if (entranceCell && exitCell) {
//     const entranceRow = Math.floor(entranceCell.y / cellSize);
//     const entranceCol = Math.floor(entranceCell.x / cellSize);
//     const exitRow = Math.floor(exitCell.y / cellSize);
//     const exitCol = Math.floor(exitCell.x / cellSize);
    
//     newMaze[entranceRow][entranceCol].isEntrance = true;
//     newMaze[exitRow][exitCol].isExit = true;
//     // Remove appropriate walls for entrance/exit
//     newMaze[entranceRow][entranceCol].northWall = false;
//     newMaze[exitRow][exitCol].southWall = false;
//   }
  
//   return newMaze;
// };

// const drawCircularMaze = (
//   ctx: CanvasRenderingContext2D,
//   maze: Cell[][],
//   rows: number,
//   columns: number,
//   cellSize: number,
//   settings: MazeSettings,
//   wallColor: string,
//   showArrows: boolean
// ) => {
//   const centerX = (columns * cellSize) / 2;
//   const centerY = (rows * cellSize) / 2;
//   const maxRadius = Math.min(centerX, centerY);
//   const rings = Math.floor(rows / 2);
//   const sectors = columns;
  
//   ctx.strokeStyle = wallColor;
//   ctx.fillStyle = wallColor;
  
//   // Draw circular walls
//   for (let ring = 0; ring <= rings; ring++) {
//     const radius = (ring * maxRadius) / rings;
//     ctx.beginPath();
//     ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
//     ctx.stroke();
//   }
  
//   // Draw radial walls
//   for (let sector = 0; sector < sectors; sector++) {
//     const angle = (sector * 2 * Math.PI) / sectors;
//     ctx.beginPath();
//     ctx.moveTo(centerX, centerY);
//     ctx.lineTo(
//       centerX + maxRadius * Math.cos(angle),
//       centerY + maxRadius * Math.sin(angle)
//     );
//     ctx.stroke();
//   }
  
//   // Draw entrance/exit arrows if enabled
//   if (showArrows) {
//     const arrowLength = cellSize * 2;
//     // Entrance arrow
//     const entranceAngle = 0;
//     drawArrow(
//       ctx,
//       centerX + (maxRadius + arrowLength) * Math.cos(entranceAngle),
//       centerY + (maxRadius + arrowLength) * Math.sin(entranceAngle),
//       centerX + maxRadius * Math.cos(entranceAngle),
//       centerY + maxRadius * Math.sin(entranceAngle)
//     );
    
//     // Exit arrow
//     const exitAngle = Math.PI;
//     drawArrow(
//       ctx,
//       centerX + maxRadius * Math.cos(exitAngle),
//       centerY + maxRadius * Math.sin(exitAngle),
//       centerX + (maxRadius + arrowLength) * Math.cos(exitAngle),
//       centerY + (maxRadius + arrowLength) * Math.sin(exitAngle)
//     );
//   }
// };

// export { adjustCellsToCircular, drawCircularMaze };