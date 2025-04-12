
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { validateEmail } from "@/lib/validation";
import { recordAuthAttempt, isAccountLocked, getLockoutTimeRemaining } from "@/lib/authSecurity";
import { AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";

const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutTime, setLockoutTime] = useState(0);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  useEffect(() => {
    if (email && isAccountLocked(email)) {
      setIsLocked(true);
      setLockoutTime(getLockoutTimeRemaining(email));
      
      const interval = setInterval(() => {
        const remaining = getLockoutTimeRemaining(email);
        setLockoutTime(remaining);
        
        if (remaining <= 0) {
          setIsLocked(false);
          clearInterval(interval);
        }
      }, 1000);
      
      return () => clearInterval(interval);
    } else {
      setIsLocked(false);
    }
  }, [email]);

  // Debug function to check if user exists
  const checkUserExists = async (email: string) => {
    try {
      // We can't use getUserByEmail directly, so we'll check by attempting a passwordless login
      const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false // This checks if the user exists without sending an email
        }
      });
      
      if (error && error.message.includes("User not found")) {
        return "User not found";
      } else if (error) {
        console.error("Error checking if user exists:", error);
        return `Error checking user: ${error.message}`;
      }
      
      return "User exists";
    } catch (err) {
      console.error("Exception checking if user exists:", err);
      return "Error checking user";
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setDebugInfo(null);
    
    // Check if account is locked
    if (isAccountLocked(email)) {
      setIsLocked(true);
      setLockoutTime(getLockoutTimeRemaining(email));
      setErrorMessage(`Too many failed attempts. Please try again in ${Math.ceil(lockoutTime / 60)} minutes.`);
      return;
    }
    
    // Validate email
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      setErrorMessage(emailValidation.message || "Invalid email");
      return;
    }
    
    // Validate password
    if (!password || password.length < 6) {
      setErrorMessage("Password must be at least 6 characters");
      return;
    }
    
    setIsLoading(true);
    
    try {
      console.log("Attempting login with:", { email });
      
      // Improved login logic with retries
      let loginAttempt = 1;
      const maxAttempts = 2;
      let success = false;
      let loginError = null;
      let userData = null;

      while (loginAttempt <= maxAttempts && !success) {
        console.log(`Login attempt ${loginAttempt}/${maxAttempts}`);
        
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) {
          console.error(`Login error (attempt ${loginAttempt}/${maxAttempts}):`, error);
          loginError = error;
          loginAttempt++;
          
          // Short delay before retry
          if (loginAttempt <= maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        } else {
          success = true;
          userData = data;
          break;
        }
      }

      // Record the auth attempt result
      recordAuthAttempt(email, success);
      
      if (!success) {
        console.error("Login failed after all attempts:", loginError);
        
        // Provide more helpful error messages
        if (loginError?.message === "Invalid login credentials") {
          setErrorMessage("Incorrect email or password");
          
          // Add debug information for development
          const userCheck = await checkUserExists(email);
          setDebugInfo(`Debug info: ${userCheck}`);
        } else if (loginError?.message.includes("Email not confirmed")) {
          setErrorMessage("Your email is not confirmed. Please check your inbox for a confirmation email.");
        } else {
          setErrorMessage(loginError?.message || "Login failed");
        }
        
        toast({
          title: "Login failed",
          description: "Please check your credentials and try again",
          variant: "destructive",
        });
      } else if (userData?.user) {
        console.log("Login successful, user:", userData.user);
        
        // Wait a moment before refreshing to ensure Supabase trigger has run
        setTimeout(async () => {
          // Refresh user data to ensure profile is loaded
          await refreshUser();
          
          toast({
            title: "Login successful",
            description: "Welcome back!",
          });
          
          navigate("/battle");
        }, 1000);
      } else {
        console.error("No user data returned after successful login");
        setErrorMessage("An unexpected error occurred. Please try again.");
      }
    } catch (err) {
      console.error("Unexpected login error:", err);
      setErrorMessage("An unexpected error occurred. Please try again.");
      recordAuthAttempt(email, false);
      toast({
        title: "Login error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatLockoutTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      {errorMessage && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}
      
      {debugInfo && process.env.NODE_ENV === "development" && (
        <Alert variant="default" className="bg-gray-800 border-gray-700">
          <AlertDescription>{debugInfo}</AlertDescription>
        </Alert>
      )}
      
      {isLocked && lockoutTime > 0 && (
        <Alert variant="destructive" className="bg-red-900 border-red-700">
          <AlertDescription className="flex flex-col space-y-2">
            <span>Account temporarily locked due to too many failed attempts.</span>
            <span>Try again in: {formatLockoutTime(lockoutTime)}</span>
          </AlertDescription>
        </Alert>
      )}
      
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="your.email@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isLoading || isLocked}
          className="bg-gray-800"
        />
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between">
          <Label htmlFor="password">Password</Label>
          <Link
            to="/forgot-password"
            className="text-sm text-fantasy-accent hover:underline"
          >
            Forgot password?
          </Link>
        </div>
        <Input
          id="password"
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={isLoading || isLocked}
          className="bg-gray-800"
        />
      </div>
      
      <Button
        type="submit"
        className="w-full fantasy-button"
        disabled={isLoading || isLocked}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Logging in...
          </>
        ) : (
          "Login"
        )}
      </Button>
      
      <div className="text-center mt-4">
        <p className="text-sm text-gray-400">
          Don't have an account?{" "}
          <Link to="/register" className="text-fantasy-accent hover:underline">
            Register here
          </Link>
        </p>
      </div>
    </form>
  );
};

export default LoginForm;
