interface Cell {
  northWall: boolean;
  southWall: boolean;
  eastWall: boolean;
  westWall: boolean;
  visited: boolean;
}

// Helper functions
const createEmptyGrid = (rows: number, columns: number): Cell[][] => {
  return Array(rows).fill(null).map(() => 
    Array(columns).fill(null).map(() => ({
      northWall: true,
      southWall: true,
      eastWall: true,
      westWall: true,
      visited: false
    }))
  );
};

const getRandomWithBias = (bias: number): boolean => {
  return Math.random() < bias;
};

// 1. Binary Tree Algorithm
export const binaryMaze = (
  rows: number, 
  columns: number, 
  horizontalBias: number
): Cell[][] => {
  const grid = createEmptyGrid(rows, columns);

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns; col++) {
      if (row > 0 && (col === columns - 1 || getRandomWithBias(1 - horizontalBias))) {
        // Remove north wall (vertical passage)
        grid[row][col].northWall = false;
        grid[row-1][col].southWall = false;
      } else if (col < columns - 1) {
        // Remove east wall (horizontal passage)
        grid[row][col].eastWall = false;
        grid[row][col+1].westWall = false;
      }
    }
  }
  return grid;
};

// 2. Sidewinder Algorithm
export const sidewinderMaze = (
  rows: number, 
  columns: number,
  horizontalBias: number,
  branchingProbability: number
): Cell[][] => {
  const grid = createEmptyGrid(rows, columns);

  for (let row = 0; row < rows; row++) {
    let run: number[] = [];
    
    for (let col = 0; col < columns; col++) {
      run.push(col);
      
      const atEasternBoundary = col === columns - 1;
      const atNorthernBoundary = row === 0;
      
      // Use horizontalBias to determine if we should close out the run
      const shouldCloseOut = atEasternBoundary || 
        (!atNorthernBoundary && getRandomWithBias(1 - horizontalBias));

      if (shouldCloseOut) {
        // Use branchingProbability to determine if we create a vertical passage
        if (!atNorthernBoundary && getRandomWithBias(branchingProbability)) {
          const randomCol = run[Math.floor(Math.random() * run.length)];
          grid[row][randomCol].northWall = false;
          grid[row-1][randomCol].southWall = false;
        }
        run = [];
      } else {
        grid[row][col].eastWall = false;
        grid[row][col+1].westWall = false;
      }
    }
  }
  return grid;
};

