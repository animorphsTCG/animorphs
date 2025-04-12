
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
          <p>
            After registration, you'll need to verify your email before logging in.
            Please check your inbox and spam folder for the verification link.
          </p>
          <p className="mt-1">
            <strong>Important:</strong> If you don't receive the verification email within a few minutes:
          </p>
          <ul className="list-disc ml-4 mt-1">
            <li>Check your spam/junk folder</li>
            <li>Try registering with a different email provider (Gmail, Outlook, etc.)</li>
            <li>You can request another verification email from the login page</li>
          </ul>
        </AlertDescription>
      </Alert>
    </>
  );
};

export default RegistrationFormHeader;
