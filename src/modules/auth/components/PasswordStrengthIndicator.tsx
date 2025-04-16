
import React from 'react';

interface PasswordStrengthIndicatorProps {
  password: string;
}

const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({ password }) => {
  // Calculate password strength
  const getPasswordStrength = (password: string) => {
    if (!password) return 0;
    
    let strength = 0;
    // Length check
    if (password.length >= 8) strength += 1;
    // Contains uppercase
    if (/[A-Z]/.test(password)) strength += 1;
    // Contains lowercase
    if (/[a-z]/.test(password)) strength += 1;
    // Contains number
    if (/\d/.test(password)) strength += 1;
    // Contains special character
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    
    return strength;
  };

  const strength = getPasswordStrength(password);
  
  // Calculate width based on strength
  const widthPercentage = (strength / 5) * 100;
  
  // Determine color based on strength
  const getColor = () => {
    if (strength <= 1) return 'bg-red-500';
    if (strength <= 3) return 'bg-yellow-500';
    return 'bg-green-500';
  };
  
  return (
    <div className="mt-1">
      <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${getColor()} transition-all duration-300`}
          style={{ width: `${widthPercentage}%` }}
        ></div>
      </div>
      <div className="mt-1 text-xs">
        {strength === 0 && <span className="text-gray-500">Enter a password</span>}
        {strength === 1 && <span className="text-red-500">Very weak</span>}
        {strength === 2 && <span className="text-red-500">Weak</span>}
        {strength === 3 && <span className="text-yellow-500">Moderate</span>}
        {strength === 4 && <span className="text-green-500">Strong</span>}
        {strength === 5 && <span className="text-green-500">Very strong</span>}
      </div>
    </div>
  );
};

export default PasswordStrengthIndicator;
