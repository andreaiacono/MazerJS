import { Cell } from '../types';
import { createEmptyGrid, getRandomElement } from './utils';

export const kruskalMaze = (rows: number, columns: number): Cell[][] => {
    const grid = createEmptyGrid(rows, columns);
    const sets = new DisjointSet(rows * columns);
    const walls: { row: number; col: number; isHorizontal: boolean }[] = [];

    // Initialize walls
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < columns; col++) {
            if (col < columns - 1) {
                walls.push({ row, col, isHorizontal: true });
            }
            if (row < rows - 1) {
                walls.push({ row, col, isHorizontal: false });
            }
        }
    }

    // Randomly remove walls
    while (walls.length > 0) {
        const wallIndex = Math.floor(Math.random() * walls.length);
        const wall = walls[wallIndex];
        walls.splice(wallIndex, 1);

        const cell1 = wall.row * columns + wall.col;
        const cell2 = wall.isHorizontal ?
            cell1 + 1 :
            cell1 + columns;

        if (!sets.connected(cell1, cell2)) {
            sets.union(cell1, cell2);
            if (wall.isHorizontal) {
                grid[wall.row][wall.col].eastWall = false;
                grid[wall.row][wall.col + 1].westWall = false;
            } else {
                grid[wall.row][wall.col].southWall = false;
                grid[wall.row + 1][wall.col].northWall = false;
            }
        }
    }

    return grid;
};

class DisjointSet {
    private parent: number[];
    private rank: number[];

    constructor(size: number) {
        this.parent = Array.from({ length: size }, (_, i) => i);
        this.rank = Array(size).fill(0);
    }

    find(x: number): number {
        if (this.parent[x] !== x) {
            this.parent[x] = this.find(this.parent[x]);
        }
        return this.parent[x];
    }

    union(x: number, y: number): void {
        const rootX = this.find(x);
        const rootY = this.find(y);

        if (rootX !== rootY) {
            if (this.rank[rootX] < this.rank[rootY]) {
                this.parent[rootX] = rootY;
            } else if (this.rank[rootX] > this.rank[rootY]) {
                this.parent[rootY] = rootX;
            } else {
                this.parent[rootY] = rootX;
                this.rank[rootX]++;
            }
        }
    }

    connected(x: number, y: number): boolean {
        return this.find(x) === this.find(y);
    }
}
