import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { NumberSlider } from '../../ui/number-slider';
import { AccordionItem, AccordionTrigger, AccordionContent } from '../../ui/accordion';
import { MazeSettings, MazeAlgorithm } from '../../../utils/types';
import { getAlgorithmDescription } from '../../../utils/constants';
import { useMazeContext } from '../../../contexts/MazeContext';

interface GenerationSectionProps {
  algorithm: MazeAlgorithm;
  setAlgorithm: (algo: MazeAlgorithm) => void;
  mazeSettings: MazeSettings;
  onMazeSettingChange: (setting: keyof MazeSettings, value: any) => void;
}

export const GenerationSection: React.FC<GenerationSectionProps> = ({
  algorithm,
  setAlgorithm,
  mazeSettings,
  onMazeSettingChange,
}) => {
  const { generateMaze } = useMazeContext();

  const handleAlgorithmChange = (newAlgorithm: MazeAlgorithm) => {
    setAlgorithm(newAlgorithm);
    algorithmConfigs[newAlgorithm]?.forEach((config) => {
      onMazeSettingChange(config.key, config.start);
    });
    generateMaze();
  };

  const algorithmConfigs: Record<MazeAlgorithm, Array<{
    key: keyof MazeSettings;
    label: string;
    min?: number;
    max?: number;
    step?: number;
    start?: number
  }>> = {
    'binary': [
      { key: 'horizontalBias', label: 'Horizontal Bias (%)', min: 0, max: 100, start: 50}
    ],
    'sidewinder': [
      { key: 'horizontalBias', label: 'Horizontal Bias (%)', min: 0, max: 100, start: 50},
      { key: 'branchingProbability', label: 'Branching Probability (%)', min: 1, max: 100, start: 80}
    ],
    'recursive-backtracker': [
      { key: 'branchingProbability', label: 'Branching Probability (%)', min: 40, max: 100, start: 85},
      { key: 'deadEndDensity', label: 'Dead End Density (%)', min: 0, max: 100, start: 30}
    ],
    'prims': [
      { key: 'branchingProbability', label: 'Branching Probability (%)', min: 50, max: 100 , start: 95}
    ],
    'recursive-division': [
      { key: 'horizontalBias', label: 'Horizontal Bias (%)', min: 0, max: 100, start: 50}
    ],
    'hunt-and-kill': [
      { key: 'branchingProbability', label: 'Branching Probability (%)', min: 1, max: 100, start: 80},
      { key: 'deadEndDensity', label: 'Dead End Density (%)', min: 0, max: 100, start: 40}
    ]
  };

  const selectConfigs = [
    {
      key: 'entrancePosition' as keyof MazeSettings,
      label: 'Entrance Position',
      options: [
        { value: 'north', label: 'North' },
        { value: 'south', label: 'South' },
        { value: 'east', label: 'East' },
        { value: 'west', label: 'West' },
        { value: 'random', label: 'Random' }
      ]
    },
    {
      key: 'exitPosition' as keyof MazeSettings,
      label: 'Exit Position',
      options: [
        { value: 'north', label: 'North' },
        { value: 'south', label: 'South' },
        { value: 'east', label: 'East' },
        { value: 'west', label: 'West' },
        { value: 'random', label: 'Random' },
        { value: 'farthest', label: 'Farthest from Entrance' }
      ]
    },
    {
      key: 'symmetry' as keyof MazeSettings,
      label: 'Symmetry',
      options: [
        { value: 'none', label: 'None' },
        { value: 'horizontal', label: 'Horizontal' },
        { value: 'vertical', label: 'Vertical' },
        { value: 'both', label: 'Both' }
      ]
    }
  ];

  return (
    <AccordionItem value="generation" className="border-t">
      <AccordionTrigger className="text-lg font-medium">
        Generation
      </AccordionTrigger>
      <AccordionContent>
        <div className="pt-4 space-y-4">
          <div>
            <label className="block mb-2 font-medium">Algorithm</label>
            <Select value={algorithm} onValueChange={handleAlgorithmChange}>
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

          {algorithmConfigs[algorithm]?.map((config) => (
            <NumberSlider
              key={config.key}
              label={config.label}
              value={mazeSettings[config.key] as number}
              onChange={(value) => onMazeSettingChange(config.key, value)}
              min={config.min ?? 0}
              max={config.max ?? 100}
              step={config.step ?? 1}
            />
          ))}

          <div className="space-y-4">
            {selectConfigs.map((config) => (
              <div key={config.key}>
                <label className="block mb-2 font-small">{config.label}</label>
                <Select
                  value={mazeSettings[config.key] as string}
                  onValueChange={(value) => onMazeSettingChange(config.key, value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={`Select ${config.label.toLowerCase()}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {config.options.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
};