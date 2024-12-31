import { Cell } from '../types';
import { createEmptyGrid, getRandomElement, getRandomWithBias } from './utils';

export const ellerMaze = (
    rows: number, 
    columns: number, 
    horizontalBias: number = 50,
    branchingProbability: number = 50,
    verticalConnections: number = 50
  ): Cell[][] => {
    const grid = createEmptyGrid(rows, columns);
    let currentSet = 0;
    const cellToSet = new Map<string, number>();
    const setCells = new Map<number, { row: number; col: number }[]>();
    
    horizontalBias /= 100;
    branchingProbability /= 100;
    verticalConnections /= 100;
  
    for (let row = 0; row < rows; row++) {
      // Assign sets to cells without one
      for (let col = 0; col < columns; col++) {
        const key = `${row},${col}`;
        if (!cellToSet.has(key)) {
          currentSet++;
          cellToSet.set(key, currentSet);
          setCells.set(currentSet, [{ row, col }]);
        }
      }
      
      // Horizontal connections
      for (let col = 0; col < columns - 1; col++) {
        if (getRandomWithBias(horizontalBias)) {
          const key1 = `${row},${col}`;
          const key2 = `${row},${col + 1}`;
          const set1 = cellToSet.get(key1)!;
          const set2 = cellToSet.get(key2);
          
          if (set1 !== set2) {
            grid[row][col].eastWall = false;
            grid[row][col + 1].westWall = false;
            
            // Merge sets
            const cells1 = setCells.get(set1)!;
            const cells2 = setCells.get(set2)!;
            setCells.set(set1, [...cells1, ...cells2]);
            setCells.delete(set2);
            
            // Update set membership
            cells2.forEach(cell => {
              cellToSet.set(`${cell.row},${cell.col}`, set1);
            });
          }
        }
      }
      
      if (row < rows - 1) {
        for (const [set, cells] of setCells) {
          const minConnections = 1;
          const maxConnections = Math.ceil(cells.length * branchingProbability);
          const verticalConns = Math.max(
            minConnections,
            Math.floor(maxConnections * (1 - verticalConnections))
          );
          
          const selectedCells = new Set(
            Array.from({ length: verticalConns }, 
              () => getRandomElement(cells))
          );
          
          for (const cell of selectedCells) {
            grid[cell.row][cell.col].southWall = false;
            grid[cell.row + 1][cell.col].northWall = false;
          }
        }
      }
      
      cellToSet.clear();
      setCells.clear();
    }
    
    return grid;
  };