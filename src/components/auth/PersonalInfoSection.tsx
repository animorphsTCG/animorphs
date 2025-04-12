
import React from "react";
import FormField from "./FormField";
import PasswordStrengthIndicator from "./PasswordStrengthIndicator";
import { ValidationResult } from "@/lib/validation";

interface PersonalInfoSectionProps {
  formData: {
    name: string;
    surname: string;
    username: string;
    email: string;
    age: string;
    password: string;
    confirmPassword: string;
  };
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  validations: Record<string, ValidationResult>;
  passwordStrength: string | undefined;
}

const PersonalInfoSection = ({
  formData,
  handleChange,
  validations,
  passwordStrength
}: PersonalInfoSectionProps) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <FormField
          id="name"
          name="name"
          label="First Name"
          placeholder="Your first name"
          value={formData.name}
          onChange={handleChange}
          validation={validations.name}
          required
        />
        
        <FormField
          id="surname"
          name="surname"
          label="Last Name"
          placeholder="Your last name"
          value={formData.surname}
          onChange={handleChange}
          validation={validations.surname}
          required
        />
      </div>
      
      <FormField
        id="username"
        name="username"
        label="Username"
        placeholder="Choose a unique username"
        value={formData.username}
        onChange={handleChange}
        validation={validations.username}
        required
      />
      
      <FormField
        id="email"
        name="email"
        label="Email"
        placeholder="your.email@example.com"
        type="email"
        value={formData.email}
        onChange={handleChange}
        validation={validations.email}
        required
      />
      
      <FormField
        id="age"
        name="age"
        label="Age"
        placeholder="Your age"
        type="number"
        value={formData.age}
        onChange={handleChange}
        validation={validations.age}
        required
        min="13"
        max="120"
      />
      
      <div className="space-y-2">
        <FormField
          id="password"
          name="password"
          label="Password"
          placeholder="Create a secure password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          validation={validations.password}
          required
        />
        <PasswordStrengthIndicator strength={passwordStrength} />
      </div>
      
      <FormField
        id="confirmPassword"
        name="confirmPassword"
        label="Confirm Password"
        placeholder="Confirm your password"
        type="password"
        value={formData.confirmPassword}
        onChange={handleChange}
        validation={validations.confirmPassword}
        required
      />
    </div>
  );
};

export default PersonalInfoSection;
