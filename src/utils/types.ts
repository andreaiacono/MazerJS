export interface Position {
  row: number;
  col: number;
}

export interface Cell {
  northWall: boolean;
  southWall: boolean;
  eastWall: boolean;
  westWall: boolean;
  visited: boolean;
  isEntrance?: boolean;
  isExit?: boolean;
  isSolution?: boolean;
  circularWall?: boolean;
  radialWall?: boolean;
}

export interface MazeSettings {
  horizontalBias: number;
  branchingProbability: number;
  deadEndDensity: number;
  multipleExits: boolean;
  entrancePosition: 'north' | 'south' | 'east' | 'west' | 'random';
  exitPosition: 'north' | 'south' | 'east' | 'west' | 'random' | 'farthest';
  symmetry: 'none' | 'horizontal' | 'vertical' | 'both';
}


export interface AppearanceSettings {
  rows: number;
  columns: number;
  polygonSides: number;
  cellSize: number;
  wallThickness: number;
  showArrows: boolean;
  wallColor: string;
  backgroundColor: string;
  text: string;
  letterDistance: number;
}

export interface SolverSettings {
  speed: number;
  solutionColor: string;
  isSolving: boolean;
}

export interface SolvingState {
  currentPath: Position[];
  visited: Set<string>;
  found: boolean;
  entranceCell?: Position;
  exitCell?: Position;
}

export type MazeAlgorithm = 'binary' | 'sidewinder' | 'recursive-backtracker' | 'prims' | 'recursive-division' | 'hunt-and-kill';

export type FrameType = 'square' | 'polygon' | 'circular' | 'text';