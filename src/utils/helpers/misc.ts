import { Cell } from "../types";

export function mazeToString(maze: Cell[][]): string {
    const rows = maze.length;
    const cols = maze[0].length;
    let result = '';
    
    // Top border
    for (let j = 0; j < cols; j++) {
      result += maze[0][j].northWall ? '+---' : '+   ';
    }
    result += '+\n';
    
    for (let i = 0; i < rows; i++) {
      // West walls
      let line = '';
      for (let j = 0; j < cols; j++) {
        const cell = maze[i][j];
        line += cell.westWall ? '|' : ' ';
        
        // Cell content
        let content = '   ';
        if (cell.isEntrance) content = ' E ';
        if (cell.isExit) content = ' X ';
        if (cell.isSolution) content = ' * ';
        if (cell.circularWall) content = ' ○ ';
        if (cell.radialWall) content = ' / ';
        
        line += content;
      }
      result += line + (maze[i][cols-1].eastWall ? '|\n' : ' \n');
      
      // South walls
      if (i < rows - 1) {
        for (let j = 0; j < cols; j++) {
          result += maze[i][j].southWall ? '+---' : '+   ';
        }
        result += '+\n';
      }
    }
    
    // Bottom border
    for (let j = 0; j < cols; j++) {
      result += maze[rows-1][j].southWall ? '+---' : '+   ';
    }
    result += '+';
    
    return result;
  }

export function getMazeDimensions(
    letterSize: number, 
    letterDistance: number, 
    text: string
  ): { width: number; height: number } {
    return {
      height: Math.round(letterSize),
      width: Math.round(0.65 * (letterSize + (letterSize * letterDistance / 30)) * text.length)
    };
  }