import { Position, Cell } from '../types';

type WallType = 'northWall' | 'southWall' | 'eastWall' | 'westWall';

export const getValidMoves = (
  pos: Position,
  maze: Cell[][],
  visited: Set<string>,
  frameType: 'square' | 'circular' | 'polygon' | 'text'
): Position[] => {
  const moves: Position[] = [];
  const cell = maze[pos.row][pos.col];

  if (frameType === 'circular') {
    const sectors = maze[0].length;

    // Moving inward (towards center)
    if (pos.row > 0 && !cell.northWall) {
      const nextCell = maze[pos.row - 1][pos.col];
      const next = { row: pos.row - 1, col: pos.col };
      if (!visited.has(`${next.row},${next.col}`) && !nextCell.southWall) {
        moves.push(next);
      }
    }

    // Moving outward (away from center)
    if (pos.row < maze.length - 1 && !cell.southWall) {
      const nextCell = maze[pos.row + 1][pos.col];
      const next = { row: pos.row + 1, col: pos.col };
      if (!visited.has(`${next.row},${next.col}`) && !nextCell.northWall) {
        moves.push(next);
      }
    }

    // Moving clockwise and counter-clockwise
    const circularMoves: Array<{
      wall: WallType;
      oppositeWall: WallType;
      colDelta: number;
    }> = [
      { wall: 'eastWall', oppositeWall: 'westWall', colDelta: 1 },
      { wall: 'westWall', oppositeWall: 'eastWall', colDelta: -1 }
    ];

    circularMoves.forEach(({ wall, oppositeWall, colDelta }) => {
      if (!cell[wall]) {
        const nextCol = (pos.col + colDelta + sectors) % sectors;
        const nextCell = maze[pos.row][nextCol];
        const next = { row: pos.row, col: nextCol };
        if (!visited.has(`${next.row},${next.col}`) && !nextCell[oppositeWall]) {
          moves.push(next);
        }
      }
    });
  } else {
    // Standard moves for rectangular/polygon mazes
    const possibleMoves: Array<{
      wall: WallType;
      oppositeWall: WallType;
      row: number;
      col: number;
    }> = [
      { wall: 'northWall', oppositeWall: 'southWall', row: -1, col: 0 },
      { wall: 'southWall', oppositeWall: 'northWall', row: 1, col: 0 },
      { wall: 'eastWall', oppositeWall: 'westWall', row: 0, col: 1 },
      { wall: 'westWall', oppositeWall: 'eastWall', row: 0, col: -1 }
    ];

    possibleMoves.forEach(({ wall, oppositeWall, row: rowDelta, col: colDelta }) => {
      if (!cell[wall]) {
        const next = {
          row: pos.row + rowDelta,
          col: pos.col + colDelta
        };
        
        if (
          next.row >= 0 && next.row < maze.length &&
          next.col >= 0 && next.col < maze[0].length &&
          !visited.has(`${next.row},${next.col}`)
        ) {
          const nextCell = maze[next.row][next.col];
          if (!nextCell[oppositeWall]) {
            moves.push(next);
          }
        }
      }
    });
  }

  return moves;
};

export const manhattanDistance = (pos1: Position, pos2: Position): number => {
  return Math.abs(pos1.row - pos2.row) + Math.abs(pos1.col - pos2.col);
};