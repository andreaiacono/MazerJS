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
      { key: 'columns', label: "Columns", value: settings.columns, min: 4, max: 200 }
    ],
    circular: [
      { key: 'rows', label: "Rings", value: settings.rows, min: 5, max: 80 },
      { key: 'columns', label: "Sectors", value: settings.columns, min: 5, max: 80 }
    ],
    polygon: [
      { key: 'polygonSides', label: "Number of Sides", value: settings.polygonSides, min: 3, max: 10, step: 1 },
      { key: 'rows', label: "Rows", value: settings.rows, min: 5, max: 80 },
      { key: 'columns', label: "Columns", value: settings.columns, min: 5, max: 80 }
    ],
    text: [
      { key: 'letterSize', label: "Letter Size", value: settings.letterSize, min: 5, max: 20 },
      { key: 'letterDistance', label: "Letter Distance", value: settings.letterDistance, min: 5, max: 20 }
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
              // onChangeEnd={() => {
              // }}
              min={config.min ?? 5}
              max={config.max ?? 80}
              step={1}
            />
          ))}


          <NumberSlider
            label="Cell Size"
            value={settings.cellSize}
            onChange={(value) => onSettingChange('cellSize', value)}
            min={5}
            max={80}
          />

          <NumberSlider
            label="Wall Thickness"
            value={settings.wallThickness}
            onChange={(value) => onSettingChange('wallThickness', value)}
            min={1}
            max={10}
          />

          <div className="flex items-center space-x-2">
            <Checkbox
              checked={settings.showArrows}
              onCheckedChange={(checked: boolean) => onSettingChange('showArrows', checked)}
            />
            <label htmlFor="show-arrows" className="text-sm font-medium leading-none">
              Show Entrance/Exit Arrows
            </label>
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

// import React from 'react';
// import { Input } from '../../ui/input';
// import { Checkbox } from '../../ui/checkbox';
// import { NumberSlider } from '../../ui/number-slider';
// import { AccordionItem, AccordionTrigger, AccordionContent } from '../../ui/accordion'; import { FrameType } from '../../../utils/types';

// interface AppearanceSectionProps {
//   frameType: FrameType;
//   rows: number;
//   setRows: (value: number) => void;
//   columns: number;
//   setColumns: (value: number) => void;
//   polygonSides: number;
//   setPolygonSides: (value: number) => void;
//   cellSize: number;
//   setCellSize: (value: number) => void;
//   wallThickness: number;
//   setWallThickness: (value: number) => void;
//   showArrows: boolean;
//   setShowArrows: (value: boolean) => void;
//   wallColor: string;
//   setWallColor: (value: string) => void;
//   backgroundColor: string;
//   setBackgroundColor: (value: string) => void;
//   text: string;
//   setText: (value: string) => void;
// }

// export const AppearanceSection: React.FC<AppearanceSectionProps> = ({
//   frameType,
//   rows,
//   setRows,
//   columns,
//   setColumns,
//   polygonSides,
//   setPolygonSides,
//   cellSize,
//   setCellSize,
//   wallThickness,
//   setWallThickness,
//   showArrows,
//   setShowArrows,
//   wallColor,
//   setWallColor,
//   backgroundColor,
//   setBackgroundColor,
//   text,
//   setText,
// }) => {
//   const sliderConfigs = {
//     square: [
//       { label: "Rows", value: rows, onChange: (value: number) => setRows(value), min: 5, max: 80 },
//       { label: "Columns", value: columns, onChange: (value: number) => setColumns(value), min: 5, max: 80 }
//     ],
//     circular: [
//       { label: "Rings", value: rows, onChange: (value: number) => setRows(value), min: 5, max: 80 },
//       { label: "Sectors", value: columns, onChange: (value: number) => setColumns(value), min: 5, max: 80 }
//     ],
//     polygon: [
//       { label: "Number of Sides", value: polygonSides, onChange: (value: number) => setPolygonSides(value), min: 3, max: 10, step: 1 },
//       { label: "Rows", value: rows, onChange: (value: number) => setRows(value), min: 5, max: 80 },
//       { label: "Columns", value: columns, onChange: (value: number) => setColumns(value), min: 5, max: 80 }
//     ],
//     text: [
//       { label: "Rows", value: rows, onChange: (value: number) => setRows(value), min: 5, max: 80 }
//     ]
//   };

//   // const sliderConfigs = {
//   //   square: [
//   //     { label: "Rows", value: rows, onChange: setRows },
//   //     { label: "Columns", value: columns, onChange: setColumns }
//   //   ],
//   //   circular: [
//   //     { label: "Rings", value: rows, onChange: setRows },
//   //     { label: "Sectors", value: columns, onChange: setColumns }
//   //   ],
//   //   polygon: [
//   //     { label: "Number of Sides", value: polygonSides, onChange: setPolygonSides, min: 3, max: 10, step: 1 },
//   //     { label: "Rows", value: rows, onChange: setRows },
//   //     { label: "Columns", value: columns, onChange: setColumns }
//   //   ],
//   //   text: [
//   //     { label: "Rows", value: rows, onChange: setRows }
//   //   ]
//   // };

//   return (
//     <AccordionItem value="appearance" className="border-t">
//       <AccordionTrigger className="text-lg font-medium">
//         Appearance
//       </AccordionTrigger>
//       <AccordionContent>
//         <div className="pt-4 space-y-4">
//           {/* {sliderConfigs[frameType]?.map(({ label, ...props }, index) => (
//             <NumberSlider
//               key={index}
//               label={label}
//               min={props.min ?? 5}
//               max={props.max ?? 80}
//               {...props}
//             />
//           ))} */}
//           {sliderConfigs[frameType]?.map((config, index) => (
//             <NumberSlider
//               key={index}
//               {...config}
//               step={1}
//             />
//           ))}
//           {frameType === 'text' && (
//             <div>
//               <label className="block mb-2 font-small">Text</label>
//               <Input
//                 value={text}
//                 onChange={(e) => setText(e.target.value.toUpperCase())}
//                 maxLength={10}
//               />
//             </div>
//           )}

//           <NumberSlider
//             label="Cell Size"
//             value={cellSize}
//             onChange={setCellSize}
//             min={10}
//             max={80}
//           />

//           <NumberSlider
//             label="Wall Thickness"
//             value={wallThickness}
//             onChange={setWallThickness}
//             min={1}
//             max={10}
//           />

//           <div className="flex items-center space-x-2">
//             <Checkbox
//               id="show-arrows"
//               checked={showArrows}
//               onCheckedChange={(checked: boolean) => setShowArrows(checked)}
//             />
//             <label
//               htmlFor="show-arrows"
//               className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
//             >
//               Show Entrance/Exit Arrows
//             </label>
//           </div>

//           <div className="flex gap-4 items-center">
//             <div className="flex-1">
//               <label className="block mb-2 font-small">Wall</label>
//               <Input
//                 type="color"
//                 value={wallColor}
//                 onChange={(e) => setWallColor(e.target.value)}
//                 className="h-10 w-full"
//               />
//             </div>
//             <div className="flex-1">
//               <label className="block mb-2 font-small">Background</label>
//               <Input
//                 type="color"
//                 value={backgroundColor}
//                 onChange={(e) => setBackgroundColor(e.target.value)}
//                 className="h-10 w-full"
//               />
//             </div>
//           </div>
//         </div>
//       </AccordionContent>
//     </AccordionItem>
//   );
// };