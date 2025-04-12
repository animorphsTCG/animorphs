
import React from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Info } from "lucide-react";

interface RegistrationFormHeaderProps {
  errorMessage: string | null;
}

const RegistrationFormHeader = ({ errorMessage }: RegistrationFormHeaderProps) => {
  return (
    <>
      {errorMessage && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}
      
      <Alert variant="default" className="bg-gray-800 border-gray-700">
        <Info className="h-4 w-4" />
        <AlertDescription className="text-xs">
          After registration, you'll need to verify your email before logging in.
          Please check your inbox and spam folder for the verification link.
        </AlertDescription>
      </Alert>
    </>
  );
};

export default RegistrationFormHeader;