// 3. Recursive Backtracker (DFS)
export const recursiveBacktracker = (
  rows: number, 
  columns: number,
  branchingProbability: number,
  deadEndDensity: number
): Cell[][] => {
  const grid = createEmptyGrid(rows, columns);
  const stack: [number, number][] = [];
  
  // Start from random cell
  let current: [number, number] = [
    Math.floor(Math.random() * rows),
    Math.floor(Math.random() * columns)
  ];
  grid[current[0]][current[1]].visited = true;
  stack.push(current);

  while (stack.length > 0) {
    const [row, col] = current;
    
    // Get unvisited neighbors
    let neighbors: [number, number, string][] = [];
    if (row > 0 && !grid[row-1][col].visited) 
      neighbors.push([row-1, col, 'north']);
    if (row < rows-1 && !grid[row+1][col].visited) 
      neighbors.push([row+1, col, 'south']);
    if (col > 0 && !grid[row][col-1].visited) 
      neighbors.push([row, col-1, 'west']);
    if (col < columns-1 && !grid[row][col+1].visited) 
      neighbors.push([row, col+1, 'east']);

    // Use branchingProbability to potentially reduce available directions
    neighbors = neighbors.filter(() => getRandomWithBias(branchingProbability));

    if (neighbors.length > 0) {
      const [nextRow, nextCol, direction] = neighbors[
        Math.floor(Math.random() * neighbors.length)
      ];
      
      // Remove walls
      if (direction === 'north') {
        grid[row][col].northWall = false;
        grid[nextRow][nextCol].southWall = false;
      } else if (direction === 'south') {
        grid[row][col].southWall = false;
        grid[nextRow][nextCol].northWall = false;
      } else if (direction === 'west') {
        grid[row][col].westWall = false;
        grid[nextRow][nextCol].eastWall = false;
      } else {
        grid[row][col].eastWall = false;
        grid[nextRow][nextCol].westWall = false;
      }

      grid[nextRow][nextCol].visited = true;
      stack.push([nextRow, nextCol]);
      current = [nextRow, nextCol];
    } else {
      current = stack.pop()!;
    }
  }

  // Apply dead end density by potentially reopening some dead ends
  if (deadEndDensity < 1) {
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < columns; col++) {
        const isDeadEnd = 
          (grid[row][col].northWall ? 1 : 0) +
          (grid[row][col].southWall ? 1 : 0) +
          (grid[row][col].eastWall ? 1 : 0) +
          (grid[row][col].westWall ? 1 : 0) === 3;

        if (isDeadEnd && !getRandomWithBias(deadEndDensity)) {
          // Remove a random wall to reduce dead ends
          const walls = [];
          if (row > 0 && grid[row][col].northWall) walls.push('north');
          if (row < rows-1 && grid[row][col].southWall) walls.push('south');
          if (col > 0 && grid[row][col].westWall) walls.push('west');
          if (col < columns-1 && grid[row][col].eastWall) walls.push('east');

          const wallToRemove = walls[Math.floor(Math.random() * walls.length)];
          if (wallToRemove === 'north') {
            grid[row][col].northWall = false;
            grid[row-1][col].southWall = false;
          } else if (wallToRemove === 'south') {
            grid[row][col].southWall = false;
            grid[row+1][col].northWall = false;
          } else if (wallToRemove === 'west') {
            grid[row][col].westWall = false;
            grid[row][col-1].eastWall = false;
          } else {
            grid[row][col].eastWall = false;
            grid[row][col+1].westWall = false;
          }
        }
      }
    }
  }

  return grid;
};

// 4. Prim's Algorithm
export const primsAlgorithm = (
  rows: number, 
  columns: number,
  branchingProbability: number
): Cell[][] => {
  const grid = createEmptyGrid(rows, columns);
  const walls: [number, number, string][] = [];
  
  // Start from random cell
  const startRow = Math.floor(Math.random() * rows);
  const startCol = Math.floor(Math.random() * columns);
  grid[startRow][startCol].visited = true;

  // Add starting walls
  if (startRow > 0) walls.push([startRow, startCol, 'north']);
  if (startRow < rows-1) walls.push([startRow, startCol, 'south']);
  if (startCol > 0) walls.push([startRow, startCol, 'west']);
  if (startCol < columns-1) walls.push([startRow, startCol, 'east']);

  while (walls.length > 0) {
    // Use branchingProbability to potentially skip some walls
    if (getRandomWithBias(branchingProbability)) {
      const index = Math.floor(Math.random() * walls.length);
      const [row, col, direction] = walls[index];
      walls.splice(index, 1);

      let nextRow = row, nextCol = col;
      if (direction === 'north') nextRow--;
      else if (direction === 'south') nextRow++;
      else if (direction === 'west') nextCol--;
      else nextCol++;

      if (!grid[nextRow][nextCol].visited) {
        // Remove the wall
        if (direction === 'north') {
          grid[row][col].northWall = false;
          grid[nextRow][nextCol].southWall = false;
        } else if (direction === 'south') {
          grid[row][col].southWall = false;
          grid[nextRow][nextCol].northWall = false;
        } else if (direction === 'west') {
          grid[row][col].westWall = false;
          grid[nextRow][nextCol].eastWall = false;
        } else {
          grid[row][col].eastWall = false;
          grid[nextRow][nextCol].westWall = false;
        }

        grid[nextRow][nextCol].visited = true;

        // Add new walls
        if (nextRow > 0 && !grid[nextRow-1][nextCol].visited) 
          walls.push([nextRow, nextCol, 'north']);
        if (nextRow < rows-1 && !grid[nextRow+1][nextCol].visited) 
          walls.push([nextRow, nextCol, 'south']);
        if (nextCol > 0 && !grid[nextRow][nextCol-1].visited) 
          walls.push([nextRow, nextCol, 'west']);
        if (nextCol < columns-1 && !grid[nextRow][nextCol+1].visited) 
          walls.push([nextRow, nextCol, 'east']);
      }
    } else {
      walls.pop(); // Skip this wall
    }
  }

  return grid;
};

