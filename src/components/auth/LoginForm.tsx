import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { validateEmail } from "@/lib/validation";
import { recordAuthAttempt, isAccountLocked, getLockoutTimeRemaining } from "@/lib/authSecurity";
import { AlertCircle, Loader2, Mail } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";

const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutTime, setLockoutTime] = useState(0);
  const [showEmailVerificationReminder, setShowEmailVerificationReminder] = useState(false);
  
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setShowEmailVerificationReminder(false);
    
    if (isAccountLocked(email)) {
      setIsLocked(true);
      setLockoutTime(getLockoutTimeRemaining(email));
      setErrorMessage(`Too many failed attempts. Please try again in ${Math.ceil(lockoutTime / 60)} minutes.`);
      return;
    }
    
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      setErrorMessage(emailValidation.message || "Invalid email");
      return;
    }
    
    if (!password || password.length < 6) {
      setErrorMessage("Password must be at least 6 characters");
      return;
    }
    
    setIsLoading(true);
    
    try {
      console.log("Attempting login with:", { email });
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      console.log("Login response:", { data, error });
      
      recordAuthAttempt(email, !error);

      if (error) {
        console.error("Login error:", error);
        
        if (error.message === "Email not confirmed") {
          setShowEmailVerificationReminder(true);
          setErrorMessage("Your email address has not been verified. Please check your inbox for the verification link.");
        } else if (error.message === "Invalid login credentials") {
          setErrorMessage("Incorrect email or password");
        } else {
          setErrorMessage(error.message);
        }
        
        toast({
          title: "Login failed",
          description: "Please check your credentials and try again",
          variant: "destructive",
        });
      } else if (data?.user) {
        console.log("Login successful, user:", data.user);
        
        await refreshUser();
        
        toast({
          title: "Login successful",
          description: "Welcome back!",
        });
        
        navigate("/battle");
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

  const handleResendVerification = async () => {
    if (!email || !validateEmail(email).valid) {
      setErrorMessage("Please enter a valid email address");
      return;
    }
    
    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: window.location.origin + '/login'
        }
      });
      
      if (error) {
        console.error("Error resending verification email:", error);
        setErrorMessage(error.message);
        toast({
          title: "Verification email failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        setShowEmailVerificationReminder(true);
        toast({
          title: "Verification email sent",
          description: "Please check your inbox and spam folder for the verification link",
        });
      }
    } catch (err) {
      console.error("Unexpected error resending verification:", err);
      setErrorMessage("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      {errorMessage && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}
      
      {showEmailVerificationReminder && (
        <Alert variant="default" className="bg-amber-900 border-amber-700">
          <Mail className="h-4 w-4" />
          <AlertDescription className="flex flex-col space-y-2">
            <span>Please verify your email address before logging in.</span>
            <p className="text-xs mt-1">
              If you can't find the email in your inbox, please check your spam folder.
              Verification emails typically arrive within a few minutes.
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleResendVerification}
              disabled={isLoading}
              className="mt-2 w-full"
            >
              Resend verification email
            </Button>
          </AlertDescription>
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
    </form>
  );
};

export default LoginForm;
