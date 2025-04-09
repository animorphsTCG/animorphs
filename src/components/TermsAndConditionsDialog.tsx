
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TermsAndConditionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccept: () => void;
}

const TermsAndConditionsDialog = ({
  open,
  onOpenChange,
  onAccept
}: TermsAndConditionsDialogProps) => {
  const handleAccept = () => {
    onAccept();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] flex flex-col border-2 border-fantasy-primary bg-black/90 my-0 py-0 rounded-none">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle className="text-2xl font-fantasy text-fantasy-accent">
            Terms and Conditions for Animorphs Web Game
          </DialogTitle>
        </DialogHeader>
        
        {/* Scrollable content area with fixed height */}
        <ScrollArea className="flex-1 px-6 py-4 overflow-y-auto max-h-[calc(90vh-180px)]" type="always">
          <div className="text-sm space-y-4 pr-4">
            <p className="text-gray-400">Last Updated: [09/April/2025]</p>

            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-fantasy-accent">1. Definitions</h3>
              <p>In these Terms and Conditions, the following terms shall have the meanings ascribed below:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>"Animorphs": The web game and related services provided on this website.</li>
                <li>"User": Any individual who registers to play Animorphs, accesses their account, or otherwise uses the service.</li>
                <li>"Visitor": Any person accessing the website without registering as a User.</li>
                <li>"VIP Code": A unique code that may grant benefits such as free card decks as described on the website.</li>
                <li>"MP" (Match Points), "AI" (AI Points), "LBP" (Leader Board Points), "Digi" (in-game currency), and "Gold": Virtual points and currencies used within the game in accordance with the rules provided on the site.</li>
                <li>"KYC": Know Your Customer verification process that must be completed by Users 18 years of age or older prior to withdrawal of in-game earnings.</li>
                <li>"Admin Panel": The restricted backend area used by authorized administrators for game management and analytics.</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-fantasy-accent">2. Acceptance of Terms</h3>
              <p>By accessing or using Animorphs, you agree to be bound by these Terms and Conditions and any additional guidelines, policies, or rules referenced herein. If you do not agree with any of these terms, you must not access or use the service.</p>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-fantasy-accent">3. Eligibility and Registration</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Age Requirement: Users must be at least 18 years old to register and participate in any gameplay mode that includes real or virtual monetary rewards. Users under 18 may access the demo version of the game only.</li>
                <li>Registration: Users are required to register by providing accurate personal information including Name, Surname, Age, Gender, Country, Email, and a unique Username. Acceptance of these Terms is mandatory at the time of registration.</li>
                <li>KYC Verification: Before any in-game earnings (including Digi withdrawal) can be processed, Users must complete the required KYC process as stipulated by applicable law.</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-fantasy-accent">4. Payment and VIP Codes</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Payment Requirements: Registration (or access to a complete 200-card deck) requires payment of R100 ZAR via PayPal unless a valid VIP Code is used.</li>
                <li>VIP Codes: Specific VIP Codes (e.g., The VIP Code granted when beating the AI in demo battle and "ZypherDan") may be used to bypass payment as per the conditions published on the website. Payment via PayPal (including credit/debit card options) is processed in accordance with the relevant PayPal Live credentials.</li>
                <li>Service Fees: Users agree that payments made are non-refundable except as required by applicable law. Payment funds will be used to cover server rental, development, and future upgrades.</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-fantasy-accent">5. In-Game Rewards, Currency, and Virtual Assets</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Virtual Points and Currency: Points (MP, AI, LBP) and virtual currencies (Digi, Gold) have no inherent cash value unless expressly provided for in future updates.</li>
                <li>Gold Investment and Rewards: Gold units represent a share in future revenue from a dedicated investment portfolio. Conversion and reward mechanisms are subject to change and will be implemented once applicable financial and regulatory requirements are met.</li>
                <li>Earning and Use: All in-game rewards are granted subject to the rules of play described on the site. Users are solely responsible for maintaining the confidentiality of any in-game rewards, VIP Codes, or account information.</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-fantasy-accent">6. Intellectual Property Rights</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Ownership: All content, graphics, logos, designs, code, and other materials on Animorphs are the exclusive property of the developer(s) or their licensors.</li>
                <li>License: Users are granted a limited, non-exclusive, non-transferable license to access and use the game for personal, non-commercial use only.</li>
                <li>Restrictions: Users shall not reproduce, modify, distribute, or create derivative works without the express written consent of the owner.</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-fantasy-accent">7. User Conduct and Account Security</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Accurate Information: Users agree to provide accurate and complete information during registration and maintain the accuracy of such information.</li>
                <li>Account Security: Users are responsible for safeguarding their account credentials and any activity that occurs under their account.</li>
                <li>Prohibited Conduct: Users shall not engage in any fraudulent, abusive, or unlawful behaviour including attempts to manipulate game mechanics, in-game rewards, multiple accounts, or unauthorized access to the Admin Panel.</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-fantasy-accent">8. Termination and Suspension</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>By the User: Users may terminate their account at any time; however, any outstanding earnings or in-game points may be forfeited upon termination.</li>
                <li>By Animorphs: We reserve the right to suspend or terminate access to the service for any breach of these Terms or for any conduct that we deem harmful to the service or other Users.</li>
                <li>Finality: Upon termination, the rights granted to the User will immediately cease, and any accrued benefits may be lost without further obligation on our part.</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-fantasy-accent">9. Disclaimers and Limitation of Liability</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>"As Is" Basis: The service is provided on an "as is" and "as available" basis without warranties of any kind, either express or implied.</li>
                <li>No Guarantee of Service: We do not warrant that the service will be uninterrupted, error-free, or free of viruses or other harmful components.</li>
                <li>Limitation of Liability: In no event shall Animorphs, its owners, or affiliates be liable for any indirect, incidental, consequential, or punitive damages arising out of or in connection with your use of the service, even if advised of the possibility of such damages.</li>
                <li>Force Majeure: We are not liable for any failure to perform due to causes beyond our reasonable control.</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-fantasy-accent">10. Indemnification</h3>
              <p>Users agree to indemnify, defend, and hold harmless Animorphs, its officers, employees, and affiliates from any claims, damages, obligations, losses, liabilities, costs, or expenses arising from your use of the service, violation of these Terms, or infringement of any intellectual property or other rights.</p>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-fantasy-accent">11. Dispute Resolution</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Negotiation: In the event of any dispute arising out of or relating to these Terms or the service, the parties agree to attempt to resolve the matter through amicable negotiation.</li>
                <li>Binding Arbitration: If a dispute cannot be resolved amicably, it shall be resolved by binding arbitration in accordance with the rules of the Arbitration Foundation of South Africa.</li>
                <li>Jurisdiction: Any disputes shall be governed by and construed in accordance with the laws of South Africa.</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-fantasy-accent">12. Governing Law</h3>
              <p>These Terms and Conditions shall be governed by and construed in accordance with the laws of South Africa. By using the service, Users consent to the exclusive jurisdiction and venue of the South African courts for any disputes arising out of or related to these Terms.</p>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-fantasy-accent">13. Changes to These Terms</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Modifications: We reserve the right to amend these Terms at any time. Notice of any changes will be posted on the website with an updated "Last Updated" date.</li>
                <li>Continued Use: Your continued use of the service after any changes are posted constitutes your acceptance of the revised Terms.</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-fantasy-accent">14. Contact Information</h3>
              <p>For any questions or concerns regarding these Terms and Conditions, please contact us at: mythicmastersp2e@gmail.com</p>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-fantasy-accent">Acknowledgment</h3>
              <p>By clicking "I Agree" or by using the Animorphs service, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions.</p>
            </div>
          </div>
        </ScrollArea>
        
        <DialogFooter className="flex justify-between sm:justify-between gap-4 px-6 py-4 border-t border-fantasy-primary/30">
          <DialogClose asChild>
            <Button variant="outline" className="border-fantasy-accent text-fantasy-accent hover:bg-fantasy-accent/20">
              Close
            </Button>
          </DialogClose>
          <Button onClick={handleAccept} className="bg-fantasy-accent text-black hover:bg-fantasy-accent/80">
            I Accept
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TermsAndConditionsDialog;
