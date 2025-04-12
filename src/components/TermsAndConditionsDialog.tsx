
import React from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface TermsAndConditionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAgree?: () => void;
}

const TermsAndConditionsDialog = ({
  open,
  onOpenChange,
  onAgree
}: TermsAndConditionsDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Terms and Conditions</DialogTitle>
          <DialogDescription>
            Please read the following terms and conditions carefully.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="h-[50vh] mt-4">
          <div className="space-y-4 pr-4">
            <h3 className="font-bold">1. Introduction</h3>
            <p>
              Welcome to Animorphs Battle Card Game. These Terms and Conditions govern your use of our service and website. By using our service, you agree to these terms.
            </p>
            
            <h3 className="font-bold">2. User Registration</h3>
            <p>
              2.1. You must be at least 13 years of age to use this service.<br />
              2.2. You must provide accurate and complete information when registering.<br />
              2.3. You are responsible for maintaining the confidentiality of your account password.
            </p>
            
            <h3 className="font-bold">3. User Conduct</h3>
            <p>
              3.1. You agree not to use the service for any illegal purpose or in violation of any local, state, national, or international law.<br />
              3.2. You agree not to harass, abuse, or harm another person or group.<br />
              3.3. You agree not to interfere with or disrupt the service or servers.
            </p>
            
            <h3 className="font-bold">4. Privacy Policy</h3>
            <p>
              4.1. We collect and process your personal information as described in our Privacy Policy.<br />
              4.2. By using our service, you consent to such processing and you warrant that all data provided by you is accurate.
            </p>
            
            <h3 className="font-bold">5. Intellectual Property</h3>
            <p>
              5.1. All game assets, characters, and related content are the property of their respective owners.<br />
              5.2. You may not copy, modify, distribute, sell, or lease any part of our service or included software.
            </p>
            
            <h3 className="font-bold">6. VIP Codes</h3>
            <p>
              6.1. VIP Codes may be provided for promotional purposes.<br />
              6.2. Each VIP Code may have limited uses and is subject to availability.<br />
              6.3. We reserve the right to modify or cancel VIP Codes at any time without prior notice.
            </p>
            
            <h3 className="font-bold">7. Termination</h3>
            <p>
              7.1. We may terminate or suspend your account at any time without prior notice for violations of these terms.<br />
              7.2. You may terminate your account at any time by contacting us.
            </p>
            
            <h3 className="font-bold">8. Changes to Terms</h3>
            <p>
              8.1. We reserve the right to modify these terms at any time.<br />
              8.2. Continued use of the service after changes constitutes acceptance of the modified terms.
            </p>
            
            <h3 className="font-bold">9. Contact Us</h3>
            <p>
              If you have any questions about these Terms, please contact us at support@animorphs-battle.com.
            </p>
          </div>
        </ScrollArea>
        
        <DialogFooter className="flex flex-col sm:flex-row sm:justify-between space-y-4 sm:space-y-0 sm:space-x-4">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button 
            onClick={() => {
              if (onAgree) {
                onAgree();
              } else {
                onOpenChange(false);
              }
            }}
          >
            I Agree
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TermsAndConditionsDialog;
