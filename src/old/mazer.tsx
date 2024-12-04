// import React, { useState } from 'react';

// type Cell = { x: number; y: number };
// type Wall = { x: number; y: number; isHorizontal: boolean };
// type MazeAlgorithm = 
//   'recursiveBacktracker' | 
//   'sidewinder' | 
//   'kruskal';

// const ALGORITHMS: Record<MazeAlgorithm, string> = {
//   recursiveBacktracker: 'Recursive Backtracker',
//   sidewinder: 'Sidewinder',
//   kruskal: "Kruskal's Algorithm"
// };

// const MazeCreator = () => {
//   const [width, setWidth] = useState(10);
//   const [height, setHeight] = useState(10);
//   const [walls, setWalls] = useState(new Set<string>());
//   const [algorithm, setAlgorithm] = useState<MazeAlgorithm>('recursiveBacktracker');
//   const [isGenerating, setIsGenerating] = useState(false);
//   const [isSolving, setIsSolving] = useState(false);
//   const [solution, setSolution] = useState<Set<string>>();
  
//   const cellSize = 30;
//   const padding = 20;
//   const svgWidth = width * cellSize + 2 * padding;
//   const svgHeight = height * cellSize + 2 * padding;

//   const getNeighbors = (cell: Cell): Array<[Cell, Wall]> => {
//     const neighbors: Array<[Cell, Wall]> = [];
//     if (cell.y > 0) {
//       neighbors.push([
//         { x: cell.x, y: cell.y - 1 },
//         { x: cell.x, y: cell.y, isHorizontal: true }
//       ]);
//     }
//     if (cell.y < height - 1) {
//       neighbors.push([
//         { x: cell.x, y: cell.y + 1 },
//         { x: cell.x, y: cell.y + 1, isHorizontal: true }
//       ]);
//     }
//     if (cell.x > 0) {
//       neighbors.push([
//         { x: cell.x - 1, y: cell.y },
//         { x: cell.x, y: cell.y, isHorizontal: false }
//       ]);
//     }
//     if (cell.x < width - 1) {
//       neighbors.push([
//         { x: cell.x + 1, y: cell.y },
//         { x: cell.x + 1, y: cell.y, isHorizontal: false }
//       ]);
//     }
//     return neighbors;
//   };

//   const initializeWalls = () => {
//     const newWalls = new Set<string>();
//     for (let y = 0; y <= height; y++) {
//       for (let x = 0; x <= width; x++) {
//         if (x < width) newWalls.add(`${x},${y},true`);
//         if (y < height) newWalls.add(`${x},${y},false`);
//       }
//     }
//     return newWalls;
//   };

//   const updateWalls = async (walls: Set<string>, counter: number) => {
//     if (counter % 5 === 0) {
//       setWalls(new Set(walls));
//       await new Promise(resolve => setTimeout(resolve, 10));
//     }
//   };

//   const generateRecursiveBacktracker = async () => {
//     const visited = new Set<string>();
//     const walls = initializeWalls();
//     const stack: Cell[] = [{ x: 0, y: 0 }];
//     visited.add('0,0');
//     let updateCounter = 0;

//     while (stack.length > 0) {
//       const current = stack[stack.length - 1];
//       const neighbors = getNeighbors(current)
//         .filter(([neighbor]) => !visited.has(`${neighbor.x},${neighbor.y}`));
      
//       if (neighbors.length === 0) {
//         stack.pop();
//         continue;
//       }

//       const [neighbor, wall] = neighbors[Math.floor(Math.random() * neighbors.length)];
//       visited.add(`${neighbor.x},${neighbor.y}`);
//       walls.delete(`${wall.x},${wall.y},${wall.isHorizontal}`);
      
//       updateCounter++;
//       await updateWalls(walls, updateCounter);
      
//       stack.push(neighbor);
//     }

//     return walls;
//   };

//   const generateSidewinder = async () => {
//     const walls = initializeWalls();
//     let updateCounter = 0;

//     for (let y = 0; y < height; y++) {
//       let runStart = 0;
      
//       for (let x = 0; x < width; x++) {
//         updateCounter++;
        
//         const shouldCloseRun = x === width - 1 || 
//           (y > 0 && Math.random() < 0.5);

//         if (shouldCloseRun && y > 0) {
//           const carveX = runStart + Math.floor(Math.random() * (x - runStart + 1));
//           walls.delete(`${carveX},${y},true`);
//           runStart = x + 1;
//         } else if (x < width - 1) {
//           walls.delete(`${x+1},${y},false`);
//         }

