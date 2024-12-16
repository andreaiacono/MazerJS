import React from 'react';
import { Input } from '../../ui/input';
import { Checkbox } from '../../ui/checkbox';
import { NumberSlider } from '../../ui/number-slider';
import { AccordionItem, AccordionTrigger, AccordionContent } from '../../ui/accordion';
import { FrameType } from '../../../utils/types';
import { AppearanceSettings } from '../../../utils/types';


// Modified props interface
interface AppearanceSectionProps {
  frameType: FrameType;
  settings: AppearanceSettings;
  onSettingChange: (setting: keyof AppearanceSettings, value: any) => void;
}

// Refactored component
export const AppearanceSection: React.FC<AppearanceSectionProps> = ({
  frameType,
  settings,
  onSettingChange,
}) => {

  const sliderConfigs = {
    square: [
      { key: 'rows', label: "Rows", value: settings.rows, min: 4, max: 100 },
      { key: 'columns', label: "Columns", value: settings.columns, min: 4, max: 200 },
      { key: 'cellSize', label: "Maze Size", value: settings.cellSize, min: 2, max: 80 },
      { key: 'wallThickness', label: "Wall thickness", value: settings.wallThickness, min: 1, max: 10 }
    ],
    circular: [
      { key: 'rows', label: "Rings", value: settings.rows, min: 5, max: 80 },
      { key: 'columns', label: "Sectors", value: settings.columns, min: 5, max: 80 },
      { key: 'wallThickness', label: "Wall thickness", value: settings.wallThickness, min: 1, max: 10 },
      { key: 'cellSize', label: "Maze Size", value: settings.cellSize, min: 2, max: 80 }
    ],
    polygon: [
      { key: 'polygonSides', label: "Number of Sides", value: settings.polygonSides, min: 3, max: 10, step: 1 },
      { key: 'rows', label: "Rows", value: settings.rows, min: 5, max: 80 },
      { key: 'columns', label: "Columns", value: settings.columns, min: 5, max: 80 },
      { key: 'wallThickness', label: "Wall thickness", value: settings.wallThickness, min: 1, max: 10 },
      { key: 'cellSize', label: "Maze Size", value: settings.cellSize, min: 2, max: 80 }
    ],
    text: [
      { key: 'letterSize', label: "Letter Size", value: settings.letterSize, min: 5, max: 20 },
      { key: 'letterDistance', label: "Letter Distance", value: settings.letterDistance, min: 5, max: 20 },
      { key: 'cellSize', label: "Maze Size", value: settings.cellSize, min: 2, max: 80 },
      { key: 'wallThickness', label: "Wall thickness", value: settings.wallThickness, min: 1, max: 10 }
    ]
  };

  return (
    <AccordionItem value="appearance" className="border-t">
      <AccordionTrigger className="text-lg font-medium">
        Appearance
      </AccordionTrigger>
      <AccordionContent>
        <div className="pt-4 space-y-4">

          {frameType === 'text' && (
            <div className="flex items-center gap-4">
              <span>Text</span>
              <Input
                type="text"
                value={settings.text}
                onChange={(e) => onSettingChange('text', e.target.value.toUpperCase())}
                className="w-full px-3 py-2 border rounded-md"
                maxLength={10}
              />
            </div>
          )}

          {sliderConfigs[frameType]?.map((config) => (
            <NumberSlider
              key={config.key}
              label={config.label}
              value={config.value}
              onChange={(value, sliderInfo) => {
                onSettingChange(config.key as keyof AppearanceSettings, value);
              }}
              min={config.min ?? 5}
              max={config.max ?? 80}
              step={1}
            />
          ))}
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={settings.showArrows}
              label="Show Entrance/Exit Arrows"
              onChange={(checked: boolean) => onSettingChange('showArrows', checked)}
            />
          </div>

          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <label className="block mb-2 font-small">Wall</label>
              <Input
                type="color"
                value={settings.wallColor}
                onChange={(e) => onSettingChange('wallColor', e.target.value)}
                className="h-10 w-full"
              />
            </div>
            <div className="flex-1">
              <label className="block mb-2 font-small">Background</label>
              <Input
                type="color"
                value={settings.backgroundColor}
                onChange={(e) => onSettingChange('backgroundColor', e.target.value)}
                className="h-10 w-full"
              />
            </div>
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
};
