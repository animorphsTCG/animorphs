
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Define the form validation schema
const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters")
});

type LoginFormValues = z.infer<typeof loginSchema>;

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

const Login = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showVerificationMessage, setShowVerificationMessage] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);
  const [remainingTime, setRemainingTime] = useState<number>(0);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check for verification success in the URL
    const url = new URL(window.location.href);
    const error = url.searchParams.get("error");
    const errorDescription = url.searchParams.get("error_description");

    if (error === "unauthorized" && errorDescription?.includes("Email not confirmed")) {
      setShowVerificationMessage(true);
      toast({
        title: "Email Verification Required",
        description: "Please check your email and click the verification link.",
      });
    }

    // Check for verification confirmation
    if (location.hash && location.hash.includes("access_token")) {
      toast({
        title: "Email Verified",
        description: "Your email has been verified. You can now log in.",
      });
    }
    
    // Check if there's a stored lockout time in localStorage
    const storedLockoutUntil = localStorage.getItem('lockoutUntil');
    const storedLoginAttempts = localStorage.getItem('loginAttempts');
    
    if (storedLockoutUntil) {
      const lockoutTime = parseInt(storedLockoutUntil, 10);
      if (lockoutTime > Date.now()) {
        setLockoutUntil(lockoutTime);
      } else {
        // Lockout expired, clear it
        localStorage.removeItem('lockoutUntil');
        localStorage.removeItem('loginAttempts');
      }
    }
    
    if (storedLoginAttempts) {
      setLoginAttempts(parseInt(storedLoginAttempts, 10));
    }
  }, [location]);
  
  // Update remaining time for lockout
  useEffect(() => {
    if (!lockoutUntil) return;
    
    const updateRemainingTime = () => {
      const remaining = Math.max(0, lockoutUntil - Date.now());
      setRemainingTime(remaining);
      
      if (remaining <= 0) {
        // Lockout expired
        setLockoutUntil(null);
        localStorage.removeItem('lockoutUntil');
        setLoginAttempts(0);
        localStorage.removeItem('loginAttempts');
      }
    };
    
    // Initial update
    updateRemainingTime();
    
    // Update every second
    const interval = setInterval(updateRemainingTime, 1000);
    return () => clearInterval(interval);
  }, [lockoutUntil]);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: ""
    }
  });

  const handleLogin = async (values: LoginFormValues) => {
    // Check if account is locked out
    if (lockoutUntil && Date.now() < lockoutUntil) {
      toast({
        title: "Account Temporarily Locked",
        description: `Too many failed login attempts. Please try again in ${Math.ceil(remainingTime / 1000 / 60)} minutes.`,
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password
      });
      
      if (error) {
        // Increment login attempts
        const newAttempts = loginAttempts + 1;
        setLoginAttempts(newAttempts);
        localStorage.setItem('loginAttempts', newAttempts.toString());
        
        // Check if we should lock the account
        if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
          const lockTime = Date.now() + LOCKOUT_DURATION;
          setLockoutUntil(lockTime);
          localStorage.setItem('lockoutUntil', lockTime.toString());
          
          toast({
            title: "Account Temporarily Locked",
            description: "Too many failed login attempts. Your account has been temporarily locked for 5 minutes.",
            variant: "destructive",
          });
        } else {
          if (error.message.includes("Email not confirmed")) {
            setShowVerificationMessage(true);
            toast({
              title: "Email Verification Required",
              description: "Please check your email and click the verification link before logging in.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Login Failed",
              description: `${error.message} (Attempt ${newAttempts}/${MAX_LOGIN_ATTEMPTS})`,
              variant: "destructive",
            });
          }
        }
        
        setIsLoading(false);
        return;
      }
      
      // Success - reset attempts
      setLoginAttempts(0);
      localStorage.removeItem('loginAttempts');
      localStorage.removeItem('lockoutUntil');
      
      toast({
        title: "Login Successful",
        description: "Welcome back!",
      });
      
      // Redirect to home page
      navigate("/");
      
    } catch (err) {
      console.error("Login error:", err);
      toast({
        title: "Login Failed",
        description: "An unexpected error occurred. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    const email = form.getValues("email");
    
    if (!email) {
      toast({
        title: "Email Required",
        description: "Please enter your email address to resend the verification link.",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/login`
        }
      });
      
      if (error) {
        toast({
          title: "Resend Failed",
          description: error.message,
          variant: "destructive",
        });
        return;
      }
      
      toast({
        title: "Verification Email Sent",
        description: "Please check your inbox for the verification link.",
      });
    } catch (err) {
      console.error("Resend verification error:", err);
      toast({
        title: "Resend Failed",
        description: "An unexpected error occurred. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleResetPassword = async () => {
    const email = form.getValues("email");
    
    if (!email) {
      toast({
        title: "Email Required",
        description: "Please enter your email address to reset your password.",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) {
        toast({
          title: "Password Reset Failed",
          description: error.message,
          variant: "destructive",
        });
        return;
      }
      
      toast({
        title: "Password Reset Email Sent",
        description: "Please check your email for password reset instructions.",
      });
    } catch (err) {
      console.error("Password reset error:", err);
      toast({
        title: "Password Reset Failed",
        description: "An unexpected error occurred. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Disable form if locked out
  const isLocked = lockoutUntil && Date.now() < lockoutUntil;

  return (
    <div className="min-h-screen py-16 px-4">
      <div className="container mx-auto max-w-md">
        <Card className="border-2 border-fantasy-primary bg-black/70">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-fantasy text-fantasy-accent">Welcome Back</CardTitle>
            <CardDescription>Sign in to your Animorph Battle account</CardDescription>
          </CardHeader>
          
          <CardContent>
            {isLocked && (
              <Alert className="mb-6 bg-red-900/20 border-red-500 text-white">
                <AlertTitle>Account Temporarily Locked</AlertTitle>
                <AlertDescription className="space-y-2">
                  <p>Too many failed login attempts. Please try again in {Math.ceil(remainingTime / 1000 / 60)} minutes and {Math.ceil((remainingTime / 1000) % 60)} seconds.</p>
                </AlertDescription>
              </Alert>
            )}
          
            {showVerificationMessage && (
              <Alert className="mb-6 bg-fantasy-primary/10 border-fantasy-accent">
                <AlertTitle>Email Verification Required</AlertTitle>
                <AlertDescription className="space-y-2">
                  <p>Please check your email and click the verification link.</p>
                  <Button 
                    variant="outline" 
                    className="mt-2 border-fantasy-accent text-fantasy-accent hover:bg-fantasy-accent/20"
                    onClick={handleResendVerification}
                    disabled={isLoading || isLocked}
                  >
                    Resend Verification Email
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleLogin)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="email" 
                          placeholder="Your email address" 
                          className="fantasy-input"
                          disabled={isLocked}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="password" 
                          placeholder="Your password" 
                          className="fantasy-input"
                          disabled={isLocked}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-end">
                  <Button 
                    type="button" 
                    variant="link" 
                    className="text-fantasy-accent p-0 h-auto"
                    onClick={handleResetPassword}
                    disabled={isLoading || isLocked}
                  >
                    Forgot password?
                  </Button>
                </div>
                
                <Button 
                  type="submit" 
                  className="fantasy-button w-full text-lg py-6" 
                  disabled={isLoading || isLocked}
                >
                  {isLoading ? "Signing In..." : "Login"}
                </Button>
              </form>
            </Form>
          </CardContent>
          
          <CardFooter>
            <div className="w-full text-center">
              <p className="text-gray-300">
                Don't have an account?{" "}
                <Link to="/register" className="text-fantasy-accent hover:underline">
                  Register here
                </Link>
              </p>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Login;
