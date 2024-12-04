import React from 'react';

interface NumberSliderProps {
  value: number;
  onChange: (value: number, sliderInfo?: { label: string }) => void;  // Modified
  onChangeEnd?: () => void;
  min: number;
  max: number;
  step?: number;
  label: string;
  className?: string;
}

export const NumberSlider = ({
  value,
  onChange,
  onChangeEnd,
  min,
  max,
  step = 1,
  label,
  className = ""
}: NumberSliderProps) => (
  <div className={`flex flex-col ${className}`}>
    <label className="font-small">{label}: {value}</label>
    <input
      type="range"
      value={value}
      onChange={(e) => onChange(Number(e.target.value), { label })}
      onMouseDown={(startEvent) => {
        const slider = startEvent.target as HTMLInputElement;
        const sliderRect = slider.getBoundingClientRect();
        
        const handleMouseMove = (e: MouseEvent) => {
          const percent = Math.min(Math.max((e.clientX - sliderRect.left) / sliderRect.width, 0), 1);
          const newValue = Math.round((min + percent * (max - min)) / step) * step;
          console.log(`clientX: ${e.clientX}, percent: ${percent}, width: ${sliderRect.width}`);
          if (e.clientX >= sliderRect.left && e.clientX <= sliderRect.right) {
            onChange(newValue, { label });  // Pass slider info here too
          }
        };

        const handleMouseUp = () => {
          window.removeEventListener('mousemove', handleMouseMove);
          window.removeEventListener('mouseup', handleMouseUp);
          onChangeEnd?.();
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
      }}
      min={min}
      max={max}
      step={step}
      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer mt-2"
    />
  </div>
);

export default NumberSlider;