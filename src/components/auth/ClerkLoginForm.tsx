
import React from "react";
import { useSignIn } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";
import { validateEmail } from "@/lib/validation";

const ClerkLoginForm = () => {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    // Validate email
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      setErrorMessage(emailValidation.message || "Invalid email");
      setIsLoading(false);
      return;
    }

    // Validate password
    if (!password || password.length < 6) {
      setErrorMessage("Password must be at least 6 characters");
      setIsLoading(false);
      return;
    }

    try {
      // First attempt - try to sign in with password
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
        } else {
          // Handle 2FA or other flows if needed
          console.log("Additional sign in actions needed:", result);
        }
      } catch (err: any) {
        console.error("Login error:", err);
        
        // Check if the error is about user not found or wrong password
        if (err.errors && err.errors.length > 0) {
          const errorCode = err.errors[0].code;
          
          if (errorCode === "user_not_found") {
            setErrorMessage("No account found with this email. Please register first.");
          } else if (errorCode === "invalid_credentials") {
            setErrorMessage("Incorrect email or password. Please try again.");
          } else {
            setErrorMessage(err.errors[0].message || "An error occurred during login.");
          }
        } else {
          setErrorMessage("An unexpected error occurred. Please try again.");
        }
      }
    } catch (err) {
      console.error("Unexpected login error:", err);
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
      
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="your.email@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isLoading}
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

export default ClerkLoginForm;
