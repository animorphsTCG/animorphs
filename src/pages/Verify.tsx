
import React, { useState, useEffect } from "react";
import { useSignUp, useSignIn } from "@clerk/clerk-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";
import { AlertCircle, Loader2 } from "lucide-react";

const Verify = () => {
  const [verificationCode, setVerificationCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { signUp, isLoaded: isSignUpLoaded } = useSignUp();
  const { signIn, isLoaded: isSignInLoaded } = useSignIn();
  
  // Get the email from URL state if available (passed from registration page)
  const email = location.state?.email || "";
  const verifyingSignUp = location.state?.verifyingSignUp || true;

  useEffect(() => {
    // If no sign up attempt is in progress and no state was passed
    if (!email) {
      toast({
        title: "No verification in progress",
        description: "Please register or login first",
        variant: "destructive",
      });
      navigate("/register");
    }
  }, [navigate, email]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode.trim()) {
      setErrorMessage("Please enter the verification code from your email");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      if (verifyingSignUp && signUp) {
        // Complete the sign-up process with the verification code
        const completeSignUp = await signUp.attemptEmailAddressVerification({
          code: verificationCode,
        });

        if (completeSignUp.status === "complete") {
          toast({
            title: "Verification successful",
            description: "Your account has been verified. You can now log in.",
          });
          navigate("/login");
        } else {
          throw new Error("Verification failed. Please try again.");
        }
      } else if (signIn) {
        // Handle sign-in verification if ever needed
        const completeSignIn = await signIn.attemptFirstFactor({
          strategy: "email_code",
          code: verificationCode,
        });

        if (completeSignIn.status === "complete") {
          toast({
            title: "Verification successful",
            description: "You're now logged in.",
          });
          navigate("/battle");
        }
      }
    } catch (err: any) {
      console.error("Verification error:", err);
      setErrorMessage(err.message || "Verification failed. Please try again.");
      toast({
        title: "Verification failed",
        description: err.message || "Please check your code and try again",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isSignUpLoaded || !isSignInLoaded) {
    return (
      <div className="container flex items-center justify-center min-h-[80vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container flex items-center justify-center py-12 px-4 min-h-[80vh]">
      <Card className="w-full max-w-md border-2 border-fantasy-primary bg-black/70">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-fantasy font-bold text-fantasy-accent">
            Verify Your Email
          </CardTitle>
          <CardDescription>
            Please enter the verification code sent to {email || "your email address"}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleVerify} className="space-y-4">
            {errorMessage && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <label htmlFor="verificationCode" className="block text-sm font-medium">
                Verification Code
              </label>
              <Input
                id="verificationCode"
                type="text"
                placeholder="Enter your verification code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                className="bg-gray-800"
                autoComplete="off"
              />
            </div>

            <Button
              type="submit"
              className="w-full fantasy-button"
              disabled={isLoading || !verificationCode}
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
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <div className="text-sm text-gray-400 text-center">
            Didn't receive a code?{" "}
            <Button
              variant="link"
              className="text-fantasy-accent p-0 h-auto"
              onClick={async () => {
                if (verifyingSignUp && signUp) {
                  try {
                    await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
                    toast({
                      title: "Code resent",
                      description: "Please check your email for a new verification code",
                    });
                  } catch (err: any) {
                    toast({
                      title: "Failed to resend code",
                      description: err.message || "Please try again",
                      variant: "destructive",
                    });
                  }
                }
              }}
            >
              Resend code
            </Button>
          </div>
          <div className="text-sm text-gray-400 text-center">
            <Link to="/login" className="text-fantasy-accent hover:underline">
              Back to Login
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Verify;
