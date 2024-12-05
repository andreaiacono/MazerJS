import { MazeAlgorithm } from './types';

export const CELLS_PER_LETTER = 50;
export const FIXED_HEIGHT = 60;

export const algorithmPresets = {
    'binary': {
      horizontalBias: 75,
      branchingProbability: 70,
      deadEndDensity: 80
    },
    'sidewinder': {
      horizontalBias: 65,
      branchingProbability: 70,
      deadEndDensity: 50
    },
    'recursive-backtracker': {
      horizontalBias: 50,
      branchingProbability: 85,
      deadEndDensity: 30
    },
    'prims': {
      horizontalBias: 50,
      branchingProbability: 80,
      deadEndDensity: 50
    },
    'recursive-division': {
      horizontalBias: 70,
      branchingProbability: 50,
      deadEndDensity: 50
    },
    'hunt-and-kill': {
      horizontalBias: 50,
      branchingProbability: 75,
      deadEndDensity: 40
    }
  }

export const ALGORITHM_DESCRIPTIONS = {
  'binary': "Creates mazes with a clear bias toward paths moving down and right.\n\nAffected by: Horizontal Bias",
  'sidewinder': "Creates mazes with horizontal corridors and random vertical connections.\n\nAffected by: Horizontal Bias, Branching Probability",
  // ... other descriptions
} as const;

export const getAlgorithmDescription = (algo: MazeAlgorithm) => {
    const descriptions = {
      'binary': "Creates mazes with a clear bias toward paths moving down and right.\n\nAffected by: Horizontal Bias",
      'sidewinder': "Creates mazes with horizontal corridors and random vertical connections.\n\nAffected by: Horizontal Bias, Branching Probability",
      'recursive-backtracker': "Creates long, winding corridors with fewer dead ends.\n\nAffected by: Branching Probability, Dead End Density",
      'prims': "Creates organic-looking mazes with many short dead ends.\n\nAffected by: Branching Probability",
      'recursive-division': "Creates geometric patterns by recursively dividing chambers.\n\nAffected by: Horizontal Bias",
      'hunt-and-kill': "Balanced algorithm with a mix of corridors and dead ends.\n\nAffected by: Branching Probability, Dead End Density"
    };
    return descriptions[algo] || "";
  };