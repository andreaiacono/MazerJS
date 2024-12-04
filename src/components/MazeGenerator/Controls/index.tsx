import React from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { Card, CardContent } from '../../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Accordion } from '../../ui/accordion';
import { AppearanceSection } from './AppearanceSection';
import { GenerationSection } from './GenerationSection';
import { SolvingSection } from './SolvingSection';
import { MazeSettings, FrameType, MazeAlgorithm, AppearanceSettings, SolverSettings } from '../../../utils/types';
import { getAlgorithmDescription } from '../../../utils/constants';

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
        w-80 z-10
      `}
    >
      <Card className="h-full">
        <CardContent className="p-6 bg-background relative z-10">
          <div className="space-y-6">
            {/* Basic Controls */}
            <div className="flex flex-col gap-6">
              <div>
                <label className="block mb-2 font-medium">Frame Type</label>
                <Select value={frameType} onValueChange={setFrameType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select frame type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="square">Square/Rectangle</SelectItem>
                    <SelectItem value="polygon">Polygon</SelectItem>
                    <SelectItem value="circular">Circular</SelectItem>
                    <SelectItem value="text">Text</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block mb-2 font-medium">Algorithm</label>
                <Select value={algorithm} onValueChange={setAlgorithm}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select algorithm" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="binary">Binary Tree</SelectItem>
                    <SelectItem value="sidewinder">Sidewinder</SelectItem>
                    <SelectItem value="recursive-backtracker">
                      Recursive Backtracker (DFS)
                    </SelectItem>
                    <SelectItem value="prims">Prim's Algorithm</SelectItem>
                    <SelectItem value="recursive-division">
                      Recursive Division
                    </SelectItem>
                    <SelectItem value="hunt-and-kill">Hunt and Kill</SelectItem>
                  </SelectContent>
                </Select>
                <div className="mt-2 text-sm text-gray-600 whitespace-pre-line">
                  {getAlgorithmDescription(algorithm)}
                </div>
              </div>
            </div>

            {/* Collapsible Sections */}
            <Accordion
              type="multiple"
              defaultValue={["appearance", "generation", "solving"]}
              className="space-y-4"
            >
              <AppearanceSection
                frameType={frameType}
                settings={appearanceSettings}
                onSettingChange={onAppearanceSettingChange}
              />
              <GenerationSection
                algorithm={algorithm}
                mazeSettings={mazeSettings}
                onMazeSettingChange={onMazeSettingChange}
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