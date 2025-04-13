
import React from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Link } from "react-router-dom";
import { FileText } from "lucide-react";

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
      <DialogContent className="sm:max-w-[700px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-fantasy-accent" />
            Terms and Conditions
          </DialogTitle>
          <DialogDescription>
            Last Updated: 09/April/2025
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="h-[50vh] mt-4">
          <div className="space-y-4 pr-4">
            <h3 className="font-bold text-lg text-fantasy-accent">1. Definitions</h3>
            <p className="text-sm">
              In these Terms and Conditions, the following terms shall have the meanings ascribed below:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>"Animorphs": The web game and related services provided on this website.</li>
              <li>"User": Any individual who registers to play Animorphs, accesses their account, or otherwise uses the service.</li>
              <li>"Visitor": Any person accessing the website without registering as a User.</li>
              <li>"VIP Code": A unique code that may grant benefits such as free card decks as described on the website.</li>
              <li>"MP" (Match Points), "AI" (AI Points), "LBP" (Leader Board Points), "Digi" (in-game currency), and "Gold": Virtual points and currencies used within the game in accordance with the rules provided on the site.</li>
              <li>"KYC": Know Your Customer verification process that must be completed by Users 18 years of age or older prior to withdrawal of in-game earnings.</li>
              <li>"Admin Panel": The restricted backend area used by authorized administrators for game management and analytics.</li>
            </ul>

            <h3 className="font-bold text-lg text-fantasy-accent">2. Acceptance of Terms</h3>
            <p className="text-sm">
              By accessing or using Animorphs, you agree to be bound by these Terms and Conditions and any additional guidelines, policies, or rules referenced herein. If you do not agree with any of these terms, you must not access or use the service.
            </p>

            <h3 className="font-bold text-lg text-fantasy-accent">3. Eligibility and Registration</h3>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li><strong>Age Requirement:</strong> Users must be at least 18 years old to register and participate in any gameplay mode that includes real or virtual monetary rewards. Users under 18 may access the demo version of the game only.</li>
              <li><strong>Registration:</strong> Users are required to register by providing accurate personal information including Name, Surname, Age, Gender, Country, Email, and a unique Username. Acceptance of these Terms is mandatory at the time of registration.</li>
              <li><strong>KYC Verification:</strong> Before any in-game earnings (including Digi withdrawal) can be processed, Users must complete the required KYC process as stipulated by applicable law.</li>
            </ul>

            <h3 className="font-bold text-lg text-fantasy-accent">4. Payment and VIP Codes</h3>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li><strong>Payment Requirements:</strong> Registration (or access to a complete 200-card deck) requires payment of R100 ZAR via PayPal unless a valid VIP Code is used.</li>
              <li><strong>VIP Codes:</strong> Specific VIP Codes (e.g., The VIP Code granted when beating the AI in demo battle and "ZypherDan") may be used to bypass payment as per the conditions published on the website. Payment via PayPal (including credit/debit card options) is processed in accordance with the relevant PayPal Live credentials.</li>
              <li><strong>Service Fees:</strong> Users agree that payments made are non-refundable except as required by applicable law. Payment funds will be used to cover server rental, development, and future upgrades.</li>
            </ul>

            <h3 className="font-bold text-lg text-fantasy-accent">5. In-Game Rewards, Currency, and Virtual Assets</h3>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li><strong>Virtual Points and Currency:</strong> Points (MP, AI, LBP) and virtual currencies (Digi, Gold) have no inherent cash value unless expressly provided for in future updates.</li>
              <li><strong>Gold Investment and Rewards:</strong> Gold units represent a share in future revenue from a dedicated investment portfolio. Conversion and reward mechanisms are subject to change and will be implemented once applicable financial and regulatory requirements are met.</li>
              <li><strong>Earning and Use:</strong> All in-game rewards are granted subject to the rules of play described on the site. Users are solely responsible for maintaining the confidentiality of any in-game rewards, VIP Codes, or account information.</li>
            </ul>

            <p className="text-sm text-gray-400 mt-2 italic">
              <Link to="/terms-and-conditions" className="text-fantasy-accent hover:underline" onClick={() => onOpenChange(false)}>
                View full Terms and Conditions
              </Link>
            </p>
          </div>
        </ScrollArea>
        
        <DialogFooter className="flex flex-col sm:flex-row sm:justify-between space-y-4 sm:space-y-0 sm:space-x-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button className="fantasy-button" onClick={() => {
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
    </Dialog>
  );
};

export default TermsAndConditionsDialog;
