import React, { useState, useRef, useEffect } from 'react';

type Cell = { x: number; y: number };
type Wall = { x: number; y: number; isHorizontal: boolean };

const FIXED_HEIGHT = 60;
const MAX_ANIMATION_TIME = 5000;
const CELLS_PER_LETTER = 50

const MazeCreator = () => {
  const [walls, setWalls] = useState(new Set<string>());
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSolving, setIsSolving] = useState(false);
  const [inputString, setInputString] = useState("MAZE");
  const [letterCells, setLetterCells] = useState(new Set<string>());
  const [solution, setSolution] = useState(new Set<string>());
  const [solveSpeed, setSolveSpeed] = useState(50);
  const [cellSize, setCellSize] = useState(6); // New state for cell size
  const [dimensions, setDimensions] = useState({ width: FIXED_HEIGHT * 2, height: FIXED_HEIGHT });
  
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
    const spacing = -fontSize * 0.1;
    
    const baseX = cellSize * 2;
  
    // First draw all letters
    text.split('').forEach((letter, i) => {
      const x = baseX + letterWidths.slice(0, i).reduce((a, b) => a + b, 0) + spacing * i;
      for(let ox = -1; ox <= 1; ox += 0.5) {
        for(let oy = -1; oy <= 1; oy += 0.5) {
          ctx.fillStyle = 'black';
          ctx.textBaseline = 'middle';
          ctx.fillText(letter, x + ox, dimensions.height/2 + oy);
        }
      }

      // Add connecting rectangle only between A and V
      if (i < text.length - 1) {
        const currentLetter = letter.toUpperCase();
        const nextLetter = text[i + 1].toUpperCase();
        if ((currentLetter === 'A' && nextLetter === 'V') || 
            (currentLetter === 'V' && nextLetter === 'A')) {
          const nextX = baseX + letterWidths.slice(0, i + 1).reduce((a, b) => a + b, 0) + spacing * (i + 1);
          ctx.fillRect(
            x + letterWidths[i] * 0.7,  // Start near the end of current letter
            dimensions.height/2 - fontSize * 0.4,  // Position at top
            nextX - (x + letterWidths[i] * 0.6),  // End near start of next letter
            fontSize * 0.1  // Thinner height for top connection
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

    // Start from the entrance point
    const stack: Cell[] = [entrance];
    visited.add(`${entrance.x},${entrance.y}`);

    // Special handling: clear path to entrance and exit
    walls.delete(`${entrance.x-1},${entrance.y},false`);
    walls.delete(`${entrance.x-2},${entrance.y},false`);
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

  // Add new state to track the current solving position
  const [currentPosition, setCurrentPosition] = useState<string | null>(null);

  const solveMaze = async () => {
    setIsSolving(true);
    setSolution(new Set());
    
    const { entrance, exit } = findEntranceExit(letterCells);
    if (!entrance || !exit) {
      setIsSolving(false);
      return;
    }

    // Create the entrance/exit cells outside the walls
    const entranceKey = `${entrance.x},${entrance.y}`;
    const exitKey = `${exit.x},${exit.y}`;
    
    const path = findPath(entrance, exit);
    
    if (path.length > 0) {
      let currentStep = 0;

      const animate = () => {
        const stepsToMove = Math.max(1, Math.floor(solveSpeedRef.current / 10));
        currentStep = Math.min(path.length, currentStep + stepsToMove);
        
        // Make sure both entrance and exit are included in the solution
        const solutionSet = new Set(path.slice(0, currentStep));
        solutionSet.add(entranceKey);
        if (currentStep === path.length) {
          solutionSet.add(exitKey);
        }
        setSolution(solutionSet);

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

  const findPath = (start: Cell, end: Cell): string[] => {
    const startKey = `${start.x},${start.y}`;
    const endKey = `${end.x},${end.y}`;
    
    const openSet = [startKey];
    const cameFrom = new Map<string, string>();
    const gScore = new Map([[startKey, 0]]);
    const fScore = new Map([[startKey, Math.abs(start.x - end.x)]]);
    const closedSet = new Set<string>();

    let iterations = 0;
    while (openSet.length > 0) {
      iterations++;
      if (iterations > 10000) {
        console.log('Too many iterations, aborting');
        return [];
      }

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

      // Define possible neighbor positions, including entrance and exit cells
      for (const [neighbor, wall] of getNeighbors({x: cx, y: cy})) {
        const neighborKey = `${neighbor.x},${neighbor.y}`;
        
        if (closedSet.has(neighborKey)) continue;
        
        // Allow path through entrance and exit cells
        if (!letterCells.has(neighborKey) && 
            neighborKey !== startKey && 
            neighborKey !== endKey) continue;
        
        const wallKey = `${wall.x},${wall.y},${wall.isHorizontal}`;
        if (walls.has(wallKey)) continue;

        const tentativeGScore = gScore.get(current)! + 1;
        if (tentativeGScore < (gScore.get(neighborKey) || Infinity)) {
          cameFrom.set(neighborKey, current);
          gScore.set(neighborKey, tentativeGScore);
          fScore.set(neighborKey, tentativeGScore + Math.abs(neighbor.x - end.x));
          
          if (!openSet.includes(neighborKey)) {
            openSet.push(neighborKey);
          }
        }
      }
    }
    
    return [];
  };

  

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex flex-col gap-4 items-center w-full max-w-2xl">
        <div className="flex gap-4 items-center">
          <input
            type="text"
            value={inputString}
            onChange={(e) => setInputString(e.target.value.toUpperCase())}
            className="px-3 py-2 border rounded-lg"
            disabled={isGenerating}
            placeholder="Enter text"
            maxLength={10}
          />
          <button
            onClick={generateMaze}
            disabled={isGenerating}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg disabled:bg-blue-300 hover:bg-blue-600"
          >
            {isGenerating ? 'Generating...' : 'Generate Maze'}
          </button>
          <button
            onClick={solveMaze}
            disabled={isGenerating || isSolving || walls.size === 0}
            className="px-4 py-2 bg-green-500 text-white rounded-lg disabled:bg-green-300 hover:bg-green-600"
          >
            {isSolving ? 'Solving...' : 'Solve Maze'}
          </button>
        </div>
        
        {/* Add cell size slider */}
        <div className="flex gap-4 items-center w-full">
          <label className="text-sm min-w-20">Cell Size:</label>
          <input
            type="range"
            min="4"
            max="12"
            value={cellSize}
            onChange={(e) => setCellSize(parseInt(e.target.value))}
            className="flex-grow"
            disabled={isGenerating}
          />
          <span className="min-w-12 text-right">{cellSize}px</span>
        </div>

        <div className="flex gap-4 items-center w-full">
          <label className="text-sm min-w-20">Animation Speed:</label>
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
            className="flex-grow"
            disabled={isGenerating}
          />
          <span className="min-w-12 text-right">{solveSpeed}%</span>
        </div>
      </div>
      
      <svg 
        width={svgWidth} 
        height={svgHeight}
        className="bg-white border border-gray-200 rounded-lg"
      >
        <g transform={`translate(${padding},${padding})`}>
        {Array.from({ length: dimensions.height }, (_, y) =>
          Array.from({ length: dimensions.width }, (_, x) => {
            const cellKey = `${x},${y}`;
            const isCurrentPosition = cellKey === currentPosition;
            const isPartOfSolution = solution.has(cellKey);
            const isInLetter = letterCells.has(cellKey);
            
            return isInLetter && (
              <rect
                key={`cell-${x}-${y}`}
                x={x * cellSize}
                y={y * cellSize}
                width={cellSize}
                height={cellSize}
                fill={isCurrentPosition ? 'rgba(255, 165, 0, 0.5)' : 
                      isPartOfSolution ? 'rgba(34, 197, 94, 0.3)' : 
                      'rgba(0, 0, 0, 0.05)'}
                stroke="#eee"
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
                    stroke={walls.has(`${x},${y},true`) ? '#000' : 'transparent'}
                    strokeWidth="1.5"
                  />
                )}
                {y < dimensions.height && shouldShowWall(x, y, false, letterCells) && (
                  <line
                    x1={x * cellSize}
                    y1={y * cellSize}
                    x2={x * cellSize}
                    y2={(y + 1) * cellSize}
                    stroke={walls.has(`${x},${y},false`) ? '#000' : 'transparent'}
                    strokeWidth="1.5"
                  />
                )}
              </React.Fragment>
            ))
          )}
        </g>
      </svg>
    </div>
  );
};

export default MazeCreator;