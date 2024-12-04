import React from 'react';
import ReactDOM from 'react-dom/client';
import MazeCreator from './main';
import './styles/globals.css';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <MazeCreator />
  </React.StrictMode>
);
