
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSignIn } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, AlertCircle } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { trackAuthAttempt } from "@/lib/clerkMonitoring";

const ClerkLoginForm = () => {
  const { isLoaded, signIn, setActive } = useSignIn();
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attemptCount, setAttemptCount] = useState(0);
  const [cooldownEndTime, setCooldownEndTime] = useState<number | null>(null);
  const [remainingCooldown, setRemainingCooldown] = useState(0);
  const navigate = useNavigate();

  // Check for existing cooldown from localStorage
  useEffect(() => {
    const storedCooldownEnd = localStorage.getItem("auth_cooldown_end");
    if (storedCooldownEnd) {
      const cooldownEnd = parseInt(storedCooldownEnd);
      if (cooldownEnd > Date.now()) {
        setCooldownEndTime(cooldownEnd);
        setRemainingCooldown(Math.ceil((cooldownEnd - Date.now()) / 1000));
      } else {
        localStorage.removeItem("auth_cooldown_end");
      }
    }
  }, []);

  // Countdown timer for cooldown
  useEffect(() => {
    if (remainingCooldown <= 0) return;
    
    const interval = setInterval(() => {
      const newRemaining = cooldownEndTime ? Math.ceil((cooldownEndTime - Date.now()) / 1000) : 0;
      
      if (newRemaining <= 0) {
        setCooldownEndTime(null);
        setRemainingCooldown(0);
        localStorage.removeItem("auth_cooldown_end");
        clearInterval(interval);
      } else {
        setRemainingCooldown(newRemaining);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [cooldownEndTime, remainingCooldown]);

  // Enforce rate limiting for login attempts
  const enforceRateLimit = () => {
    const newAttemptCount = attemptCount + 1;
    setAttemptCount(newAttemptCount);
    
    if (newAttemptCount >= 5) {
      const cooldownSeconds = Math.min(30 * Math.pow(2, Math.floor(newAttemptCount / 5) - 1), 300);
      const endTime = Date.now() + (cooldownSeconds * 1000);
      
      setCooldownEndTime(endTime);
      setRemainingCooldown(cooldownSeconds);
      localStorage.setItem("auth_cooldown_end", endTime.toString());
      
      setError(`Too many login attempts. Please try again in ${cooldownSeconds} seconds.`);
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;
    
    // Check if we're in a cooldown period
    if (remainingCooldown > 0) {
      setError(`Please wait ${remainingCooldown} seconds before trying again.`);
      return;
    }

    setError(null);
    setIsLoading(true);
    
    // Check rate limiting
    if (!enforceRateLimit()) {
      setIsLoading(false);
      return;
    }
    
    const startTime = performance.now(); 
    
    try {
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

      console.log("Sign in result:", result);

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        
        trackAuthAttempt('login', true, performance.now() - startTime, { 
          email: emailAddress,
          strategy: "password"
        });
        
        // Reset attempt count on success
        setAttemptCount(0);
        localStorage.removeItem("auth_cooldown_end");
        
        toast({
          title: "Login successful",
          description: "Welcome back!",
        });
        
        navigate("/profile");
      } else {
        // Handle multi-factor authentication or other flows
        if (result.status === "needs_second_factor") {
          trackAuthAttempt('login', false, performance.now() - startTime, { 
            email: emailAddress,
            status: "needs_second_factor"
          });
          
          navigate("/verify", {
            state: {
              email: emailAddress,
              verifyingSignUp: false
            }
          });
          
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
      
      trackAuthAttempt('login', false, performance.now() - startTime, { 
        email: emailAddress,
        error: err.message || "Unknown error"
      });
      
      if (err.message?.includes("network") || err.message?.includes("timeout")) {
        setError("Network error. Please check your internet connection and try again.");
      } else if (err.message?.includes("identifier") || err.message?.includes("password")) {
        setError("Invalid email or password. Please check your credentials.");
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
      
      {remainingCooldown > 0 && (
        <Alert variant="destructive" className="bg-red-900/50 border-red-700">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Too many login attempts. Please try again in {remainingCooldown} seconds.
          </AlertDescription>
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
            setError(null);
          }}
          required
          disabled={isLoading || remainingCooldown > 0}
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
          onChange={(e) => {
            setPassword(e.target.value);
            setError(null);
          }}
          required
          disabled={isLoading || remainingCooldown > 0}
          className="bg-gray-800"
        />
      </div>
      <Button 
        type="submit" 
        className="w-full fantasy-button" 
        disabled={isLoading || remainingCooldown > 0 || !emailAddress || !password}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Logging in...
          </>
        ) : remainingCooldown > 0 ? (
          `Try again in ${remainingCooldown}s`
        ) : (
          "Login"
        )}
      </Button>
    </form>
  );
};

export default ClerkLoginForm;
