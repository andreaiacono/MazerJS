import React from 'react';
import { Input } from '../../ui/input';
import { Checkbox } from '../../ui/checkbox';
import { NumberSlider } from '../../ui/number-slider';
import { AccordionItem, AccordionTrigger, AccordionContent } from '../../ui/accordion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { FrameType, AppearanceSettings } from '../../../utils/types';
import { useMazeContext } from '../../../contexts/MazeContext';

interface AppearanceSectionProps {
  frameType: FrameType;
  setFrameType: (type: FrameType) => void;
  settings: AppearanceSettings;
  onSettingChange: (setting: keyof AppearanceSettings, value: any) => void;
}

export const AppearanceSection: React.FC<AppearanceSectionProps> = ({
  frameType,
  setFrameType,
  settings,
  onSettingChange,
}) => {
  const { generateMaze } = useMazeContext();

  const sliderConfigs = {
    square: [
      { key: 'rows', label: "Rows", value: settings.rows, min: 2, max: 200, start: 10 },
      { key: 'columns', label: "Columns", value: settings.columns, min: 4, max: 200, start: 10 },
      { key: 'wallThickness', label: "Wall thickness", value: settings.wallThickness, min: 1, max: 10, start: 2 },
      { key: 'cellSize', label: "Zoom", value: settings.cellSize, min: 2, max: 80, start: 20 },
    ],
    circular: [
      { key: 'rows', label: "Rings", value: settings.rows, min: 4, max: 100, start: 10 },
      { key: 'columns', label: "Sectors", value: settings.columns, min: 4, max: 100, start: 10 },
      { key: 'wallThickness', label: "Wall thickness", value: settings.wallThickness, min: 1, max: 10, start: 2 },
      { key: 'cellSize', label: "Zoom", value: settings.cellSize, min: 2, max: 80, start: 20 },
    ],
    polygon: [
      { key: 'polygonSides', label: "Number of Sides", value: settings.polygonSides, min: 3, max: 20, step: 1, start: 5 },
      { key: 'rows', label: "Rings", value: settings.rows, min: 4, max: 100, start: 10 },
      { key: 'columns', label: "Sectors", value: settings.columns, min: 4, max: 200, start: 10 },
      { key: 'wallThickness', label: "Wall thickness", value: settings.wallThickness, min: 1, max: 10, start: 2 },
      { key: 'cellSize', label: "Zoom", value: settings.cellSize, min: 2, max: 80, start: 20 },
    ],
    text: [
      { key: 'letterSize', label: "Letter Size", value: settings.letterSize, min: 5, max: 20, start: 10 },
      { key: 'letterDistance', label: "Letter Distance", value: settings.letterDistance, min: 1, max: 20, start: 10 },
      { key: 'wallThickness', label: "Wall thickness", value: settings.wallThickness, min: 1, max: 10, start: 2 },
      { key: 'cellSize', label: "Zoom", value: settings.cellSize, min: 2, max: 80, start: 20 },
    ]
  };

  const handleFrameTypeChange = (newType: FrameType) => {
    // First update the frame type
    setFrameType(newType);

    // Then update all the settings for the new frame type with their default values
    if (sliderConfigs[newType]) {
      const updates = sliderConfigs[newType].reduce((acc, config) => {
        acc[config.key] = config.start;
        return acc;
      }, {} as Partial<AppearanceSettings>);

      // Apply all settings updates at once
      Object.entries(updates).forEach(([key, value]) => {
        onSettingChange(key as keyof AppearanceSettings, value);
      });

      // Reset text when switching to/from text frame type
      if (newType === 'text') {
        onSettingChange('text', 'MAZE');
      } else if (frameType === 'text') {
        onSettingChange('text', '');
      }
    }

    // Finally generate the maze with the new settings
    generateMaze();
  };

  return (
    <AccordionItem value="appearance" className="border-t">
      <AccordionTrigger className="text-lg font-medium">
        Appearance
      </AccordionTrigger>
      <AccordionContent>
        <div className="pt-4 space-y-4">
          <div>
            <label className="block mb-2 font-medium">Frame Type</label>
            <Select value={frameType} onValueChange={handleFrameTypeChange}>
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
              onChange={(value) => {
                onSettingChange(config.key as keyof AppearanceSettings, value);
              }}
              min={config.min ?? 5}
              max={config.max ?? 80}
              step={1}
            />
          ))}

          {frameType === 'polygon' && (
            <div className="flex items-center space-x-2">
            <Checkbox
              disabled={true}
              checked={false}
              label="Perpendicular Walls"
              onChange={(checked: boolean) => onSettingChange('perpendicularWalls', checked)}
            />
          </div>
          )}
          
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={settings.showArrows}
              disabled={false}
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