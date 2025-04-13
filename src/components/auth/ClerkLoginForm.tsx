import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSignIn } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, AlertCircle } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

const ClerkLoginForm = () => {
  const { isLoaded, signIn, setActive } = useSignIn();
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attemptCount, setAttemptCount] = useState(0);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;

    setError(null);
    setIsLoading(true);
    
    try {
      // Track login attempts for rate limiting
      setAttemptCount(prev => prev + 1);
      
      // Add basic input validation
      if (!emailAddress || !emailAddress.includes('@')) {
        throw new Error("Please enter a valid email address");
      }
      
      if (!password || password.length < 6) {
        throw new Error("Password must be at least 6 characters");
      }

      const result = await signIn.create({
        identifier: emailAddress,
        password,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        toast({
          title: "Login successful",
          description: "Welcome back!",
        });
        
        navigate("/profile");
      } else {
        // Handle multi-factor authentication or other flows
        if (result.status === "needs_second_factor") {
          toast({
            title: "Additional verification needed",
            description: "Please complete the second factor authentication",
          });
        } else if (result.status === "needs_identifier") {
          setError("Please enter your email address");
        } else if (result.status === "needs_first_factor") {
          setError("Please enter your password");
        } else {
          setError("Please complete additional steps to login");
        }
      }
    } catch (err: any) {
      console.error("Login error:", err);
      
      // Implement exponential backoff for repeated failed attempts
      if (attemptCount > 5) {
        setError("Too many login attempts. Please try again later.");
        
        // Reset attempt count after 30 seconds
        setTimeout(() => {
          setAttemptCount(0);
        }, 30000);
      } else {
        setError(err.errors?.[0]?.message || "Login failed. Please check your credentials and try again");
      }
      
      toast({
        title: "Login failed",
        description: err.errors?.[0]?.message || "Please check your credentials and try again",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
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
          onChange={(e) => setEmailAddress(e.target.value)}
          required
          disabled={isLoading || attemptCount > 5}
          className="bg-gray-800"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          placeholder="Your password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={isLoading || attemptCount > 5}
          className="bg-gray-800"
        />
      </div>
      <Button 
        type="submit" 
        className="w-full fantasy-button" 
        disabled={isLoading || attemptCount > 5}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Logging in...
          </>
        ) : (
          "Login"
        )}
      </Button>
    </form>
  );
};

export default ClerkLoginForm;
