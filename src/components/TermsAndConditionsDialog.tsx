
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
  return <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Terms and Conditions</DialogTitle>
          <DialogDescription>
            Please read the following terms and conditions carefully.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="h-[50vh] mt-4">
          <div className="space-y-4 pr-4">
            <div className="text-center mb-4">
              <h2 className="text-xl font-semibold">Terms and Conditions for Animorphs Web Game</h2>
              <p className="text-sm text-muted-foreground">Effective Date: 13/April/2025</p>
            </div>
            
            <h3 className="font-bold">1. Introduction</h3>
            <p>
              Welcome to Animorphs, a web-based trading card game developed by a South African citizen in collaboration with Lovable.io. By accessing or using the Animorphs platform ("Service"), you agree to be bound by these Terms and Conditions ("Terms"). If you do not agree with these Terms, please do not use the Service.
            </p>
            
            <h3 className="font-bold">2. Eligibility</h3>
            <p>
              2.1. You must be at least 13 years old to register and use the Service.<br />
              2.2. Users aged 13 to 17 may register and play; however, before earning any in-game credits, points, or monetary rewards, parental or guardian consent must be obtained through a form (initially implemented via Google Forms).<br />
              2.3. Users aged 18 and older are required to complete an identity verification form to ensure compliance with legal requirements.<br />
              2.4. Only participants who are 18 years or older, or who have provided proper parental/guardian consent, will be eligible to receive cash prizes or withdrawable funds.
            </p>
            
            <h3 className="font-bold">3. User Accounts</h3>
            <p>
              3.1. Upon registration, you will create a user account. You are responsible for maintaining the confidentiality of your account credentials.<br />
              3.2. You agree to notify us immediately of any unauthorized use of your account.
            </p>
            
            <h3 className="font-bold">4. Registration Fee and Funding Allocation</h3>
            <p>
              4.1. A registration fee of R100 is required to access the Service.<br />
              4.2. The funds collected from user registrations are allocated as follows:<br />
              <span className="pl-6 block">a. To cover professional development assistance, server hosting, and ongoing maintenance.</span>
              <span className="pl-6 block">b. To invest in a Binance portfolio using funds from 1,900 of the 2,000 registered users.</span><br />
              4.3. Once the portfolio earns its first R450 in monthly interest, a tournament will be held in this first version of the game. Details regarding qualification and participation will be provided to users at a later date.<br />
              4.4. After the first tournament payout, subsequent monthly interest will be used to help cover development and running costs and to fund a portion of the portfolio for in-game currencies. These in-game currencies may be earned during gameplay and, upon meeting certain conditions, may be exchanged for withdrawable cash.<br />
              4.5. The investment activities are solely managed by the developer and are not operated as a collective investment scheme.
            </p>
            
            <h3 className="font-bold">5. Tournament and Prize Eligibility</h3>
            <p>
              5.1. Cash prizes and any withdrawable rewards are available only to eligible users (i.e., users 18 years or older or users under 18 who have provided verified parental/guardian consent).<br />
              5.2. If a participant under the age of 18 is determined to be a winning entrant without the required parental/guardian consent, the cash prize will not be awarded until proper documentation is received.
            </p>
            
            <h3 className="font-bold">6. Parental and User Consent</h3>
            <p>
              6.1. A parental consent form will be provided (via Google Forms) for all users aged 13 to 17. The legal guardian must complete and submit this form before the minor can earn any in-game credits or cash rewards.<br />
              6.2. Users aged 18 and older will also be required to complete a verification form to confirm their eligibility.<br />
              6.3. These measures are implemented to ensure full compliance with legal standards both in South Africa and internationally.
            </p>
            
            <h3 className="font-bold">7. User Conduct</h3>
            <p>
              7.1. You agree not to engage in any activity that disrupts or interferes with the Service.<br />
              7.2. You agree not to use the Service for any unlawful purpose or in violation of any local, national, or international law.
            </p>
            
            <h3 className="font-bold">8. Intellectual Property</h3>
            <p>
              8.1. All content—including game assets, graphics, and software—is the property of Animorphs or its licensors.<br />
              8.2. You may not reproduce, distribute, or create derivative works of any part of the Service without explicit permission.
            </p>
            
            <h3 className="font-bold">9. Privacy and Data Protection</h3>
            <p>
              9.1. We collect personal information solely for creating a functional web game and to comply with legal requirements.<br />
              9.2. User information will never be shared with third parties except as required by law.<br />
              9.3. The handling of personal information is subject to our Privacy Policy and complies with the Protection of Personal Information Act (POPIA) and global data protection standards.
            </p>
            
            <h3 className="font-bold">10. Termination</h3>
            <p>
              10.1. We reserve the right to suspend or terminate your account if you violate these Terms.<br />
              10.2. You may terminate your account at any time by contacting us.
            </p>
            
            <h3 className="font-bold">11. Changes to Terms</h3>
            <p>
              11.1. We may update these Terms from time to time.<br />
              11.2. Continued use of the Service after changes indicates your acceptance of the revised Terms.
            </p>
            
            <h3 className="font-bold">12. Contact Information</h3>
            <p className="mb-4">
              For any questions or concerns regarding these Terms, please contact us at:<br />
              Email: mythicmastersp2e@gmail.com<br />
              Address: FH11 Groot Zorgfontein Grootbrak Western Cape South Africa
            </p>
          </div>
        </ScrollArea>
        
        <DialogFooter className="flex flex-col sm:flex-row sm:justify-between space-y-4 sm:space-y-0 sm:space-x-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => {
          if (onAgree) {
            onAgree();
          } else {
            onOpenChange(false);
          }
        }}>
            I Agree
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>;
};

export default TermsAndConditionsDialog;
