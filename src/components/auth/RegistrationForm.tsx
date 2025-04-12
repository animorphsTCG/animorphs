
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { validateEmail, validatePassword, validateUsername, validateAge, validateName, validateVipCode, ValidationResult } from "@/lib/validation";
import { validateVipCode as validateVipCodeServer, updateVipCodeUsage } from "@/lib/db";

import RegistrationFormHeader from "./RegistrationFormHeader";
import PersonalInfoSection from "./PersonalInfoSection";
import OptionalInfoSection from "./OptionalInfoSection";
import RegistrationFormFooter from "./RegistrationFormFooter";

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
  
  const [validations, setValidations] = useState<Record<string, ValidationResult>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [passwordStrength, setPasswordStrength] = useState<string | undefined>(undefined);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [vipCodeValidationInProgress, setVipCodeValidationInProgress] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  
  const navigate = useNavigate();

  const validateField = (name: string, value: any) => {
    let result: ValidationResult = { valid: true };
    
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
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    setErrorMessage(null);
    
    validateField(name, value);
  };
  
  const isFormValid = () => {
    const requiredFields = ["username", "email", "password", "confirmPassword", "name", "surname", "age"];
    
    for (const field of requiredFields) {
      if (!formData[field as keyof typeof formData]) {
        return false;
      }
    }
    
    for (const field of requiredFields) {
      const validation = validations[field];
      if (!validation || !validation.valid) {
        return false;
      }
    }
    
    if (formData.password !== formData.confirmPassword) {
      return false;
    }
    
    if (!agreedToTerms) {
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setRegistrationSuccess(false);
    
    let formIsValid = true;
    
    for (const [field, value] of Object.entries(formData)) {
      const valid = validateField(field, value);
      if (!valid && field !== "gender" && field !== "country" && field !== "vipCode") {
        formIsValid = false;
      }
    }
    
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
      // Handle VIP code validation first
      let vipCodeValid = true;
      if (formData.vipCode.trim()) {
        console.log(`Validating VIP code: "${formData.vipCode.trim()}"`);
        setVipCodeValidationInProgress(true);
        
        try {
          const isValidCode = await validateVipCodeServer(formData.vipCode);
          if (!isValidCode) {
            setErrorMessage("Invalid VIP code or code has reached maximum uses");
            setIsLoading(false);
            setVipCodeValidationInProgress(false);
            vipCodeValid = false;
            return;
          }
          console.log("VIP code validated successfully");
        } catch (vipError) {
          console.error("VIP code validation error:", vipError);
          setErrorMessage("Error validating VIP code. Please try again.");
          setIsLoading(false);
          setVipCodeValidationInProgress(false);
          vipCodeValid = false;
          return;
        } finally {
          setVipCodeValidationInProgress(false);
        }
      }
      
      if (!vipCodeValid) return;
      
      console.log("Registering user with Supabase");
      // Convert age to integer
      const ageInt = parseInt(formData.age);
      
      // Register the user with their profile data
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            username: formData.username,
            name: formData.name,
            surname: formData.surname,
            age: ageInt,
            gender: formData.gender || null,
            country: formData.country || null
          },
          emailRedirectTo: window.location.origin
        }
      });
      
      console.log("Registration response:", { data, error });
      
      if (error) {
        console.error("Registration error:", error);
        setErrorMessage(error.message);
        toast({
          title: "Registration failed",
          description: error.message,
          variant: "destructive",
        });
      } else if (data?.user) {
        console.log("Registration successful:", data.user);
        
        // Update VIP code usage if provided
        if (formData.vipCode.trim()) {
          console.log(`Updating VIP code usage: "${formData.vipCode.trim()}"`);
          try {
            const updated = await updateVipCodeUsage(formData.vipCode);
            if (!updated) {
              console.warn("Failed to update VIP code usage");
            } else {
              console.log("VIP code usage updated successfully");
            }
          } catch (vipUpdateError) {
            console.error("Error updating VIP code usage:", vipUpdateError);
          }
        }
        
        setRegistrationSuccess(true);
        
        toast({
          title: "Registration successful!",
          description: "You can now log in with your email and password.",
        });
        
        // Attempt to log in the user immediately if the user isn't required to confirm email
        if (data.session) {
          console.log("User logged in automatically:", data.session);
          setTimeout(() => {
            navigate("/battle");
          }, 1500);
        } else {
          // If no session was returned, we need to attempt manual login
          try {
            console.log("Attempting manual login after registration");
            const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
              email: formData.email,
              password: formData.password
            });
            
            if (loginError) {
              console.error("Manual login failed:", loginError);
              // If email confirmation is required, show appropriate message
              if (loginError.message.includes("Email not confirmed")) {
                setErrorMessage("Please check your email to confirm your account before logging in.");
              }
              // Redirect to login page after delay
              setTimeout(() => {
                navigate("/login");
              }, 2500);
            } else {
              console.log("Manual login successful:", loginData);
              // Redirect to battle page if login succeeds
              setTimeout(() => {
                navigate("/battle");
              }, 1500);
            }
          } catch (loginErr) {
            console.error("Unexpected login error:", loginErr);
            // Fallback to login page
            setTimeout(() => {
              navigate("/login");
            }, 2000);
          }
        }
      } else {
        // This should not happen but handle it just in case
        console.error("No user data returned but no error either");
        setErrorMessage("An unexpected error occurred during registration. Please try again.");
        toast({
          title: "Registration error",
          description: "An unexpected error occurred. Please try again.",
          variant: "destructive",
        });
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
      <RegistrationFormHeader errorMessage={errorMessage} />
      
      {registrationSuccess && (
        <div className="p-4 mb-4 text-sm text-green-700 bg-green-100 rounded-lg dark:bg-green-900 dark:text-green-300">
          <p>Registration successful! Redirecting you...</p>
        </div>
      )}
      
      {!registrationSuccess && (
        <>
          <PersonalInfoSection 
            formData={formData} 
            handleChange={handleChange} 
            validations={validations}
            passwordStrength={passwordStrength}
          />
          
          <OptionalInfoSection 
            formData={formData} 
            handleChange={handleChange} 
            validations={validations} 
          />
          
          <RegistrationFormFooter 
            isLoading={isLoading}
            vipCodeValidationInProgress={vipCodeValidationInProgress}
            isFormValid={isFormValid()}
            agreedToTerms={agreedToTerms}
            setAgreedToTerms={setAgreedToTerms}
          />
        </>
      )}
    </form>
  );
};

export default RegistrationForm;
