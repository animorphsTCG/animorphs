
import React, { useState } from "react";
import { useSignUp } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

const ClerkRegistrationForm = () => {
  const { isLoaded, signUp, setActive } = useSignUp();
  const [emailAddress, setEmailAddress] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;

    setIsLoading(true);
    try {
      // Start the sign up process
      const result = await signUp.create({
        emailAddress,
        username,
        password,
        firstName,
        lastName,
      });

      // Send email verification code
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setPendingVerification(true);
    } catch (err: any) {
      toast({
        title: "Registration failed",
        description: err.errors?.[0]?.message || "Please check your information and try again.",
        variant: "destructive",
      });
      console.error("Registration error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !code) return;

    setIsLoading(true);
    try {
      // Attempt to verify with the code
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code,
      });

      if (completeSignUp.status === "complete") {
        // Sign up and verification successful
        await setActive({ session: completeSignUp.createdSessionId });
        toast({
          title: "Account created successfully",
          description: "Your account has been created and you are now logged in.",
        });
        
        // Update: Redirect to profile page instead of battle
        navigate("/profile");
      }
    } catch (err: any) {
      toast({
        title: "Verification failed",
        description: err.errors?.[0]?.message || "Please check your verification code and try again.",
        variant: "destructive",
      });
      console.error("Verification error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {!pendingVerification ? (
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
          <Button 
            type="submit" 
            className="w-full fantasy-button" 
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...
              </>
            ) : (
              "Register"
            )}
          </Button>
        </form>
      ) : (
        <form onSubmit={handleVerify} className="space-y-4">
          <div className="p-4 bg-blue-900/30 rounded border border-blue-700 mb-4">
            <p className="text-sm text-white">
              We've sent a verification code to your email. Please enter it below.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="code">Verification Code</Label>
            <Input
              id="code"
              placeholder="Enter verification code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              disabled={isLoading}
              className="bg-gray-800"
            />
          </div>
          <Button 
            type="submit" 
            className="w-full fantasy-button" 
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying...
              </>
            ) : (
              "Verify Email"
            )}
          </Button>
        </form>
      )}
    </>
  );
};

export default ClerkRegistrationForm;
