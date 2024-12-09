import * as React from "react";
import { cn } from "../../lib/utils";

export interface CheckboxProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  label,
  checked,
  onChange,
  className = "",
}: CheckboxProps) => {
  return (
    <label
      className={cn(
        "flex items-center space-x-2 cursor-pointer",
        className
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
      />
      <span className="text-sm font-medium">{label}</span>
    </label>
  );
};

export default Checkbox;