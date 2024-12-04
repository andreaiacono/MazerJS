import React from 'react';
import { MazeProvider } from './contexts/MazeProvider';
import MazeGenerator from './components/MazeGenerator';

const App: React.FC = () => {
  console.log("App rendering");
  return (
    <MazeProvider>
      <div className="debug-app">
        <h1>Debug: App Component</h1>
        <MazeGenerator />
      </div>
    </MazeProvider>
  );
};

export default App;