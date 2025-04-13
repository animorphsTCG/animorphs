
import React, { useState } from "react";
import { useSignUp } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import TermsAndConditionsDialog from "@/components/TermsAndConditionsDialog";

const ClerkRegistrationForm = () => {
  const { isLoaded, signUp } = useSignUp();
  const [emailAddress, setEmailAddress] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showTermsDialog, setShowTermsDialog] = useState(false);
  const navigate = useNavigate();

  const isFormValid = () => {
    return emailAddress && username && password && firstName && lastName && agreedToTerms;
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

    setIsLoading(true);
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

      // Send email verification code
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      console.log("Verification email sent");
      
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
    } catch (err: any) {
      console.error("Registration error:", err);
      toast({
        title: "Registration failed",
        description: err.errors?.[0]?.message || "Please check your information and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
          onChange={(e) => setEmailAddress(e.target.value)}
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
          onChange={(e) => setUsername(e.target.value)}
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
            onChange={(e) => setFirstName(e.target.value)}
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
            onChange={(e) => setLastName(e.target.value)}
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
          placeholder="Choose a password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={isLoading}
          className="bg-gray-800"
        />
      </div>
      
      <div className="flex items-center space-x-2 pt-2">
        <Checkbox 
          id="terms" 
          checked={agreedToTerms}
          onCheckedChange={(checked) => {
            setAgreedToTerms(checked === true);
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
