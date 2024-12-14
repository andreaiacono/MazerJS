import React, { useEffect, useState } from 'react';
import { useMazeContext } from '../../contexts/MazeContext';
import { Controls } from './Controls';
import { ActionButtons } from './ActionButtons';
import { Canvas } from './Canvas';
import { MazeSettings, AppearanceSettings, SolverSettings } from '../../utils/types';
import { drawArrow } from '@/utils/helpers/drawing';
// import { useEffect } from 'react';

const MazeGenerator: React.FC = () => {
  const [isOpen, setIsOpen] = useState(true);

  const {
    maze,
    frameType,
    setFrameType,
    algorithm,
    setAlgorithm,
    mazeSettings,
    setMazeSettings,
    appearanceSettings,
    setAppearanceSettings,
    solverSettings,
    updateSolverSettings,
    generateMaze,
    // drawMaze,
    solveMaze,
    showSolution,
    exportMaze,
    solutionPath,
    isSolving,
    isSolutionShown
  } = useMazeContext();

  const handleMazeSettingChange = (setting: keyof MazeSettings, value: any) => {
    setMazeSettings((prev: MazeSettings) => ({
      ...prev,
      [setting]: value
    }));
    generateMaze();

  };

  const handleAppearanceSettingChange = (setting: keyof AppearanceSettings, value: any) => {
    setAppearanceSettings((prev: AppearanceSettings) => ({
      ...prev,
      [setting]: value
    }));

    // Only regenerate maze for structural changes
    if (['rows', 'columns', 'polygonSides'].includes(setting)) {
      generateMaze();
    }
  };



  useEffect(() => {
    // Force a redraw without regenerating the maze
    // The Canvas component will handle this automatically
  }, [
    appearanceSettings.showArrows,
    appearanceSettings.wallColor,
    appearanceSettings.backgroundColor,
    appearanceSettings.wallThickness,
    appearanceSettings.cellSize
  ]);

  const handleSolverSettingChange = (setting: keyof SolverSettings, value: any) => {
    updateSolverSettings({ [setting]: value });
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Controls
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        frameType={frameType}
        setFrameType={setFrameType}
        algorithm={algorithm}
        setAlgorithm={setAlgorithm}
        mazeSettings={mazeSettings}
        onMazeSettingChange={handleMazeSettingChange}
        appearanceSettings={appearanceSettings}
        onAppearanceSettingChange={handleAppearanceSettingChange}
        solverSettings={solverSettings}
        onSolverSettingChange={handleSolverSettingChange}
      />

      <div className={`flex-1 p-4 transition-all duration-300 ease-in-out ${isOpen ? 'ml-80' : 'ml-0'}`}>
        <div className="h-full border rounded-lg bg-white p-4 flex items-center justify-center relative">
          <ActionButtons
            onGenerate={generateMaze}
            onSolve={solveMaze}
            onShowSolution={showSolution}
            onExport={exportMaze}
            isSolving={isSolving}
            isSolutionShown={isSolutionShown}
          />

          <Canvas
            maze={maze}
            frameType={frameType}
            rows={appearanceSettings.rows}
            columns={appearanceSettings.columns}
            cellSize={appearanceSettings.cellSize}
            wallColor={appearanceSettings.wallColor}
            backgroundColor={appearanceSettings.backgroundColor}
            wallThickness={appearanceSettings.wallThickness}
            solutionColor={solverSettings.solutionColor}
            showArrows={appearanceSettings.showArrows}
            sides={appearanceSettings.polygonSides}
            solutionPath={solutionPath}
            text={appearanceSettings.text}
          />
        </div>
      </div>
    </div>
  );
};

export default MazeGenerator;