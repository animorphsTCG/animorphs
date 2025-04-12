
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
            After registration, you'll be able to immediately log in to your account.
            No email verification is required.
          </p>
          <p className="mt-1">
            <strong>Important:</strong> Please remember your login credentials:
          </p>
          <ul className="list-disc ml-4 mt-1">
            <li>Use your registered email address</li>
            <li>Enter the password you created during registration</li>
          </ul>
        </AlertDescription>
      </Alert>
    </>
  );
};

export default RegistrationFormHeader;
