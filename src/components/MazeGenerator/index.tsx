import React, { useState } from 'react';
import { useMazeContext } from '../../contexts/MazeContext';
import { Controls } from './Controls';
import { ActionButtons } from './ActionButtons';
import { Canvas } from './Canvas';
import { MazeSettings, AppearanceSettings, SolverSettings } from '../../utils/types';
// import { useEffect } from 'react';

const MazeGenerator: React.FC = () => {
  console.log("MazeGenerator rendering");
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
    solutionPath
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
    console.log(setting)
    if (setting === "rows" || setting === "columns" || setting === "polygonSides") {
      generateMaze();
    }
  };

  const handleSolverSettingChange = (setting: keyof SolverSettings, value: any) => {
    updateSolverSettings({ [setting]: value });
  };

  // useEffect(() => {
  //   generateMaze();
  // }, [frameType, algorithm, appearanceSettings.rows, appearanceSettings.columns, mazeSettings, appearanceSettings.polygonSides]); // Added polygonSides here


  // useEffect(() => {
  //   if (frameType === 'text') {
  //     setDimensions({
  //       width: CELLS_PER_LETTER * Math.max(text.length, 1),
  //       height: rows
  //     });
  //   }
  // }, [text, frameType]);
  
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
          />
        </div>
      </div>
    </div>
  );
};

export default MazeGenerator;