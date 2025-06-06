import { MazeAlgorithm } from './types';

export const getAlgorithmDescription = (algo: MazeAlgorithm) => {
  const descriptions = {
    'binary': "Creates mazes with a clear bias toward paths moving down and right.\n\nAffected by:",
    'sidewinder': "Creates mazes with horizontal corridors and random vertical connections.\n\nAffected by:",
    'recursive-backtracker': "Creates long, winding corridors with fewer dead ends.\n\nAffected by:",
    'prims': "Creates organic-looking mazes with many short dead ends.\n\nAffected by:",
    'recursive-division': "Creates geometric patterns by recursively dividing chambers.\n\nAffected by:",
    'hunt-and-kill': "Balanced algorithm with a mix of corridors and dead ends.\n\nAffected by:",
    'eller': "Creates row-by-row mazes with efficient memory usage.\n\nAffected by:",
    'kruskal': "Generates perfectly uniform and unbiased mazes using minimum spanning trees.",
    'aldous-broder': "Creates unbiased mazes through random walks, but can be slow.",
    'wilson': "Produces perfectly uniform mazes using loop-erased random walks."
  };
  return descriptions[algo] || "";
};