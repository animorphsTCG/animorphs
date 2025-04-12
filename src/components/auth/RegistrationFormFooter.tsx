
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import TermsAndConditionsDialog from "@/components/TermsAndConditionsDialog";

interface RegistrationFormFooterProps {
  isLoading: boolean;
  vipCodeValidationInProgress: boolean;
  isFormValid: boolean;
  agreedToTerms: boolean;
  setAgreedToTerms: (agreed: boolean) => void;
}

const RegistrationFormFooter = ({
  isLoading,
  vipCodeValidationInProgress,
  isFormValid,
  agreedToTerms,
  setAgreedToTerms
}: RegistrationFormFooterProps) => {
  const [showTerms, setShowTerms] = useState(false);
  
  return (
    <div className="space-y-4 pt-4">
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="terms"
          checked={agreedToTerms}
          onChange={(e) => setAgreedToTerms(e.target.checked)}
          className="h-4 w-4"
        />
        <label htmlFor="terms" className="text-sm">
          I agree to the{" "}
          <button
            type="button"
            className="text-fantasy-accent hover:underline"
            onClick={() => setShowTerms(true)}
          >
            Terms and Conditions
          </button>
        </label>
      </div>
      
      <Button
        type="submit"
        className="w-full fantasy-button"
        disabled={isLoading || vipCodeValidationInProgress || !isFormValid}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
            {vipCodeValidationInProgress ? 'Validating VIP Code...' : 'Registering...'}
          </>
        ) : (
          "Register"
        )}
      </Button>
      
      <TermsAndConditionsDialog 
        open={showTerms} 
        onOpenChange={setShowTerms} 
        onAgree={() => {
          setAgreedToTerms(true);
          setShowTerms(false);
        }}
      />
    </div>
  );
};

export default RegistrationFormFooter;
