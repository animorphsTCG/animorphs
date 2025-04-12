
import React from "react";

interface PasswordStrengthIndicatorProps {
  strength: string | undefined;
}

const PasswordStrengthIndicator = ({ strength }: PasswordStrengthIndicatorProps) => {
  if (!strength) return null;
  
  const getColorAndWidth = () => {
    switch (strength) {
      case 'weak':
        return { color: 'bg-red-500', width: 'w-1/3' };
      case 'medium':
        return { color: 'bg-yellow-500', width: 'w-2/3' };
      case 'strong':
        return { color: 'bg-green-500', width: 'w-full' };
      default:
        return { color: 'bg-gray-300', width: 'w-0' };
    }
  };
  
  const { color, width } = getColorAndWidth();
  
  return (
    <div className="mt-1">
      <div className="text-xs mb-1 flex justify-between">
        <span>Password strength</span>
        <span className="capitalize">{strength}</span>
      </div>
      <div className="h-1 w-full bg-gray-300 rounded-full overflow-hidden">
        <div className={`h-full ${color} ${width} transition-all duration-300`}></div>
      </div>
    </div>
  );
};

export default PasswordStrengthIndicator;