// 5. Recursive Division
export const recursiveDivision = (
  rows: number, 
  columns: number,
  horizontalBias: number
): Cell[][] => {
  const grid = createEmptyGrid(rows, columns);
  
  // Start with all internal walls removed
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns; col++) {
      if (row > 0) grid[row][col].northWall = false;
      if (row < rows-1) grid[row][col].southWall = false;
      if (col > 0) grid[row][col].westWall = false;
      if (col < columns-1) grid[row][col].eastWall = false;
    }
  }

  const divide = (
    startRow: number, 
    startCol: number, 
    height: number, 
    width: number
  ) => {
    if (height <= 1 || width <= 1) return;

    // Use horizontalBias to determine wall orientation
    const horizontal = getRandomWithBias(horizontalBias);

    if (horizontal) {
      const wallRow = startRow + Math.floor(Math.random() * (height - 1)) + 1;
      const passage = startCol + Math.floor(Math.random() * width);

      for (let col = startCol; col < startCol + width; col++) {
        if (col !== passage) {
          grid[wallRow][col].northWall = true;
          grid[wallRow-1][col].southWall = true;
        }
      }

      divide(startRow, startCol, wallRow - startRow, width);
      divide(wallRow, startCol, height - (wallRow - startRow), width);
    } else {
      const wallCol = startCol + Math.floor(Math.random() * (width - 1)) + 1;
      const passage = startRow + Math.floor(Math.random() * height);

      for (let row = startRow; row < startRow + height; row++) {
        if (row !== passage) {
          grid[row][wallCol].westWall = true;
          grid[row][wallCol-1].eastWall = true;
        }
      }

      divide(startRow, startCol, height, wallCol - startCol);
      divide(startRow, wallCol, height, width - (wallCol - startCol));
    }
  };

  divide(0, 0, rows, columns);
  return grid;
};

