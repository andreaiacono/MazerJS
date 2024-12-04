import React, { useState, useRef, useEffect } from 'react';

type Cell = { x: number; y: number };
type Wall = { x: number; y: number; isHorizontal: boolean };

const FIXED_HEIGHT = 60;
const MAX_ANIMATION_TIME = 5000;
const CELLS_PER_LETTER = 50;

const MazeCreator = () => {
  const [walls, setWalls] = useState(new Set<string>());
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSolving, setIsSolving] = useState(false);
  const [inputString, setInputString] = useState("AVAWA");
  const [letterCells, setLetterCells] = useState(new Set<string>());
  const [solution, setSolution] = useState(new Set<string>());
  const [solveSpeed, setSolveSpeed] = useState(50);
  const [dimensions, setDimensions] = useState({ width: FIXED_HEIGHT * 2, height: FIXED_HEIGHT });
  const [cellSize, setCellSize] = useState(6);
  const [wallColor, setWallColor] = useState('#000000');
  const [wallThickness, setWallThickness] = useState(1.5);
  const [cellColor, setCellColor] = useState('#ddffff'); 
  const [solutionColor, setSolutionColor] = useState('#ffccff');
  // const [activeTab, setActiveTab] = useState('appearance');
  const [currentPosition, setCurrentPosition] = useState<string | null>(null);
  
  const solveSpeedRef = useRef(solveSpeed);
  solveSpeedRef.current = solveSpeed;
  
  const padding = 20;
  const svgWidth = dimensions.width * cellSize + 2 * padding;
  const svgHeight = dimensions.height * cellSize + 2 * padding;

  useEffect(() => {
    setDimensions({ 
      width: CELLS_PER_LETTER * Math.max(inputString.length, 1), 
      height: FIXED_HEIGHT 
    });
  }, [inputString]);

  const getRgbaFromHex = (hex: string, opacity: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  const shouldShowWall = (x: number, y: number, isHorizontal: boolean, pixels: Set<string>) => {
    if (isHorizontal) {
      return pixels.has(`${x},${y}`) || (y > 0 && pixels.has(`${x},${y-1}`));
    } else {
      return pixels.has(`${x},${y}`) || (x > 0 && pixels.has(`${x-1},${y}`));
    }
  };

  const getLetterPixels = (text: string) => {
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
    const totalWidth = letterWidths.reduce((a, b) => a + b, 0);
    const spacing = -fontSize * 0.08;
    
    const baseX = cellSize * 2;
  
    text.split('').forEach((letter, i) => {
      const x = baseX + letterWidths.slice(0, i).reduce((a, b) => a + b, 0) + spacing * i;
      for(let ox = -1; ox <= 1; ox += 0.5) {
        for(let oy = -1; oy <= 1; oy += 0.5) {
          ctx.fillStyle = 'black';
          ctx.textBaseline = 'middle';
          ctx.fillText(letter, x + ox, dimensions.height/2 + oy);
        }
      }

      if (i < text.length - 1) {
        const currentLetter = letter.toUpperCase();
        const nextLetter = text[i + 1].toUpperCase();
        if ((currentLetter === 'A' && nextLetter === 'V') || 
            (currentLetter === 'A' && nextLetter === 'W') ||
            (currentLetter === 'D' && nextLetter === 'R') ||
            (currentLetter === 'D' && nextLetter === 'P') ||
            (currentLetter === 'O' && nextLetter === 'P')) {
          console.log(currentLetter + " " + nextLetter)
          const nextX = baseX + letterWidths.slice(0, i + 1).reduce((a, b) => a + b, 0) + spacing * (i + 1);
          ctx.fillRect(
            x + letterWidths[i] / 2,
            dimensions.height/2 - fontSize * 0.43,
            letterWidths[i] /2, //nextX, // - (x + letterWidths[i] * 0.6),
            fontSize * 0.1
          );
        }
        else if ((currentLetter === 'V' && nextLetter === 'A') || 
            (currentLetter === 'W' && nextLetter === 'A') ||
            (currentLetter === 'N' && nextLetter === 'C') ||
            (currentLetter === 'D' && nextLetter === 'P') ||
            (currentLetter === 'P' && nextLetter === 'A') ) {
          console.log(currentLetter + " " + nextLetter)
          const nextX = baseX + letterWidths.slice(0, i + 1).reduce((a, b) => a + b, 0) + spacing * (i + 1);
          ctx.fillRect(
            x + letterWidths[i] * 0.8,
            dimensions.height/2 - fontSize * 0.43,
            letterWidths[i] /2, //nextX, // - (x + letterWidths[i] * 0.6),
            fontSize * 0.1
          );
        }
      }
    });

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

  const getNeighbors = (cell: Cell): Array<[Cell, Wall]> => {
    const neighbors: Array<[Cell, Wall]> = [];
    if (cell.y > 0) neighbors.push([{x: cell.x, y: cell.y - 1}, {x: cell.x, y: cell.y, isHorizontal: true}]);
    if (cell.y < dimensions.height - 1) neighbors.push([{x: cell.x, y: cell.y + 1}, {x: cell.x, y: cell.y + 1, isHorizontal: true}]);
    if (cell.x > 0) neighbors.push([{x: cell.x - 1, y: cell.y}, {x: cell.x, y: cell.y, isHorizontal: false}]);
    if (cell.x < dimensions.width - 1) neighbors.push([{x: cell.x + 1, y: cell.y}, {x: cell.x + 1, y: cell.y, isHorizontal: false}]);
    return neighbors;
  };

  const initializeWalls = () => {
    const newWalls = new Set<string>();
    for (let y = 0; y <= dimensions.height; y++) {
      for (let x = 0; x <= dimensions.width; x++) {
        if (x < dimensions.width) newWalls.add(`${x},${y},true`);
        if (y < dimensions.height) newWalls.add(`${x},${y},false`);
      }
    }
    return newWalls;
  };

  const findEntranceExit = (pixels: Set<string>) => {
    // Find the leftmost and rightmost pixels
    let minX = dimensions.width, maxX = 0;
    let minY = dimensions.height, maxY = 0;
    
    for (const pixel of pixels) {
      const [x, y] = pixel.split(',').map(Number);
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }
  
    // For entrance (first letter), scan vertically at minX+1 to find a good entry point
    let entrance: Cell | undefined;
    let middleY = Math.floor((minY + maxY) / 2);
    
    // Scan outward from the middle to find the first valid entrance point
    for (let offset = 0; offset < dimensions.height; offset++) {
      for (const y of [middleY + offset, middleY - offset]) {
        if (y < 0 || y >= dimensions.height) continue;
        
        // Check if we have a valid entrance point (pixel to the right is part of letter)
        if (pixels.has(`${minX+1},${y}`)) {
          let isValidEntrance = true;
          // Verify we have a path into the letter (check surrounding pixels)
          for (let checkY = y-1; checkY <= y+1; checkY++) {
            if (!pixels.has(`${minX+2},${checkY}`)) {
              isValidEntrance = false;
              break;
            }
          }
          if (isValidEntrance) {
            entrance = { x: minX + 1, y };
            break;
          }
        }
      }
      if (entrance) break;
    }
  
    // For exit (last letter), scan vertically at maxX-1 to find a good exit point
    let exit: Cell | undefined;
    middleY = Math.floor((minY + maxY) / 2);
    
    for (let offset = 0; offset < dimensions.height; offset++) {
      for (const y of [middleY + offset, middleY - offset]) {
        if (y < 0 || y >= dimensions.height) continue;
        
        // Check if we have a valid exit point (pixel to the left is part of letter)
        if (pixels.has(`${maxX-1},${y}`)) {
          let isValidExit = true;
          // Verify we have a path out of the letter
          for (let checkY = y-1; checkY <= y+1; checkY++) {
            if (!pixels.has(`${maxX-2},${checkY}`)) {
              isValidExit = false;
              break;
            }
          }
          if (isValidExit) {
            exit = { x: maxX - 1, y };
            break;
          }
        }
      }
      if (exit) break;
    }
  
    // Fallback entrance/exit if none found
    if (!entrance) {
      for (const pixel of pixels) {
        const [x, y] = pixel.split(',').map(Number);
        if (x === minX + 1) {
          entrance = { x, y };
          break;
        }
      }
    }
    
    if (!exit) {
      for (const pixel of pixels) {
        const [x, y] = pixel.split(',').map(Number);
        if (x === maxX - 1) {
          exit = { x, y };
          break;
        }
      }
    }
  
    return { entrance: entrance!, exit: exit! };
  };

  const generateMaze = async () => {
    setIsGenerating(true);
    setSolution(new Set());
    
    const pixels = getLetterPixels(inputString);
    setLetterCells(pixels);

    const { entrance, exit } = findEntranceExit(pixels);
    if (!entrance || !exit) {
      setIsGenerating(false);
      return;
    }

    const walls = initializeWalls();
    const visited = new Set<string>();

    const stack: Cell[] = [entrance];
    visited.add(`${entrance.x},${entrance.y}`);

    walls.delete(`${entrance.x},${entrance.y},false`);
    walls.delete(`${entrance.x-1},${entrance.y},false`);
    walls.delete(`${exit.x+1},${exit.y},false`);
    walls.delete(`${exit.x+2},${exit.y},false`);

    const processChunk = () => {
      const startTime = performance.now();
      
      while (stack.length > 0 && performance.now() - startTime < 16) {
        const current = stack[stack.length - 1];
        const neighbors = getNeighbors(current)
          .filter(([neighbor]) => {
            const key = `${neighbor.x},${neighbor.y}`;
            return pixels.has(key) && !visited.has(key);
          });

        if (neighbors.length === 0) {
          stack.pop();
          continue;
        }

        const [neighbor, wall] = neighbors[Math.floor(Math.random() * neighbors.length)];
        visited.add(`${neighbor.x},${neighbor.y}`);
        walls.delete(`${wall.x},${wall.y},${wall.isHorizontal}`);
        stack.push(neighbor);
      }

      setWalls(new Set(walls));

      if (stack.length > 0) {
        requestAnimationFrame(processChunk);
      } else {
        ensureConnectivity(walls, pixels);
        setWalls(new Set(walls));
        setIsGenerating(false);
      }
    };

    requestAnimationFrame(processChunk);
  };

  const ensureConnectivity = (walls: Set<string>, pixels: Set<string>) => {
    const visited = new Set<string>();
    const components: Set<string>[] = [];
    
    for (const pixel of pixels) {
      if (visited.has(pixel)) continue;
      
      const component = new Set<string>();
      const stack = [pixel];
      
      while (stack.length > 0) {
        const current = stack.pop()!;
        if (visited.has(current)) continue;
        
        visited.add(current);
        component.add(current);
        
        const [x, y] = current.split(',').map(Number);
        getNeighbors({x, y}).forEach(([neighbor, wall]) => {
          const key = `${neighbor.x},${neighbor.y}`;
          if (pixels.has(key) && !walls.has(`${wall.x},${wall.y},${wall.isHorizontal}`)) {
            stack.push(key);
          }
        });
      }
      
      if (component.size > 0) {
        components.push(component);
      }
    }
    
    for (let i = 0; i < components.length - 1; i++) {
      let minDist = Infinity;
      let bestWall: Wall | null = null;
      
      for (const cell1 of components[i]) {
        const [x1, y1] = cell1.split(',').map(Number);
        
        for (const cell2 of components[i + 1]) {
          const [x2, y2] = cell2.split(',').map(Number);
          const dist = Math.abs(x2 - x1) + Math.abs(y2 - y1);
          
          if (dist < minDist) {
            const neighbors = getNeighbors({x: x1, y: y1});
            for (const [neighbor, wall] of neighbors) {
              const key = `${neighbor.x},${neighbor.y}`;
              if (components[i + 1].has(key)) {
                minDist = dist;
                bestWall = wall;
              }
            }
          }
        }
      }
      
      if (bestWall) {
        walls.delete(`${bestWall.x},${bestWall.y},${bestWall.isHorizontal}`);
      }
    }
  };

  const findPath = (start: Cell, end: Cell): string[] => {
    const startKey = `${start.x},${start.y}`;
    const endKey = `${end.x},${end.y}`;
    
    const openSet = [startKey];
    const cameFrom = new Map<string, string>();
    const gScore = new Map([[startKey, 0]]);
    const fScore = new Map([[startKey, Math.abs(start.x - end.x) + Math.abs(start.y - end.y)]]);
    const closedSet = new Set<string>();

    while (openSet.length > 0) {
      const current = openSet.reduce((a, b) => 
        (fScore.get(a) || Infinity) < (fScore.get(b) || Infinity) ? a : b);
      
      if (current === endKey) {
        const path = [current];
        let currentKey = current;
        while (cameFrom.has(currentKey)) {
          currentKey = cameFrom.get(currentKey)!;
          path.unshift(currentKey);
        }
        return path;
      }

      openSet.splice(openSet.indexOf(current), 1);
      closedSet.add(current);

      const [cx, cy] = current.split(',').map(Number);

      for (const [neighbor, wall] of getNeighbors({x: cx, y: cy})) {
        const neighborKey = `${neighbor.x},${neighbor.y}`;
        
        if (closedSet.has(neighborKey)) continue;
        
        if (!letterCells.has(neighborKey) && 
            neighborKey !== startKey && 
            neighborKey !== endKey) continue;
        
        const wallKey = `${wall.x},${wall.y},${wall.isHorizontal}`;
        if (walls.has(wallKey)) continue;

        const tentativeGScore = gScore.get(current)! + 1;
        if (tentativeGScore < (gScore.get(neighborKey) || Infinity)) {
          cameFrom.set(neighborKey, current);
          gScore.set(neighborKey, tentativeGScore);
          fScore.set(neighborKey, tentativeGScore + Math.abs(neighbor.x - end.x) + Math.abs(neighbor.y - end.y));
          
          if (!openSet.includes(neighborKey)) {
            openSet.push(neighborKey);
          }
        }
      }
    }
    
    return [];
  };

  const solveMaze = async () => {
    setIsSolving(true);
    setSolution(new Set());
    
    const { entrance, exit } = findEntranceExit(letterCells);
    if (!entrance || !exit) {
      setIsSolving(false);
      return;
    }

    const path = findPath(entrance, exit);
    
    if (path.length > 0) {
      let currentStep = 0;

      const animate = () => {
        const stepsToMove = Math.max(1, Math.floor(solveSpeedRef.current / 10));
        currentStep = Math.min(path.length, currentStep + stepsToMove);
        
        setSolution(new Set(path.slice(0, currentStep)));

        if (currentStep < path.length) {
          requestAnimationFrame(animate);
        } else {
          setIsSolving(false);
        }
      };

      animate();
    } else {
      setIsSolving(false);
    }
  };

  const getCellColor = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, 1)`; // Increased opacity to 0.15 or adjust as needed
  };
  
  return (
    // Remove min-h-screen as it might cause issues
    <div className="flex h-screen overflow-hidden">
    {/* Fixed width sidebar */}
     <aside className="w-80 flex-shrink-0 border-r border-slate-200 bg-white overflow-y-auto">
        <div className="p-6 border-b border-slate-200">
          <h1 className="text-xl font-semibold text-slate-900">Maze Generator</h1>
        </div>

        <div className="p-6 space-y-8">
          {/* Text Input Group */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Text</h2>
            <div className="space-y-4">
              <input
                type="text"
                value={inputString}
                onChange={(e) => setInputString(e.target.value.toUpperCase())}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg text-lg font-medium 
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isGenerating}
                placeholder="Enter text"
                maxLength={10}
              />
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={generateMaze}
                  disabled={isGenerating}
                  className={`px-4 py-2 rounded-lg font-medium text-white transition-colors
                    ${isGenerating 
                      ? 'bg-blue-400 cursor-not-allowed' 
                      : 'bg-blue-500 hover:bg-blue-600'}`}
                >
                  {isGenerating ? 'Generating...' : 'Generate Maze'}
                </button>
                <button
                  onClick={solveMaze}
                  disabled={isGenerating || isSolving || walls.size === 0}
                  className={`px-4 py-2 rounded-lg font-medium border transition-colors
                    ${isGenerating || isSolving || walls.size === 0
                      ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}
                >
                  {isSolving ? 'Solving...' : 'Solve Maze'}
                </button>
              </div>
            </div>
          </div>

          {/* Dimensions Group */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Dimensions</h2>
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <label className="text-sm font-medium text-slate-700">Cell Size</label>
                  <span className="text-sm font-medium text-slate-600">{cellSize}px</span>
                </div>
                <input
                  type="range"
                  min="4"
                  max="12"
                  value={cellSize}
                  onChange={(e) => setCellSize(parseInt(e.target.value))}
                  className="w-full accent-blue-500"
                  disabled={isGenerating}
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <label className="text-sm font-medium text-slate-700">Wall Thickness</label>
                  <span className="text-sm font-medium text-slate-600">{wallThickness}px</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="3"
                  step="0.1"
                  value={wallThickness}
                  onChange={(e) => setWallThickness(parseFloat(e.target.value))}
                  className="w-full accent-blue-500"
                  disabled={isGenerating}
                />
              </div>
            </div>
          </div>

          {/* Colors Group */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Colors</h2>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Wall Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={wallColor}
                    onChange={(e) => setWallColor(e.target.value)}
                    className="h-8 w-16 rounded cursor-pointer"
                    disabled={isGenerating}
                  />
                  <span className="text-sm font-mono text-slate-600">{wallColor}</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Cell Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={cellColor}
                    onChange={(e) => setCellColor(e.target.value)}
                    className="h-8 w-16 rounded cursor-pointer"
                    disabled={isGenerating}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Solution Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={solutionColor}
                    onChange={(e) => setSolutionColor(e.target.value)}
                    className="h-8 w-16 rounded cursor-pointer"
                    disabled={isGenerating}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Animation Group */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Animation</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-sm font-medium text-slate-700">Solution Speed</label>
                <span className="text-sm font-medium text-slate-600">{solveSpeed}%</span>
              </div>
              <input
                type="range"
                min="1"
                max="100"
                value={solveSpeed}
                onChange={(e) => {
                  const newSpeed = parseInt(e.target.value);
                  setSolveSpeed(newSpeed);
                  solveSpeedRef.current = newSpeed;
                }}
                className="w-full accent-blue-500"
                disabled={isGenerating}
              />
            </div>
          </div>
        </div>
      </aside>

      {/* Main content area */}
      <main className="flex-1 bg-slate-50 flex items-center justify-center p-8 overflow-y-auto">
          <svg 
            width={svgWidth} 
            height={svgHeight}
            className="bg-white border border-slate-200 rounded-lg shadow-sm"
            style={{ maxHeight: 'calc(100vh - 4rem)' }}
          >
          <g transform={`translate(${padding},${padding})`}>
            {Array.from({ length: dimensions.height }, (_, y) =>
              Array.from({ length: dimensions.width }, (_, x) => {
                const cellKey = `${x},${y}`;
                const isCurrentPosition = cellKey === currentPosition;
                const isPartOfSolution = solution.has(cellKey);
                
                return letterCells.has(cellKey) && (
                  <rect
                    key={`cell-${x}-${y}`}
                    x={x * cellSize}
                    y={y * cellSize}
                    width={cellSize}
                    height={cellSize}
                    fill={isCurrentPosition ? 'rgba(255, 165, 0, 0.5)' : 
                          isPartOfSolution ? getRgbaFromHex(solutionColor, 1) : 
                          getRgbaFromHex(cellColor, 1)}
                    strokeWidth="0.5"
                  />
                );
              })
            )}
            
            {Array.from({ length: dimensions.height + 1 }, (_, y) =>
              Array.from({ length: dimensions.width + 1 }, (_, x) => (
                <React.Fragment key={`walls-${x}-${y}`}>
                  {x < dimensions.width && shouldShowWall(x, y, true, letterCells) && (
                    <line
                      x1={x * cellSize}
                      y1={y * cellSize}
                      x2={(x + 1) * cellSize}
                      y2={y * cellSize}
                      stroke={walls.has(`${x},${y},true`) ? wallColor : 'transparent'}
                      strokeWidth={wallThickness}
                    />
                  )}
                  {y < dimensions.height && shouldShowWall(x, y, false, letterCells) && (
                    <line
                      x1={x * cellSize}
                      y1={y * cellSize}
                      x2={x * cellSize}
                      y2={(y + 1) * cellSize}
                      stroke={walls.has(`${x},${y},false`) ? wallColor : 'transparent'}
                      strokeWidth={wallThickness}
                    />
                  )}
                </React.Fragment>
              ))
            )}
          </g>
        </svg>
      </main>
    </div>
  );
};

export default MazeCreator;