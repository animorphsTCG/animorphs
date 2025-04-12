
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { validateEmail, validatePassword, validateUsername, validateAge, validateName, validateVipCode } from "@/lib/validation";
import { validateVipCode as validateVipCodeServer, updateVipCodeUsage } from "@/lib/db";
import { AlertCircle, Info, Check, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import TermsAndConditionsDialog from "@/components/TermsAndConditionsDialog";

// Password strength indicator component
const PasswordStrengthIndicator = ({ strength }: { strength: string | undefined }) => {
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

const RegistrationForm = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    surname: "",
    age: "",
    gender: "",
    country: "",
    vipCode: ""
  });
  
  const [validations, setValidations] = useState<Record<string, { valid: boolean; message?: string; strength?: string }>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [passwordStrength, setPasswordStrength] = useState<string | undefined>(undefined);
  const [showTerms, setShowTerms] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  
  const navigate = useNavigate();

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error messages when user starts typing again
    setErrorMessage(null);
    
    // Live validation based on field
    validateField(name, value);
  };
  
  // Individual field validation
  const validateField = (name: string, value: any) => {
    let result = { valid: true };
    
    switch (name) {
      case "username":
        result = validateUsername(value);
        break;
      case "email":
        result = validateEmail(value);
        break;
      case "password":
        result = validatePassword(value);
        setPasswordStrength(result.strength);
        break;
      case "confirmPassword":
        result = {
          valid: value === formData.password,
          message: value === formData.password ? undefined : "Passwords do not match"
        };
        break;
      case "name":
      case "surname":
        result = validateName(value);
        break;
      case "age":
        result = validateAge(value);
        break;
      case "vipCode":
        result = validateVipCode(value);
        break;
    }
    
    setValidations(prev => ({ ...prev, [name]: result }));
    return result.valid;
  };
  
  // Check if all validations pass
  const isFormValid = () => {
    const requiredFields = ["username", "email", "password", "confirmPassword", "name", "surname", "age"];
    
    // Make sure required fields have values
    for (const field of requiredFields) {
      if (!formData[field as keyof typeof formData]) {
        return false;
      }
    }
    
    // Check if all validations are valid
    for (const field of requiredFields) {
      const validation = validations[field];
      if (!validation || !validation.valid) {
        return false;
      }
    }
    
    // Make sure passwords match
    if (formData.password !== formData.confirmPassword) {
      return false;
    }
    
    // Must agree to terms
    if (!agreedToTerms) {
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    
    // Validate all fields again on submit
    let formIsValid = true;
    
    for (const [field, value] of Object.entries(formData)) {
      const valid = validateField(field, value);
      if (!valid && field !== "gender" && field !== "country" && field !== "vipCode") {
        formIsValid = false;
      }
    }
    
    // Check additional validations
    if (!agreedToTerms) {
      setErrorMessage("You must agree to the Terms and Conditions");
      formIsValid = false;
    }
    
    if (!formIsValid) {
      toast({
        title: "Registration error",
        description: "Please check the form for errors",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // If VIP code is provided, validate it
      if (formData.vipCode) {
        const isValidCode = await validateVipCodeServer(formData.vipCode);
        if (!isValidCode) {
          setErrorMessage("Invalid VIP code or code has reached maximum uses");
          setIsLoading(false);
          return;
        }
      }
      
      // Register user with Supabase
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            username: formData.username,
            name: formData.name,
            surname: formData.surname,
            age: parseInt(formData.age),
            gender: formData.gender || null,
            country: formData.country || null
          }
        }
      });
      
      if (error) {
        console.error("Registration error:", error);
        setErrorMessage(error.message);
        toast({
          title: "Registration failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        console.log("Registration successful:", data);
        
        // Update VIP code usage if provided
        if (formData.vipCode) {
          await updateVipCodeUsage(formData.vipCode);
        }
        
        toast({
          title: "Registration successful!",
          description: "Check your email to verify your account.",
        });
        
        // Navigate to login page after successful registration
        navigate("/login");
      }
    } catch (err) {
      console.error("Unexpected registration error:", err);
      setErrorMessage("An unexpected error occurred. Please try again.");
      toast({
        title: "Registration error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errorMessage && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}
      
      {/* Required Fields Section */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">First Name <span className="text-red-500">*</span></Label>
            <Input
              id="name"
              name="name"
              placeholder="Your first name"
              value={formData.name}
              onChange={handleChange}
              className={`bg-gray-800 ${validations.name?.valid === false ? 'border-red-500' : ''}`}
              required
            />
            {validations.name?.valid === false && (
              <p className="text-xs text-red-500">{validations.name.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="surname">Last Name <span className="text-red-500">*</span></Label>
            <Input
              id="surname"
              name="surname"
              placeholder="Your last name"
              value={formData.surname}
              onChange={handleChange}
              className={`bg-gray-800 ${validations.surname?.valid === false ? 'border-red-500' : ''}`}
              required
            />
            {validations.surname?.valid === false && (
              <p className="text-xs text-red-500">{validations.surname.message}</p>
            )}
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="username">Username <span className="text-red-500">*</span></Label>
          <Input
            id="username"
            name="username"
            placeholder="Choose a unique username"
            value={formData.username}
            onChange={handleChange}
            className={`bg-gray-800 ${validations.username?.valid === false ? 'border-red-500' : ''}`}
            required
          />
          {validations.username?.valid === false && (
            <p className="text-xs text-red-500">{validations.username.message}</p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="your.email@example.com"
            value={formData.email}
            onChange={handleChange}
            className={`bg-gray-800 ${validations.email?.valid === false ? 'border-red-500' : ''}`}
            required
          />
          {validations.email?.valid === false && (
            <p className="text-xs text-red-500">{validations.email.message}</p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="age">Age <span className="text-red-500">*</span></Label>
          <Input
            id="age"
            name="age"
            type="number"
            placeholder="Your age"
            value={formData.age}
            onChange={handleChange}
            className={`bg-gray-800 ${validations.age?.valid === false ? 'border-red-500' : ''}`}
            min="13"
            max="120"
            required
          />
          {validations.age?.valid === false && (
            <p className="text-xs text-red-500">{validations.age.message}</p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="password">Password <span className="text-red-500">*</span></Label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="Create a secure password"
            value={formData.password}
            onChange={handleChange}
            className={`bg-gray-800 ${validations.password?.valid === false ? 'border-red-500' : ''}`}
            required
          />
          <PasswordStrengthIndicator strength={passwordStrength} />
          {validations.password?.valid === false && (
            <p className="text-xs text-red-500">{validations.password.message}</p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password <span className="text-red-500">*</span></Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            placeholder="Confirm your password"
            value={formData.confirmPassword}
            onChange={handleChange}
            className={`bg-gray-800 ${validations.confirmPassword?.valid === false ? 'border-red-500' : ''}`}
            required
          />
          {validations.confirmPassword?.valid === false && (
            <p className="text-xs text-red-500">{validations.confirmPassword.message}</p>
          )}
        </div>
      </div>
      
      {/* Optional Fields Section */}
      <div className="pt-4 border-t border-gray-700">
        <h3 className="text-sm font-medium mb-4 flex items-center">
          <Info className="h-3 w-3 inline mr-2" />
          Optional Information
        </h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="gender">Gender</Label>
            <Input
              id="gender"
              name="gender"
              placeholder="Your gender"
              value={formData.gender}
              onChange={handleChange}
              className="bg-gray-800"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <Input
              id="country"
              name="country"
              placeholder="Your country"
              value={formData.country}
              onChange={handleChange}
              className="bg-gray-800"
            />
          </div>
        </div>
        
        <div className="mt-4 space-y-2">
          <Label htmlFor="vipCode">VIP Code (if you have one)</Label>
          <Input
            id="vipCode"
            name="vipCode"
            placeholder="Enter your VIP code"
            value={formData.vipCode}
            onChange={handleChange}
            className={`bg-gray-800 ${validations.vipCode?.valid === false ? 'border-red-500' : ''}`}
          />
          {validations.vipCode?.valid === false && (
            <p className="text-xs text-red-500">{validations.vipCode.message}</p>
          )}
        </div>
      </div>
      
      {/* Terms and Conditions */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="terms"
            checked={agreedToTerms}
            onChange={(e) => setAgreedToTerms(e.target.checked)}
            className="h-4 w-4"
          />
          <Label htmlFor="terms" className="text-sm">
            I agree to the{" "}
            <button
              type="button"
              className="text-fantasy-accent hover:underline"
              onClick={() => setShowTerms(true)}
            >
              Terms and Conditions
            </button>
          </Label>
        </div>
        
        <Button
          type="submit"
          className="w-full fantasy-button"
          disabled={isLoading || !isFormValid()}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Registering...
            </>
          ) : (
            "Register"
          )}
        </Button>
      </div>
      
      {/* Terms and Conditions Dialog */}
      <TermsAndConditionsDialog 
        open={showTerms} 
        onOpenChange={setShowTerms} 
        onAgree={() => {
          setAgreedToTerms(true);
          setShowTerms(false);
        }}
      />
    </form>
  );
};

export default RegistrationForm;
