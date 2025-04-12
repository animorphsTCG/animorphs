
import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ValidationResult } from "@/lib/validation";

interface FormFieldProps {
  id: string;
  name: string;
  label: string;
  placeholder: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  validation?: ValidationResult;
  required?: boolean;
  className?: string;
  min?: string;
  max?: string;
  readOnly?: boolean;
}

const FormField = ({
  id,
  name,
  label,
  placeholder,
  type = "text",
  value,
  onChange,
  validation,
  required = false,
  className = "",
  min,
  max,
  readOnly = false
}: FormFieldProps) => {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      <Input
        id={id}
        name={name}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={`bg-gray-800 ${validation?.valid === false ? 'border-red-500' : ''} ${className}`}
        required={required}
        min={min}
        max={max}
        readOnly={readOnly}
      />
      {validation?.valid === false && (
        <p className="text-xs text-red-500">{validation.message}</p>
      )}
    </div>
  );
};

export default FormField;
