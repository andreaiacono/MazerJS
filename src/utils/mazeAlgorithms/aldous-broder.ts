import { Cell } from '../types';
import { createEmptyGrid, getRandomElement } from './utils';

export const aldousBroderMaze = (rows: number, columns: number): Cell[][] => {
    const grid = createEmptyGrid(rows, columns);
    let unvisitedCount = rows * columns - 1;
    let currentRow = Math.floor(Math.random() * rows);
    let currentCol = Math.floor(Math.random() * columns);
    grid[currentRow][currentCol].visited = true;

    while (unvisitedCount > 0) {
        const directions = [
            { dr: -1, dc: 0, wall: 'north' },
            { dr: 1, dc: 0, wall: 'south' },
            { dr: 0, dc: 1, wall: 'east' },
            { dr: 0, dc: -1, wall: 'west' }
        ].filter(({ dr, dc }) => {
            const newRow = currentRow + dr;
            const newCol = currentCol + dc;
            return newRow >= 0 && newRow < rows && newCol >= 0 && newCol < columns;
        });

        const { dr, dc, wall } = getRandomElement(directions);
        const newRow = currentRow + dr;
        const newCol = currentCol + dc;

        if (!grid[newRow][newCol].visited) {
            grid[currentRow][currentCol][`${wall}Wall` as keyof Cell] = false;
            grid[newRow][newCol][`${getOppositeWall(wall)}Wall` as keyof Cell] = false;
            grid[newRow][newCol].visited = true;
            unvisitedCount--;
        }

        currentRow = newRow;
        currentCol = newCol;
    }

    return grid;
};

function getOppositeWall(wall: string): string {
    const opposites: Record<string, string> = {
        north: 'south',
        south: 'north',
        east: 'west',
        west: 'east'
    };
    return opposites[wall];
}