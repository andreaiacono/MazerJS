import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { MazeProvider } from './contexts/MazeProvider';
import MazeGenerator from './components/MazeGenerator';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <MazeProvider>
      <div>
        <MazeGenerator />
      </div>
    </MazeProvider>
  </React.StrictMode>
);