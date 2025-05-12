
import React from 'react';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText } from 'lucide-react';

const TermsAndConditions = () => {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="max-w-4xl mx-auto bg-black/80 p-8 rounded-lg shadow-md border border-fantasy-accent/20">
        <div className="flex items-center mb-6 gap-3">
          <FileText className="h-6 w-6 text-fantasy-accent" />
          <h1 className="text-3xl font-bold text-white">Terms and Conditions</h1>
        </div>
        
        <p className="text-gray-400 mb-6">Last Updated: 12/May/2025</p>
        
        <ScrollArea className="h-[60vh]">
          <div className="prose prose-invert max-w-none pr-4">
            <h2 className="text-xl font-semibold mt-6 mb-3 text-fantasy-accent">1. Definitions</h2>
            <p>
              In these Terms and Conditions, the following terms shall have the meanings ascribed below:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>"Animorphs": The web game and related services provided on this website.</li>
              <li>"User": Any individual who registers to play Animorphs, accesses their account, or otherwise uses the service.</li>
              <li>"Visitor": Any person accessing the website without registering as a User.</li>
              <li>"VIP Code": A unique code that may grant benefits such as free card decks as described on the website.</li>
              <li>"MP" (Match Points), "AI" (AI Points), "LBP" (Leader Board Points), "Digi" (in-game currency), and "Gold": Virtual points and currencies used within the game in accordance with the rules provided on the site.</li>
              <li>"KYC": Know Your Customer verification process that must be completed by Users 18 years of age or older prior to withdrawal of in-game earnings.</li>
              <li>"Admin Panel": The restricted backend area used by authorized administrators for game management and analytics.</li>
            </ul>

            <h2 className="text-xl font-semibold mt-6 mb-3 text-fantasy-accent">2. Acceptance of Terms</h2>
            <p>
              By accessing or using Animorphs, you agree to be bound by these Terms and Conditions and any additional guidelines, policies, or rules referenced herein. If you do not agree with any of these terms, you must not access or use the service.
            </p>

            <h2 className="text-xl font-semibold mt-6 mb-3 text-fantasy-accent">3. Eligibility and Registration</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Age Requirement:</strong> Users must be at least 18 years old to register and participate in any gameplay mode that includes real or virtual monetary rewards. Users under 18 may access the demo version of the game only.</li>
              <li><strong>Registration:</strong> Users are required to register by providing accurate personal information including Name, Surname, Age, Gender, Country, Email, and a unique Username. Acceptance of these Terms is mandatory at the time of registration.</li>
              <li><strong>KYC Verification:</strong> Before any in-game earnings (including Digi withdrawal) can be processed, Users must complete the required KYC process as stipulated by applicable law.</li>
            </ul>

            <h2 className="text-xl font-semibold mt-6 mb-3 text-fantasy-accent">4. Payment and VIP Codes</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Payment Requirements:</strong> Registration (or access to a complete 200-card deck) requires payment of R100 ZAR via PayPal unless a valid VIP Code is used.</li>
              <li><strong>VIP Codes:</strong> Specific VIP Codes (e.g., The VIP Code granted when beating the AI in demo battle and "ZypherDan") may be used to bypass payment as per the conditions published on the website. Payment via PayPal (including credit/debit card options) is processed in accordance with the relevant PayPal Live credentials.</li>
              <li><strong>Service Fees:</strong> Users agree that payments made are non-refundable except as required by applicable law. Payment funds will be used to cover server rental, development, and future upgrades.</li>
            </ul>

            <h2 className="text-xl font-semibold mt-6 mb-3 text-fantasy-accent">5. In-Game Rewards, Currency, and Virtual Assets</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Virtual Points and Currency:</strong> Points (MP, AI, LBP) and virtual currencies (Digi, Gold) have no inherent cash value unless expressly provided for in future updates.</li>
              <li><strong>Gold Investment and Rewards:</strong> Gold units represent a share in future revenue from a dedicated investment portfolio. Conversion and reward mechanisms are subject to change and will be implemented once applicable financial and regulatory requirements are met.</li>
              <li><strong>Earning and Use:</strong> All in-game rewards are granted subject to the rules of play described on the site. Users are solely responsible for maintaining the confidentiality of any in-game rewards, VIP Codes, or account information.</li>
            </ul>

            <h2 className="text-xl font-semibold mt-6 mb-3 text-fantasy-accent">6. Intellectual Property Rights</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Ownership:</strong> All content, graphics, logos, designs, code, and other materials on Animorphs are the exclusive property of the developer(s) or their licensors.</li>
              <li><strong>License:</strong> Users are granted a limited, non-exclusive, non-transferable license to access and use the game for personal, non-commercial use only.</li>
              <li><strong>Restrictions:</strong> Users shall not reproduce, modify, distribute, or create derivative works without the express written consent of the owner.</li>
            </ul>

            <h2 className="text-xl font-semibold mt-6 mb-3 text-fantasy-accent">7. User Conduct and Account Security</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Accurate Information:</strong> Users agree to provide accurate and complete information during registration and maintain the accuracy of such information.</li>
              <li><strong>Account Security:</strong> Users are responsible for safeguarding their account credentials and any activity that occurs under their account.</li>
              <li><strong>Prohibited Conduct:</strong> Users shall not engage in any fraudulent, abusive, or unlawful behaviour including attempts to manipulate game mechanics, in-game rewards, multiple accounts, or unauthorized access to the Admin Panel.</li>
            </ul>

            <h2 className="text-xl font-semibold mt-6 mb-3 text-fantasy-accent">8. Termination and Suspension</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>By the User:</strong> Users may terminate their account at any time; however, any outstanding earnings or in-game points may be forfeited upon termination.</li>
              <li><strong>By Animorphs:</strong> We reserve the right to suspend or terminate access to the service for any breach of these Terms or for any conduct that we deem harmful to the service or other Users.</li>
              <li><strong>Finality:</strong> Upon termination, the rights granted to the User will immediately cease, and any accrued benefits may be lost without further obligation on our part.</li>
            </ul>

            <h2 className="text-xl font-semibold mt-6 mb-3 text-fantasy-accent">9. Disclaimers and Limitation of Liability</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>"As Is" Basis:</strong> The service is provided on an "as is" and "as available" basis without warranties of any kind, either express or implied.</li>
              <li><strong>No Guarantee of Service:</strong> We do not warrant that the service will be uninterrupted, error-free, or free of viruses or other harmful components.</li>
              <li><strong>Limitation of Liability:</strong> In no event shall Animorphs, its owners, or affiliates be liable for any indirect, incidental, consequential, or punitive damages arising out of or in connection with your use of the service, even if advised of the possibility of such damages.</li>
              <li><strong>Force Majeure:</strong> We are not liable for any failure to perform due to causes beyond our reasonable control.</li>
            </ul>

            <h2 className="text-xl font-semibold mt-6 mb-3 text-fantasy-accent">10. Indemnification</h2>
            <p>
              Users agree to indemnify, defend, and hold harmless Animorphs, its officers, employees, and affiliates from any claims, damages, obligations, losses, liabilities, costs, or expenses arising from your use of the service, violation of these Terms, or infringement of any intellectual property or other rights.
            </p>

            <h2 className="text-xl font-semibold mt-6 mb-3 text-fantasy-accent">11. Dispute Resolution</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Negotiation:</strong> In the event of any dispute arising out of or relating to these Terms or the service, the parties agree to attempt to resolve the matter through amicable negotiation.</li>
              <li><strong>Binding Arbitration:</strong> If a dispute cannot be resolved amicably, it shall be resolved by binding arbitration in accordance with the rules of the Arbitration Foundation of South Africa.</li>
              <li><strong>Jurisdiction:</strong> Any disputes shall be governed by and construed in accordance with the laws of South Africa.</li>
            </ul>

            <h2 className="text-xl font-semibold mt-6 mb-3 text-fantasy-accent">12. Governing Law</h2>
            <p>
              These Terms and Conditions shall be governed by and construed in accordance with the laws of South Africa. By using the service, Users consent to the exclusive jurisdiction and venue of the South African courts for any disputes arising out of or related to these Terms.
            </p>

            <h2 className="text-xl font-semibold mt-6 mb-3 text-fantasy-accent">13. Changes to These Terms</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Modifications:</strong> We reserve the right to amend these Terms at any time. Notice of any changes will be posted on the website with an updated "Last Updated" date.</li>
              <li><strong>Continued Use:</strong> Your continued use of the service after any changes are posted constitutes your acceptance of the revised Terms.</li>
            </ul>

            <h2 className="text-xl font-semibold mt-6 mb-3 text-fantasy-accent">14. Contact Information</h2>
            <p>
              For any questions or concerns regarding these Terms and Conditions, please contact us at:
            </p>
            <p className="mt-2">
              Email: <a href="mailto:mythicmastersp2e@gmail.com" className="text-fantasy-accent">mythicmastersp2e@gmail.com</a>
            </p>
            <p>
              Address: FH11, Groot Zorgfontein, Grootbrak, Western Cape, South Africa
            </p>

            <h2 className="text-xl font-semibold mt-6 mb-3 text-fantasy-accent">Acknowledgment</h2>
            <p>
              By clicking "I Agree" or by using the Animorphs service, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions.
            </p>
          </div>
        </ScrollArea>
        
        <div className="mt-8 flex justify-between">
          <Button onClick={() => navigate(-1)} variant="outline">
            Go Back
          </Button>
          <Link to="/register">
            <Button className="fantasy-button">
              Register Now
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditions;