//         await updateWalls(walls, updateCounter);
//       }
//     }

//     return walls;
//   };

//   const generateKruskal = async () => {
//     const walls = initializeWalls();
//     const sets = new Map<string, Set<string>>();
//     let updateCounter = 0;

//     for (let y = 0; y < height; y++) {
//       for (let x = 0; x < width; x++) {
//         const key = `${x},${y}`;
//         sets.set(key, new Set([key]));
//       }
//     }

//     const wallList = Array.from(walls)
//       .map(wall => {
//         const [x, y, isHorizontal] = wall.split(',');
//         return { 
//           x: parseInt(x), 
//           y: parseInt(y), 
//           isHorizontal: isHorizontal === 'true' 
//         };
//       })
//       .filter(wall => {
//         if (wall.isHorizontal) {
//           return wall.y > 0 && wall.y < height;
//         } else {
//           return wall.x > 0 && wall.x < width;
//         }
//       })
//       .sort(() => Math.random() - 0.5);

//     for (const wall of wallList) {
//       let cell1 = `${wall.x},${wall.y}`;
//       let cell2;

//       if (wall.isHorizontal) {
//         cell2 = `${wall.x},${wall.y-1}`;
//       } else {
//         cell2 = `${wall.x-1},${wall.y}`;
//       }

//       const set1 = sets.get(cell1);
//       const set2 = sets.get(cell2);

//       if (set1 && set2 && !Array.from(set1).some(item => set2.has(item))) {
//         walls.delete(`${wall.x},${wall.y},${wall.isHorizontal}`);
//         const mergedSet = new Set([...set1, ...set2]);
//         for (const cell of mergedSet) {
//           sets.set(cell, mergedSet);
//         }
//       }

//       updateCounter++;
//       await updateWalls(walls, updateCounter);
//     }

//     return walls;
//   };

//   const generateMaze = async () => {
//     setIsGenerating(true);
//     setSolution(undefined);
    
//     let finalWalls: Set<string>;
    
//     switch (algorithm) {
//       case 'sidewinder':
//         finalWalls = await generateSidewinder();
//         break;
//       case 'kruskal':
//         finalWalls = await generateKruskal();
//         break;
//       default:
//         finalWalls = await generateRecursiveBacktracker();
//     }

//     finalWalls.delete('0,0,true');
//     finalWalls.delete(`${width-1},${height},true`);
//     setWalls(finalWalls);
    
//     setIsGenerating(false);
//   };

//   const solveMaze = async () => {
//     setIsSolving(true);
//     setSolution(new Set());

//     const start: Cell = { x: 0, y: 0 };
//     const end: Cell = { x: width - 1, y: height - 1 };
//     const queue: Cell[] = [start];
//     const visited = new Set<string>([`${start.x},${start.y}`]);
//     const parent = new Map<string, string>();

//     const directions = [
//       { dx: 0, dy: -1 },
//       { dx: 0, dy: 1 },
//       { dx: -1, dy: 0 },
//       { dx: 1, dy: 0 },
//     ];

//     let found = false;
//     while (queue.length > 0 && !found) {
//       const current = queue.shift()!;

//       if (current.x === end.x && current.y === end.y) {
//         found = true;
//         break;
//       }

//       for (const dir of directions) {
//         const next: Cell = {
//           x: current.x + dir.dx,
//           y: current.y + dir.dy
//         };
        
//         if (next.x < 0 || next.x >= width || next.y < 0 || next.y >= height) continue;

//         const nextKey = `${next.x},${next.y}`;
//         if (!visited.has(nextKey)) {
//           const wallX = dir.dx === 1 ? current.x + 1 : current.x;
//           const wallY = dir.dy === 1 ? current.y + 1 : current.y;
//           const isHorizontal = dir.dy !== 0;
          
//           if (!walls.has(`${wallX},${wallY},${isHorizontal}`)) {
//             queue.push(next);
//             visited.add(nextKey);
//             parent.set(nextKey, `${current.x},${current.y}`);
//           }
//         }
//       }
//     }

//     if (found) {
//       const fullPath: string[] = [];
//       let current = `${end.x},${end.y}`;
      
//       while (current !== `${start.x},${start.y}`) {
//         fullPath.unshift(current);
//         current = parent.get(current)!;
//       }
//       fullPath.unshift(`${start.x},${start.y}`);

