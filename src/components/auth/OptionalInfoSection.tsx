
import React from "react";
import { Info } from "lucide-react";
import FormField from "./FormField";
import { ValidationResult } from "@/lib/validation";

interface OptionalInfoSectionProps {
  formData: {
    gender: string;
    country: string;
    vipCode: string;
  };
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  validations: Record<string, ValidationResult>;
}

const OptionalInfoSection = ({
  formData,
  handleChange,
  validations
}: OptionalInfoSectionProps) => {
  return (
    <div className="pt-4 border-t border-gray-700">
      <h3 className="text-sm font-medium mb-4 flex items-center">
        <Info className="h-3 w-3 inline mr-2" />
        Optional Information
      </h3>
      
      <div className="grid grid-cols-2 gap-4">
        <FormField
          id="gender"
          name="gender"
          label="Gender"
          placeholder="Your gender"
          value={formData.gender}
          onChange={handleChange}
          className="bg-gray-800"
        />
        
        <FormField
          id="country"
          name="country"
          label="Country"
          placeholder="Your country"
          value={formData.country}
          onChange={handleChange}
          className="bg-gray-800"
        />
      </div>
      
      <div className="mt-4 space-y-2">
        <FormField
          id="vipCode"
          name="vipCode"
          label="VIP Code (if you have one)"
          placeholder="Enter your VIP code"
          value={formData.vipCode}
          onChange={handleChange}
          validation={validations.vipCode}
          className="bg-gray-800"
        />
        <p className="text-xs text-gray-400">Available codes: ZypherDan, WonAgainstAi</p>
      </div>
    </div>
  );
};

export default OptionalInfoSection;
