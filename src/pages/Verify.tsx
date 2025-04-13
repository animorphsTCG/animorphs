import React, { useState, useEffect } from "react";
import { useSignUp, useSignIn } from "@clerk/clerk-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";
import { AlertCircle, Loader2, RefreshCw } from "lucide-react";
import { trackAuthAttempt } from "@/lib/clerkMonitoring";
import { logAuthEvent } from "@/utils/clerkAuth";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

const Verify = () => {
  const [verificationCode, setVerificationCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [retries, setRetries] = useState(0);
  const [resendDisabled, setResendDisabled] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const { signUp, isLoaded: isSignUpLoaded } = useSignUp();
  const { signIn, isLoaded: isSignInLoaded } = useSignIn();

  const email = location.state?.email || "";
  const verifyingSignUp = location.state?.verifyingSignUp !== undefined ? location.state.verifyingSignUp : true;

  useEffect(() => {
    if (!email) {
      toast({
        title: "No verification in progress",
        description: "Please register or login first",
        variant: "destructive",
      });
      navigate("/register");
      return;
    }
    
    logAuthEvent('verify_page_loaded', { email, verifyingSignUp });
  }, [navigate, email, verifyingSignUp]);

  useEffect(() => {
    let interval: number | undefined;
    if (resendCountdown > 0) {
      interval = window.setInterval(() => {
        setResendCountdown(prev => prev - 1);
      }, 1000);
    } else if (resendCountdown === 0) {
      setResendDisabled(false);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [resendCountdown]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode || verificationCode.length < 6) {
      setErrorMessage("Please enter the complete 6-digit verification code from your email");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    
    const startTime = performance.now();

    try {
      if (verifyingSignUp && signUp) {
        console.log("Attempting email verification for signup", { email, retries, code: verificationCode });
        
        // Make sure we have the latest verification attempt
        await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
        
        const completeSignUp = await signUp.attemptEmailAddressVerification({
          code: verificationCode.trim(),
        });

        console.log("Verification result:", completeSignUp);

        if (completeSignUp.status === "complete") {
          trackAuthAttempt('verify', true, performance.now() - startTime, { email });
          
          toast({
            title: "Verification successful",
            description: "Your account has been created successfully.",
          });
          
          if (completeSignUp.createdSessionId) {
            console.log("Session created, redirecting to profile");
            setTimeout(() => {
              navigate("/profile");
            }, 500);
          } else {
            console.log("No session ID created, redirecting to login");
            navigate("/login");
          }
        } else {
          throw new Error(`Verification incomplete. Status: ${completeSignUp.status}`);
        }
      } else if (signIn) {
        console.log("Attempting email verification for signin", { email, code: verificationCode });
        
        const completeSignIn = await signIn.attemptFirstFactor({
          strategy: "email_code",
          code: verificationCode.trim(),
        });

        console.log("Sign-in verification result:", completeSignIn);

        if (completeSignIn.status === "complete") {
          trackAuthAttempt('verify', true, performance.now() - startTime, { email });
          
          toast({
            title: "Verification successful",
            description: "You're now logged in.",
          });
          setTimeout(() => {
            navigate("/profile");
          }, 500);
        } else {
          throw new Error(`Sign-in verification incomplete. Status: ${completeSignIn.status}`);
        }
      }
    } catch (err: any) {
      console.error("Verification error:", err);
      
      setRetries(prev => prev + 1);
      
      trackAuthAttempt('verify', false, performance.now() - startTime, { 
        email, 
        retries,
        error: err.message || "Unknown error"
      });
      
      // Provide more user-friendly error messages
      let friendlyErrorMessage = "Verification failed. Please check your code and try again.";
      if (err.message?.includes("expired")) {
        friendlyErrorMessage = "Verification code has expired. Please request a new code.";
      } else if (err.message?.includes("invalid") || err.message?.includes("incorrect")) {
        friendlyErrorMessage = "Invalid verification code. Please check and try again.";
      }
      
      setErrorMessage(friendlyErrorMessage);
      toast({
        title: "Verification failed",
        description: friendlyErrorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendDisabled) return;
    
    setResendDisabled(true);
    setResendCountdown(60);
    setErrorMessage(null);
    setVerificationCode("");
    
    try {
      if (verifyingSignUp && signUp) {
        await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
        logAuthEvent('resend_verification', { email });
        toast({
          title: "Code resent",
          description: "Please check your email for a new verification code",
        });
      } else if (signIn) {
        // For sign-in flow, we need to prepare first factor
        await signIn.prepareFirstFactor({
          strategy: "email_code",
          identifier: email
        });
        
        logAuthEvent('resend_verification', { email });
        toast({
          title: "Code resent",
          description: "Please check your email for a new verification code",
        });
      }
    } catch (err: any) {
      console.error("Error resending code:", err);
      toast({
        title: "Failed to resend code",
        description: err.message || "Please try again later",
        variant: "destructive",
      });
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

            <div className="space-y-4">
              <label htmlFor="verificationCode" className="block text-sm font-medium">
                Verification Code
              </label>
              
              <div className="flex justify-center mb-4">
                <InputOTP
                  maxLength={6}
                  value={verificationCode}
                  onChange={(value) => setVerificationCode(value)}
                  disabled={isLoading}
                  render={({ slots }) => (
                    <InputOTPGroup>
                      {slots.map((slot, i) => (
                        <InputOTPSlot key={i} index={i} className="bg-gray-800" />
                      ))}
                    </InputOTPGroup>
                  )}
                />
              </div>
              
              <Input
                id="verificationCode"
                type="text"
                placeholder="Or type your verification code here"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                className="bg-gray-800"
                autoComplete="one-time-code"
                disabled={isLoading}
                maxLength={6}
              />
            </div>

            <Button
              type="submit"
              className="w-full fantasy-button"
              disabled={isLoading || !verificationCode || verificationCode.length < 6}
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
              onClick={handleResendCode}
              disabled={resendDisabled || isLoading}
            >
              {resendDisabled ? (
                <>
                  Resend code in {resendCountdown}s
                </>
              ) : (
                <>
                  <RefreshCw className="mr-1 h-3 w-3" /> Resend code
                </>
              )}
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
