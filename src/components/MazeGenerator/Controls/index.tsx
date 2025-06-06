import React from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { Card, CardContent } from '../../ui/card';
import { Accordion } from '../../ui/accordion';
import { AppearanceSection } from './AppearanceSection';
import { GenerationSection } from './GenerationSection';
import { SolvingSection } from './SolvingSection';
import { MazeSettings, FrameType, MazeAlgorithm, AppearanceSettings, SolverSettings } from '../../../utils/types';

interface ControlsProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  frameType: FrameType;
  setFrameType: (type: FrameType) => void;
  algorithm: MazeAlgorithm;
  setAlgorithm: (algo: MazeAlgorithm) => void;
  mazeSettings: MazeSettings;
  onMazeSettingChange: (setting: keyof MazeSettings, value: any) => void;
  appearanceSettings: AppearanceSettings;
  onAppearanceSettingChange: (setting: keyof AppearanceSettings, value: any) => void;
  solverSettings: SolverSettings;
  onSolverSettingChange: (setting: keyof SolverSettings, value: any) => void;
}

export const Controls: React.FC<ControlsProps> = ({
  isOpen,
  setIsOpen,
  frameType,
  setFrameType,
  algorithm,
  setAlgorithm,
  mazeSettings,
  onMazeSettingChange,
  appearanceSettings,
  onAppearanceSettingChange,
  solverSettings,
  onSolverSettingChange,
}) => {
  return (
    <div
      className={`
        fixed top-0 left-0 h-full bg-white shadow-lg
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        w-80 z-10 flex flex-col
      `}
    >
      <Card className="h-full flex flex-col">
        <CardContent className="p-6 bg-background relative z-10 flex-1 overflow-y-auto">
          <div className="space-y-6 pb-4">
            {/* Collapsible Sections */}
            <Accordion
              type="multiple"
              defaultValue={["appearance", "generation", "solving"]}
              className="space-y-4"
            >
              <GenerationSection
                algorithm={algorithm}
                setAlgorithm={setAlgorithm}
                mazeSettings={mazeSettings}
                onMazeSettingChange={onMazeSettingChange}
                frameType={frameType}
              />
              <AppearanceSection
                frameType={frameType}
                setFrameType={setFrameType}
                settings={appearanceSettings}
                onSettingChange={onAppearanceSettingChange}
              />
              <SolvingSection
                settings={solverSettings}
                onSettingChange={onSolverSettingChange}
              />
            </Accordion>
          </div>
        </CardContent>
      </Card>

      <button
        className={`
          absolute top-1/2 -translate-y-1/2
          right-0 transform translate-x-full
          bg-white rounded-r-lg p-2 shadow-md hover:bg-gray-50
        `}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </button>
    </div>
  );
};