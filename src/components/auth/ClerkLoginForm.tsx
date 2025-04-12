
import React, { useState } from "react";
import { useSignIn } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";
import { AlertCircle, Loader2 } from "lucide-react";

const ClerkLoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const navigate = useNavigate();
  const { isLoaded, signIn, setActive } = useSignIn();
  
  if (!isLoaded) {
    return (
      <div className="flex justify-center items-center">
        <Loader2 className="animate-spin h-6 w-6 mr-2" />
        <p>Loading...</p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    
    if (!email.trim() || !password.trim()) {
      setErrorMessage("Please provide both email and password");
      return;
    }
    
    setIsLoading(true);
    
    try {
      const result = await signIn.create({
        identifier: email,
        password,
      });
      
      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        toast({
          title: "Login successful",
          description: "Welcome back!",
        });
        navigate("/battle");
      } else if (result.status === "needs_first_factor") {
        // User needs to verify email
        if (result.firstFactorVerification.strategy === "email_code") {
          toast({
            title: "Verification required",
            description: "Please check your email for a verification code",
          });
          navigate("/verify", { state: { email, verifyingSignUp: false } });
        }
      }
    } catch (err: any) {
      console.error("Login error:", err);
      
      if (err.errors && err.errors.length > 0) {
        const error = err.errors[0];
        
        // Handle specific clerk errors
        if (error.code === "form_identifier_not_found") {
          setErrorMessage("Email not registered. Please check your email or register.");
        } else if (error.code === "form_password_incorrect") {
          setErrorMessage("Incorrect password. Please try again.");
        } else {
          setErrorMessage(error.message || "Login failed");
        }
      } else {
        setErrorMessage("An unexpected error occurred. Please try again.");
      }
      
      toast({
        title: "Login failed",
        description: "Please check your credentials and try again",
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

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="your.email@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="bg-gray-800"
          required
        />
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label htmlFor="password">Password</Label>
          <Link
            to="#"
            onClick={async (e) => {
              e.preventDefault();
              
              if (!email.trim()) {
                toast({
                  title: "Email required",
                  description: "Please enter your email address first",
                  variant: "destructive",
                });
                return;
              }
              
              try {
                setIsLoading(true);
                await signIn.create({
                  strategy: "reset_password_email_code",
                  identifier: email,
                });
                
                toast({
                  title: "Password reset email sent",
                  description: "Check your inbox for instructions",
                });
              } catch (err) {
                console.error("Password reset error:", err);
                toast({
                  title: "Failed to send reset email",
                  description: "Please try again later",
                  variant: "destructive",
                });
              } finally {
                setIsLoading(false);
              }
            }}
            className="text-xs text-fantasy-accent hover:underline"
          >
            Forgot password?
          </Link>
        </div>
        <Input
          id="password"
          type="password"
          placeholder="Your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="bg-gray-800"
          required
        />
      </div>

      <Button
        type="submit"
        className="w-full fantasy-button"
        disabled={isLoading}
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