// 6. Hunt and Kill
export const huntAndKill = (
  rows: number, 
  columns: number,
  branchingProbability: number,
  deadEndDensity: number
): Cell[][] => {
  const grid = createEmptyGrid(rows, columns);
  
  let currentRow = Math.floor(Math.random() * rows);
  let currentCol = Math.floor(Math.random() * columns);
  grid[currentRow][currentCol].visited = true;

  while (currentRow !== -1) {
    let neighbors: [number, number, string][] = [];
    
    if (currentRow > 0 && !grid[currentRow-1][currentCol].visited) 
      neighbors.push([currentRow-1, currentCol, 'north']);
    if (currentRow < rows-1 && !grid[currentRow+1][currentCol].visited) 
      neighbors.push([currentRow+1, currentCol, 'south']);
    if (currentCol > 0 && !grid[currentRow][currentCol-1].visited) 
      neighbors.push([currentRow, currentCol-1, 'west']);
    if (currentCol < columns-1 && !grid[currentRow][currentCol+1].visited) 
      neighbors.push([currentRow, currentCol+1, 'east']);

    // Apply branching probability
    neighbors = neighbors.filter(() => getRandomWithBias(branchingProbability));

    if (neighbors.length > 0) {
      const [nextRow, nextCol, direction] = neighbors[
        Math.floor(Math.random() * neighbors.length)
      ];

      if (direction === 'north') {
        grid[currentRow][currentCol].northWall = false;
        grid[nextRow][nextCol].southWall = false;
      } else if (direction === 'south') {
        grid[currentRow][currentCol].southWall = false;
        grid[nextRow][nextCol].northWall = false;
      } else if (direction === 'west') {
        grid[currentRow][currentCol].westWall = false;
        grid[nextRow][nextCol].eastWall = false;
      } else {
        grid[currentRow][currentCol].eastWall = false;
        grid[nextRow][nextCol].westWall = false;
      }

      grid[nextRow][nextCol].visited = true;
      currentRow = nextRow;
      currentCol = nextCol;
    } else {
      // Hunt mode
      let found = false;
      hunt: for (let row = 0; row < rows && !found; row++) {
        for (let col = 0; col < columns && !found; col++) {
          if (!grid[row][col].visited) {
            // Check for visited neighbors
            let visitedNeighbors: [number, number, string][] = [];
            
            if (row > 0 && grid[row-1][col].visited) 
              visitedNeighbors.push([row-1, col, 'north']);
            if (row < rows-1 && grid[row+1][col].visited) 
              visitedNeighbors.push([row+1, col, 'south']);
            if (col > 0 && grid[row][col-1].visited) 
              visitedNeighbors.push([row, col-1, 'west']);
            if (col < columns-1 && grid[row][col+1].visited) 
              visitedNeighbors.push([row, col+1, 'east']);

            if (visitedNeighbors.length > 0) {
              const [visitedRow, visitedCol, direction] = visitedNeighbors[
                Math.floor(Math.random() * visitedNeighbors.length)
              ];

              if (direction === 'north') {
                grid[row][col].northWall = false;
                grid[visitedRow][visitedCol].southWall = false;
              } else if (direction === 'south') {
                grid[row][col].southWall = false;
                grid[visitedRow][visitedCol].northWall = false;
              } else if (direction === 'west') {
                grid[row][col].westWall = false;
                grid[visitedRow][visitedCol].eastWall = false;
              } else {
                grid[row][col].eastWall = false;
                grid[visitedRow][visitedCol].westWall = false;
              }

              grid[row][col].visited = true;
              currentRow = row;
              currentCol = col;
              found = true;
              break hunt;
            }
          }
        }
      }
      if (!found) {
        currentRow = -1; // No unvisited cells with visited neighbors
      }
    }
  }

  // Apply dead end density
  if (deadEndDensity < 1) {
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < columns; col++) {
        const isDeadEnd = 
          (grid[row][col].northWall ? 1 : 0) +
          (grid[row][col].southWall ? 1 : 0) +
          (grid[row][col].eastWall ? 1 : 0) +
          (grid[row][col].westWall ? 1 : 0) === 3;

        if (isDeadEnd && !getRandomWithBias(deadEndDensity)) {
          // Remove a random wall to reduce dead ends
          const walls = [];
          if (row > 0 && grid[row][col].northWall) walls.push('north');
          if (row < rows-1 && grid[row][col].southWall) walls.push('south');
          if (col > 0 && grid[row][col].westWall) walls.push('west');
          if (col < columns-1 && grid[row][col].eastWall) walls.push('east');

          const wallToRemove = walls[Math.floor(Math.random() * walls.length)];
          if (wallToRemove === 'north') {
            grid[row][col].northWall = false;
            grid[row-1][col].southWall = false;
          } else if (wallToRemove === 'south') {
            grid[row][col].southWall = false;
            grid[row+1][col].northWall = false;
          } else if (wallToRemove === 'west') {
            grid[row][col].westWall = false;
            grid[row][col-1].eastWall = false;
          } else {
            grid[row][col].eastWall = false;
            grid[row][col+1].westWall = false;
          }
        }
      }
    }
  }

  return grid;
};