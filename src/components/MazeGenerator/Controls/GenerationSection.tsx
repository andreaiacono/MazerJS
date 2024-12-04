import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { NumberSlider } from '../../ui/number-slider';
import { AccordionItem, AccordionTrigger, AccordionContent } from '../../ui/accordion';
import { MazeSettings, MazeAlgorithm } from '../../../utils/types';

interface GenerationSectionProps {
  algorithm: MazeAlgorithm;
  mazeSettings: MazeSettings;
  onMazeSettingChange: (setting: keyof MazeSettings, value: any) => void;
}

export const GenerationSection: React.FC<GenerationSectionProps> = ({
  algorithm,
  mazeSettings,
  onMazeSettingChange,
}) => {
  const getAlgorithmSettings = (algo: MazeAlgorithm) => {
    switch (algo) {
      case 'binary':
        return ['horizontalBias'];
      case 'sidewinder':
        return ['horizontalBias', 'branchingProbability'];
      case 'recursive-backtracker':
        return ['branchingProbability', 'deadEndDensity'];
      case 'prims':
        return ['branchingProbability'];
      case 'recursive-division':
        return ['horizontalBias'];
      case 'hunt-and-kill':
        return ['branchingProbability', 'deadEndDensity'];
      default:
        return [];
    }
  };

  const settingLabels = {
    horizontalBias: 'Horizontal Bias (%)',
    branchingProbability: 'Branching Probability (%)',
    deadEndDensity: 'Dead End Density (%)'
  };

  return (
    <AccordionItem value="generation" className="border-t">
      <AccordionTrigger className="text-lg font-medium">
        Maze Generation
      </AccordionTrigger>
      <AccordionContent>
        <div className="pt-4 space-y-4">
          {getAlgorithmSettings(algorithm).map((setting) => (
            <NumberSlider
              key={setting}
              label={settingLabels[setting as keyof typeof settingLabels]}
              value={mazeSettings[setting as keyof MazeSettings] as number}
              onChange={(value) => onMazeSettingChange(setting as keyof MazeSettings, value)}
              min={0}
              max={100}
              step={1}
            />
          ))}

          <div className="space-y-4">
            <div>
              <label className="block mb-2 font-small">Entrance Position</label>
              <Select
                value={mazeSettings.entrancePosition}
                onValueChange={(value: any) => 
                  onMazeSettingChange('entrancePosition', value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select entrance position" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="north">North</SelectItem>
                  <SelectItem value="south">South</SelectItem>
                  <SelectItem value="east">East</SelectItem>
                  <SelectItem value="west">West</SelectItem>
                  <SelectItem value="random">Random</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block mb-2 font-small">Exit Position</label>
              <Select
                value={mazeSettings.exitPosition}
                onValueChange={(value: any) => 
                  onMazeSettingChange('exitPosition', value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select exit position" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="north">North</SelectItem>
                  <SelectItem value="south">South</SelectItem>
                  <SelectItem value="east">East</SelectItem>
                  <SelectItem value="west">West</SelectItem>
                  <SelectItem value="random">Random</SelectItem>
                  <SelectItem value="farthest">Farthest from Entrance</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block mb-2 font-small">Symmetry</label>
              <Select
                value={mazeSettings.symmetry}
                onValueChange={(value: any) => 
                  onMazeSettingChange('symmetry', value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select symmetry type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="horizontal">Horizontal</SelectItem>
                  <SelectItem value="vertical">Vertical</SelectItem>
                  <SelectItem value="both">Both</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
};