
import React, { useState } from "react";
import { useSignUp } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";
import { AlertCircle, Info, Loader2 } from "lucide-react";
import { validateEmail, validatePassword, validateUsername, validateName, validateAge } from "@/lib/validation";
import PasswordStrengthIndicator from "./PasswordStrengthIndicator";
import TermsAndConditionsDialog from "@/components/TermsAndConditionsDialog";

// Define the type for validation results including optional strength
interface ValidationResult {
  valid: boolean;
  message?: string;
  strength?: string;
}

const ClerkRegistrationForm = () => {
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
  });

  const [validations, setValidations] = useState<Record<string, ValidationResult>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [passwordStrength, setPasswordStrength] = useState<string | undefined>(undefined);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  const navigate = useNavigate();
  const { isLoaded, signUp, setActive } = useSignUp();

  if (!isLoaded) {
    return (
      <div className="flex justify-center items-center">
        <Loader2 className="animate-spin h-6 w-6 mr-2" />
        <p>Loading...</p>
      </div>
    );
  }

  const validateField = (name: string, value: any): boolean => {
    let result: ValidationResult = { valid: true };

    switch (name) {
      case "username":
        result = validateUsername(value) as ValidationResult;
        break;
      case "email":
        result = validateEmail(value) as ValidationResult;
        break;
      case "password":
        result = validatePassword(value) as ValidationResult;
        if (result.strength) {
          setPasswordStrength(result.strength);
        }
        break;
      case "confirmPassword":
        result = {
          valid: value === formData.password,
          message: value === formData.password ? undefined : "Passwords do not match",
        };
        break;
      case "name":
      case "surname":
        result = validateName(value) as ValidationResult;
        break;
      case "age":
        result = validateAge(value) as ValidationResult;
        break;
    }

    setValidations((prev) => ({ ...prev, [name]: result }));
    return result.valid;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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

    let formIsValid = true;

    for (const [field, value] of Object.entries(formData)) {
      const valid = validateField(field, value);
      if (!valid && field !== "gender" && field !== "country") {
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
      // Start the sign-up process
      await signUp.create({
        emailAddress: formData.email,
        password: formData.password,
        username: formData.username,
        firstName: formData.name,
        lastName: formData.surname,
        unsafeMetadata: {
          age: parseInt(formData.age),
          gender: formData.gender || null,
          country: formData.country || null
        }
      });

      // Prepare verification
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      
      // Show success message
      toast({
        title: "Registration started",
        description: "Please check your email for a verification code",
      });
      
      // Navigate to a verification page or show verification UI inline
      // For simplicity, we're redirecting to login but ideally you'd create a verify page
      navigate("/login");
    } catch (err: any) {
      console.error("Registration error:", err);
      
      if (err.errors && err.errors.length > 0) {
        // Handle specific clerk errors
        setErrorMessage(err.errors[0].message || "Registration failed");
      } else {
        setErrorMessage("An unexpected error occurred. Please try again.");
      }
      
      toast({
        title: "Registration failed",
        description: err.message || "Please check your information and try again",
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

      <Alert variant="default" className="bg-gray-800 border-gray-700">
        <Info className="h-4 w-4" />
        <AlertDescription className="text-xs">
          <p>After registration, you'll need to verify your email before logging in.</p>
          <p className="mt-1">
            <strong>Important:</strong> Remember your login credentials for future sessions:
          </p>
          <ul className="list-disc ml-4 mt-1">
            <li>Your registered email address</li>
            <li>The password you created during registration</li>
          </ul>
        </AlertDescription>
      </Alert>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">First Name</Label>
            <Input
              id="name"
              name="name"
              placeholder="Your first name"
              value={formData.name}
              onChange={handleChange}
              className="bg-gray-800"
              required
            />
            {validations.name && !validations.name.valid && (
              <p className="text-red-500 text-xs">{validations.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="surname">Last Name</Label>
            <Input
              id="surname"
              name="surname"
              placeholder="Your last name"
              value={formData.surname}
              onChange={handleChange}
              className="bg-gray-800"
              required
            />
            {validations.surname && !validations.surname.valid && (
              <p className="text-red-500 text-xs">{validations.surname.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            name="username"
            placeholder="Choose a unique username"
            value={formData.username}
            onChange={handleChange}
            className="bg-gray-800"
            required
          />
          {validations.username && !validations.username.valid && (
            <p className="text-red-500 text-xs">{validations.username.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="your.email@example.com"
            value={formData.email}
            onChange={handleChange}
            className="bg-gray-800"
            required
          />
          {validations.email && !validations.email.valid && (
            <p className="text-red-500 text-xs">{validations.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="age">Age</Label>
          <Input
            id="age"
            name="age"
            type="number"
            placeholder="Your age"
            value={formData.age}
            onChange={handleChange}
            className="bg-gray-800"
            min="13"
            max="120"
            required
          />
          {validations.age && !validations.age.valid && (
            <p className="text-red-500 text-xs">{validations.age.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="Create a secure password"
            value={formData.password}
            onChange={handleChange}
            className="bg-gray-800"
            required
          />
          {validations.password && !validations.password.valid && (
            <p className="text-red-500 text-xs">{validations.password.message}</p>
          )}
          <PasswordStrengthIndicator strength={passwordStrength} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            placeholder="Confirm your password"
            value={formData.confirmPassword}
            onChange={handleChange}
            className="bg-gray-800"
            required
          />
          {validations.confirmPassword && !validations.confirmPassword.valid && (
            <p className="text-red-500 text-xs">{validations.confirmPassword.message}</p>
          )}
        </div>

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
        </div>

        <div className="space-y-4 pt-4">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="terms"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="h-4 w-4"
            />
            <label htmlFor="terms" className="text-sm">
              I agree to the{" "}
              <button
                type="button"
                className="text-fantasy-accent hover:underline"
                onClick={() => setShowTerms(true)}
              >
                Terms and Conditions
              </button>
            </label>
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
      </div>

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

export default ClerkRegistrationForm;
