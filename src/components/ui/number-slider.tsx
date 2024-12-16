import React, { useRef } from 'react';

interface NumberSliderProps {
  value: number;
  onChange: (value: number, sliderInfo?: { label: string }) => void;
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
}: NumberSliderProps) => {
  const lastValidValueRef = useRef(value);

  return (
    <div className={`flex flex-col ${className}`}>
      <label className="font-small">{label}: {value}</label>
      <input
        type="range"
        value={value}
        onChange={(e) => {
          const newValue = Number(e.target.value);
          lastValidValueRef.current = newValue;
          onChange(newValue, { label });
        }}
        min={min}
        max={max}
        step={step}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer mt-2"
      />
    </div>
  );
};

export default NumberSlider;