
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

const Login = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showVerificationMessage, setShowVerificationMessage] = useState(false);
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
  }, [location]);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: ""
    }
  });

  const handleLogin = async (values: LoginFormValues) => {
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password
      });
      
      if (error) {
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
            description: error.message,
            variant: "destructive",
          });
        }
        setIsLoading(false);
        return;
      }
      
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

  return (
    <div className="min-h-screen py-16 px-4">
      <div className="container mx-auto max-w-md">
        <Card className="border-2 border-fantasy-primary bg-black/70">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-fantasy text-fantasy-accent">Welcome Back</CardTitle>
            <CardDescription>Sign in to your Animorph Battle account</CardDescription>
          </CardHeader>
          
          <CardContent>
            {showVerificationMessage && (
              <Alert className="mb-6 bg-fantasy-primary/10 border-fantasy-accent">
                <AlertTitle>Email Verification Required</AlertTitle>
                <AlertDescription className="space-y-2">
                  <p>Please check your email and click the verification link.</p>
                  <Button 
                    variant="outline" 
                    className="mt-2 border-fantasy-accent text-fantasy-accent hover:bg-fantasy-accent/20"
                    onClick={handleResendVerification}
                    disabled={isLoading}
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
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button 
                  type="submit" 
                  className="fantasy-button w-full text-lg py-6" 
                  disabled={isLoading}
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
