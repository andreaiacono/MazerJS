import { Cell } from '../types';
import { createEmptyGrid, getRandomElement } from './utils';

export const wilsonMaze = (rows: number, columns: number): Cell[][] => {
    const grid = createEmptyGrid(rows, columns);
    const inMaze = Array(rows).fill(null).map(() => Array(columns).fill(false));

    // Add random starting cell to maze
    let startRow = Math.floor(Math.random() * rows);
    let startCol = Math.floor(Math.random() * columns);
    inMaze[startRow][startCol] = true;

    while (true) {
        // Find cell not in maze
        const unvisitedCells = [];
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < columns; c++) {
                if (!inMaze[r][c]) unvisitedCells.push({ row: r, col: c });
            }
        }

        if (unvisitedCells.length === 0) break;

        // Start random walk
        const { row: currentRow, col: currentCol } = getRandomElement(unvisitedCells);
        const path: { row: number; col: number; direction?: string }[] = [
            { row: currentRow, col: currentCol }
        ];

        let walkRow = currentRow;
        let walkCol = currentCol;

        while (!inMaze[walkRow][walkCol]) {
            const directions = [
                { dr: -1, dc: 0, dir: 'north' },
                { dr: 1, dc: 0, dir: 'south' },
                { dr: 0, dc: 1, dir: 'east' },
                { dr: 0, dc: -1, dir: 'west' }
            ].filter(({ dr, dc }) => {
                const newRow = walkRow + dr;
                const newCol = walkCol + dc;
                return newRow >= 0 && newRow < rows && newCol >= 0 && newCol < columns;
            });

            const { dr, dc, dir } = getRandomElement(directions);
            walkRow += dr;
            walkCol += dc;

            const loopIndex = path.findIndex(p => p.row === walkRow && p.col === walkCol);
            if (loopIndex >= 0) {
                path.splice(loopIndex + 1);
            }

            path.push({ row: walkRow, col: walkCol, direction: dir });
        }

        // Carve path
        for (let i = 0; i < path.length - 1; i++) {
            const current = path[i];
            const next = path[i + 1];
            inMaze[current.row][current.col] = true;

            if (next.direction === 'north') {
                grid[current.row][current.col].northWall = false;
                grid[next.row][next.col].southWall = false;
            } else if (next.direction === 'south') {
                grid[current.row][current.col].southWall = false;
                grid[next.row][next.col].northWall = false;
            } else if (next.direction === 'east') {
                grid[current.row][current.col].eastWall = false;
                grid[next.row][next.col].westWall = false;
            } else if (next.direction === 'west') {
                grid[current.row][current.col].westWall = false;
                grid[next.row][next.col].eastWall = false;
            }
        }
    }

    return grid;
};