//       const animationSteps = fullPath.length;
//       const stepDelay = 2000 / animationSteps;

//       for (let i = 0; i < fullPath.length; i++) {
//         const partialPath = new Set(fullPath.slice(0, i + 1));
//         setSolution(partialPath);
//         await new Promise(resolve => setTimeout(resolve, stepDelay));
//       }
//     }

//     setIsSolving(false);
//   };

//   return (
//     <div className="flex flex-col items-center gap-4">
//       <div className="flex flex-col gap-4 items-center w-full max-w-2xl">
//         <div className="flex gap-4 items-center w-full">
//           <label className="text-sm min-w-20">Width:</label>
//           <input
//             type="range"
//             min="5"
//             max="30"
//             value={width}
//             onChange={(e) => setWidth(parseInt(e.target.value))}
//             className="flex-grow"
//             disabled={isGenerating || isSolving}
//           />
//           <span className="min-w-12 text-right">{width}</span>
//         </div>
        
//         <div className="flex gap-4 items-center w-full">
//           <label className="text-sm min-w-20">Height:</label>
//           <input
//             type="range"
//             min="5"
//             max="30"
//             value={height}
//             onChange={(e) => setHeight(parseInt(e.target.value))}
//             className="flex-grow"
//             disabled={isGenerating || isSolving}
//           />
//           <span className="min-w-12 text-right">{height}</span>
//         </div>

//         <div className="flex gap-4 items-center">
//           <select
//             value={algorithm}
//             onChange={(e) => setAlgorithm(e.target.value as MazeAlgorithm)}
//             className="px-3 py-2 border rounded-lg"
//             disabled={isGenerating || isSolving}
//           >
//             {Object.entries(ALGORITHMS).map(([value, label]) => (
//               <option key={value} value={value}>{label}</option>
//             ))}
//           </select>

//           <button
//             onClick={generateMaze}
//             disabled={isGenerating || isSolving}
//             className="px-4 py-2 bg-blue-500 text-white rounded-lg disabled:bg-blue-300 hover:bg-blue-600"
//           >
//             {isGenerating ? 'Generating...' : 'Generate Maze'}
//           </button>
//           <button
//             onClick={solveMaze}
//             disabled={isGenerating || isSolving || walls.size === 0}
//             className="px-4 py-2 bg-green-500 text-white rounded-lg disabled:bg-green-300 hover:bg-green-600"
//           >
//             {isSolving ? 'Solving...' : 'Solve Maze'}
//           </button>
//         </div>
//       </div>
      
//       <svg 
//         width={svgWidth} 
//         height={svgHeight}
//         className="bg-white border border-gray-200 rounded-lg"
//       >
//         <g transform={`translate(${padding},${padding})`}>
//           {/* Grid cells */}
//           {Array.from({ length: height }, (_, y) =>
//             Array.from({ length: width }, (_, x) => (
//               <rect
//                 key={`cell-${x}-${y}`}
//                 x={x * cellSize}
//                 y={y * cellSize}
//                 width={cellSize}
//                 height={cellSize}
//                 fill={solution?.has(`${x},${y}`) ? 'rgba(34, 197, 94, 0.2)' : 'none'}
//                 stroke="#eee"
//                 strokeWidth="1"
//               />
//             ))
//           )}
          
//           {/* Walls */}
//           {Array.from({ length: height + 1 }, (_, y) =>
//             Array.from({ length: width + 1 }, (_, x) => (
//               <React.Fragment key={`walls-${x}-${y}`}>
//                 {/* Horizontal walls */}
//                 {x < width && (
//                   <line
//                     x1={x * cellSize}
//                     y1={y * cellSize}
//                     x2={(x + 1) * cellSize}
//                     y2={y * cellSize}
//                     stroke={walls.has(`${x},${y},true`) ? '#000' : 'transparent'}
//                     strokeWidth="2"
//                   />
//                 )}
//                 {/* Vertical walls */}
//                 {y < height && (
//                   <line
//                     x1={x * cellSize}
//                     y1={y * cellSize}
//                     x2={x * cellSize}
//                     y2={(y + 1) * cellSize}
//                     stroke={walls.has(`${x},${y},false`) ? '#000' : 'transparent'}
//                     strokeWidth="2"
//                   />
//                 )}
//               </React.Fragment>
//             ))
//           )}
//         </g>
//       </svg>
//     </div>
//   );
// };

// export default MazeCreator;
