# MazerJS

A versatile maze generator built with React that supports multiple algorithms, shapes, and customization options.
  
![MazerJS Example](https://raw.githubusercontent.com/andreaiacono/andreaiacono.github.io/master/img/mazer.png)

  
## Here's a [Live Demo](https://andreaiacono.github.io/MazerJS/) to play with it
   

## Features
- Multiple Maze Generation Algorithms
- Diverse Maze Shapes
- Comprehensive Customization
- Interactive Features

## Getting Started

### Prerequisites

- Node.js (v12.0.0 or higher)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/andreaiacono/MazerJS.git

# Navigate to the project directory
cd MazerJS

# Install dependencies
npm install
# or
yarn install

# Start the development server
npm start
# or
yarn start
```

The application will be available at `http://localhost:3000`.

## Usage

1. Select a maze generation algorithm from the dropdown
2. Choose a frame type (Square/Rectangle, Polygon, Circular, or Text)
3. Adjust parameters according to your preferences:
   - For rectangular mazes: Set rows and columns
   - For polygonal mazes: Set number of sides, rings, and sectors
   - For circular mazes: Set rings and sectors
   - For text mazes: Enter text and set letter size
4. Click "Generate" to create a new maze
5. Use "Solve" to find a path from entrance to exit
6. Click "Show Solution" to display the solution path
7. Use "Export" to save your maze

## Algorithms

### Recursive Backtracker (DFS)
Creates long, winding corridors with fewer dead ends. This algorithm uses depth-first search with backtracking to generate mazes with typically one solution and long passages.

### Binary Tree
Creates mazes with a distinctive bias toward one corner. Simple and fast algorithm that connects each cell to either the north or east neighbor, creating a bias toward the northeast corner.

### Sidewinder
Generates mazes with horizontal corridors and random vertical connections. Creates a strong horizontal bias while maintaining randomness through occasional vertical paths.

### Prim's Algorithm
Generates organic-looking mazes with many short dead ends. This algorithm builds a maze by randomly selecting walls to remove from a growing tree structure.

### Recursive Division
Creates mazes by recursively dividing the space with walls and adding random passages. Produces mazes with a more structured, geometric appearance.

### Hunt and Kill
Similar to DFS but with different backtracking behavior. Hunts for unvisited cells when it reaches a dead end, creating mazes with fewer and shorter dead ends than DFS.

### Eller
Generates perfect mazes one row at a time. Memory-efficient algorithm that can theoretically generate infinite mazes by working on one row at a time.

### Aldous-Broder
Creates unbiased mazes through random walks, ensuring every possible maze has an equal probability of being generated. Can be slower than other algorithms but produces truly random mazes.

### Wilson
Produces unbiased mazes using loop-erased random walks. Creates truly random mazes like Aldous-Broder but can be more efficient for certain maze sizes.

### Kruskal
Creates mazes based on a minimum spanning tree algorithm. Randomly merges disjoint sets to create the maze structure, often producing mazes with a more scattered appearance.

## Configuration Options

### Generation Settings
- **Branching Probability**: Controls how often the path branches (higher values create more complex mazes)
- **Dead End Density**: Determines the frequency of dead ends
- **Entrance/Exit Position**: Customize where the maze starts and ends
- **Symmetry**: Apply symmetrical patterns to the maze structure

### Appearance Settings
- **Frame Type**: Choose the overall shape of the maze
- **Wall Thickness**: Adjust the thickness of maze walls
- **Zoom**: Change the maze display size
- **Show/Hide Entrance/Exit Arrows**: Toggle visibility of entrance and exit markers
- **Wall/Background Color**: Customize the visual appearance

### Solving Settings
- **Animation Speed**: Control how quickly the solution is displayed
- **Solution Color**: Customize the color of the solution path
