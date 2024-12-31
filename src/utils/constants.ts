import { MazeAlgorithm } from './types';

export const getAlgorithmDescription = (algo: MazeAlgorithm) => {
  const descriptions = {
    'binary': "Creates mazes with a clear bias toward paths moving down and right.\n\nAffected by: Horizontal Bias",
    'sidewinder': "Creates mazes with horizontal corridors and random vertical connections.\n\nAffected by: Horizontal Bias, Branching Probability",
    'recursive-backtracker': "Creates long, winding corridors with fewer dead ends.\n\nAffected by: Branching Probability, Dead End Density",
    'prims': "Creates organic-looking mazes with many short dead ends.\n\nAffected by: Branching Probability",
    'recursive-division': "Creates geometric patterns by recursively dividing chambers.\n\nAffected by: Horizontal Bias",
    'hunt-and-kill': "Balanced algorithm with a mix of corridors and dead ends.\n\nAffected by: Branching Probability, Dead End Density",
    'eller': "Creates row-by-row mazes with efficient memory usage.\n\nAffected by: Horizontal Bias, Vertical Connection Probability",
    'kruskal': "Generates perfectly uniform and unbiased mazes using minimum spanning trees.\n\nAffected by: None",
    'aldous-broder': "Creates unbiased mazes through random walks, but can be slow.\n\nAffected by: None",
    'wilson': "Produces perfectly uniform mazes using loop-erased random walks.\n\nAffected by: None"
  };
  return descriptions[algo] || "";
};