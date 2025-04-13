
import React, { useState, useCallback } from "react";
import { useSignUp } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, AlertCircle } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import TermsAndConditionsDialog from "@/components/TermsAndConditionsDialog";
import { trackAuthAttempt } from "@/lib/clerkMonitoring";

const ClerkRegistrationForm = () => {
  const { isLoaded, signUp } = useSignUp();
  const [emailAddress, setEmailAddress] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showTermsDialog, setShowTermsDialog] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);
  const navigate = useNavigate();

  const isFormValid = useCallback(() => {
    return (
      emailAddress && 
      emailAddress.includes('@') &&
      username && 
      password && 
      password.length >= 6 &&
      firstName && 
      lastName && 
      agreedToTerms
    );
  }, [emailAddress, username, password, firstName, lastName, agreedToTerms]);

  const validateForm = () => {
    if (!emailAddress || !emailAddress.includes('@')) {
      setErrorMessage("Please enter a valid email address");
      return false;
    }
    
    if (!username || username.length < 3) {
      setErrorMessage("Username must be at least 3 characters");
      return false;
    }
    
    if (!password || password.length < 6) {
      setErrorMessage("Password must be at least 6 characters");
      return false;
    }
    
    if (!firstName || !lastName) {
      setErrorMessage("First and last name are required");
      return false;
    }
    
    if (!agreedToTerms) {
      setErrorMessage("You must agree to the Terms and Conditions");
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;

    if (!agreedToTerms) {
      toast({
        title: "Terms and Conditions Required",
        description: "You must agree to the Terms and Conditions to register.",
        variant: "destructive",
      });
      return;
    }

    if (!validateForm()) {
      toast({
        title: "Invalid Form",
        description: errorMessage || "Please check your information",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setAttemptCount(prev => prev + 1);
    
    const startTime = performance.now();

    try {
      console.log("Starting sign up process", { emailAddress, username });
      
      // Start the sign up process
      const result = await signUp.create({
        emailAddress,
        username,
        password,
        firstName,
        lastName,
        // Include terms acceptance metadata
        unsafeMetadata: {
          termsAccepted: true,
          termsAcceptedAt: new Date().toISOString(),
        }
      });

      console.log("Sign up creation result:", result);

      if (result.status === 'missing_requirements') {
        const missingFields = result.missingFields || [];
        
        if (missingFields.includes('email_address')) {
          throw new Error("Email address verification is required");
        }
      }
      
      if (result.status !== 'complete') {
        // Send email verification code
        await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
        console.log("Verification email sent");
        
        trackAuthAttempt('signup', true, performance.now() - startTime, { 
          email: emailAddress, 
          requiresVerification: true 
        });
        
        // Navigate to the verification page with email info
        navigate("/verify", { 
          state: { 
            email: emailAddress,
            verifyingSignUp: true
          }
        });
        
        toast({
          title: "Verification code sent",
          description: "Please check your email for the verification code",
        });
      } else {
        // If registration somehow completed without verification (depends on Clerk settings)
        trackAuthAttempt('signup', true, performance.now() - startTime, { 
          email: emailAddress, 
          requiresVerification: false 
        });
        
        toast({
          title: "Registration successful",
          description: "Your account has been created successfully.",
        });
        
        navigate("/profile");
      }
    } catch (err: any) {
      console.error("Registration error:", err);
      
      trackAuthAttempt('signup', false, performance.now() - startTime, { 
        email: emailAddress, 
        error: err.message || "Unknown error"
      });
      
      // Special handling for common errors
      if (err.message?.includes("identifier already exists")) {
        setErrorMessage("This email or username is already registered. Try logging in instead.");
        toast({
          title: "Account already exists",
          description: "Please use the login page instead.",
          variant: "destructive",
        });
      } else if (err.message?.includes("password")) {
        setErrorMessage("Password is too weak. Please choose a stronger password.");
      } else if (err.message?.includes("network") || err.message?.includes("timeout")) {
        setErrorMessage("Network error. Please check your internet connection and try again.");
      } else {
        setErrorMessage(err.message || "Registration failed. Please try again.");
        toast({
          title: "Registration failed",
          description: err.message || "Please check your information and try again.",
          variant: "destructive",
        });
      }
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
      
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          placeholder="Your email address"
          type="email"
          autoCapitalize="none"
          autoComplete="email"
          autoCorrect="off"
          value={emailAddress}
          onChange={(e) => {
            setEmailAddress(e.target.value);
            setErrorMessage(null);
          }}
          required
          disabled={isLoading}
          className="bg-gray-800"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          placeholder="Choose a username"
          type="text"
          autoCapitalize="none"
          autoComplete="username"
          autoCorrect="off"
          value={username}
          onChange={(e) => {
            setUsername(e.target.value);
            setErrorMessage(null);
          }}
          required
          disabled={isLoading}
          className="bg-gray-800"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name</Label>
          <Input
            id="firstName"
            placeholder="First name"
            type="text"
            value={firstName}
            onChange={(e) => {
              setFirstName(e.target.value);
              setErrorMessage(null);
            }}
            required
            disabled={isLoading}
            className="bg-gray-800"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name</Label>
          <Input
            id="lastName"
            placeholder="Last name"
            type="text"
            value={lastName}
            onChange={(e) => {
              setLastName(e.target.value);
              setErrorMessage(null);
            }}
            required
            disabled={isLoading}
            className="bg-gray-800"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          placeholder="Choose a password (min. 6 characters)"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setErrorMessage(null);
          }}
          required
          disabled={isLoading}
          className="bg-gray-800"
          minLength={6}
        />
        {password && password.length < 6 && (
          <p className="text-xs text-red-500 mt-1">Password must be at least 6 characters</p>
        )}
      </div>
      
      <div className="flex items-center space-x-2 pt-2">
        <Checkbox 
          id="terms" 
          checked={agreedToTerms}
          onCheckedChange={(checked) => {
            setAgreedToTerms(checked === true);
            if (checked === true) setErrorMessage(null);
          }}
          disabled={isLoading}
        />
        <Label 
          htmlFor="terms" 
          className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
        >
          I agree to the{" "}
          <button
            type="button"
            className="text-fantasy-accent hover:underline"
            onClick={(e) => {
              e.preventDefault();
              setShowTermsDialog(true);
            }}
          >
            Terms and Conditions
          </button>
        </Label>
      </div>
      
      <Button 
        type="submit" 
        className="w-full fantasy-button mt-2" 
        disabled={isLoading || !isFormValid()}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...
          </>
        ) : (
          "Register"
        )}
      </Button>
      
      <TermsAndConditionsDialog
        open={showTermsDialog}
        onOpenChange={setShowTermsDialog}
        onAgree={() => {
          setAgreedToTerms(true);
          setShowTermsDialog(false);
        }}
      />
    </form>
  );
};

export default ClerkRegistrationForm;
