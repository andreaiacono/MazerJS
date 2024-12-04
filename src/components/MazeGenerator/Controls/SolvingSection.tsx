import React from 'react';
import { Input } from '../../ui/input';
import { NumberSlider } from '../../ui/number-slider';
import { AccordionItem, AccordionTrigger, AccordionContent } from '../../ui/accordion';
import { SolverSettings } from '../../../utils/types';

interface SolvingSectionProps {
  settings: SolverSettings;
  onSettingChange: (setting: keyof SolverSettings, value: any) => void;
}

export const SolvingSection: React.FC<SolvingSectionProps> = ({
  settings,
  onSettingChange,
}) => {
  return (
    <AccordionItem value="solving" className="border-t">
      <AccordionTrigger className="text-lg font-medium">
        Solving
      </AccordionTrigger>
      <AccordionContent>
        <div className="pt-4 space-y-4">
          <NumberSlider
            label="Animation Speed"
            value={settings.speed}
            onChange={(value) => onSettingChange('speed', value)}
            min={1}
            max={100}
            step={1}
          />

          <div>
            <label className="block mb-2 font-small">Solution Color</label>
            <Input
              type="color"
              value={settings.solutionColor}
              onChange={(value) => onSettingChange('solutionColor', value)}
              className="h-10 w-full"
            />
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
};