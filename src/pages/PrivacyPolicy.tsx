
import React from 'react';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Shield } from 'lucide-react';

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="max-w-4xl mx-auto bg-black/80 p-8 rounded-lg shadow-md border border-fantasy-accent/20">
        <div className="flex items-center mb-6 gap-3">
          <Shield className="h-6 w-6 text-fantasy-accent" />
          <h1 className="text-3xl font-bold text-white">Privacy Policy</h1>
        </div>
        
        <p className="text-gray-400 mb-6">Effective Date: 13/April/2025</p>
        
        <ScrollArea className="h-[60vh]">
          <div className="prose prose-invert max-w-none pr-4">
            <h2 className="text-xl font-semibold mt-6 mb-3 text-fantasy-accent">Introduction</h2>
            <p>
              This Privacy Policy explains how your personal information is collected, used, and protected when you use the Animorphs web game ("Service"). We are committed to safeguarding your privacy and complying with the Protection of Personal Information Act (POPIA) and other applicable global data protection regulations.
            </p>

            <h2 className="text-xl font-semibold mt-6 mb-3 text-fantasy-accent">Information We Collect</h2>
            <p className="font-semibold">2.1. Registration Information:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Personal details (such as name, email address, and date of birth) provided during account registration and identity verification forms.</li>
            </ul>
            
            <p className="font-semibold mt-4">2.2. Consent Documents:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>For users aged 13 to 17, a completed parental/guardian consent form (via Google Forms) is required.</li>
              <li>For users aged 18 and older, a verification form is required to confirm eligibility.</li>
            </ul>
            
            <p className="font-semibold mt-4">2.3. Usage Data:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Information about how you access and use the Service, including game activity and interactions.</li>
            </ul>
            
            <p className="font-semibold mt-4">2.4. Technical Data:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Device information, IP addresses, and browser details used to ensure a secure and functional gaming experience.</li>
            </ul>

            <h2 className="text-xl font-semibold mt-6 mb-3 text-fantasy-accent">How We Use Your Information</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>3.1. To operate and maintain the Service.</li>
              <li>3.2. To verify your identity and age for eligibility to earn rewards.</li>
              <li>3.3. To manage user accounts and provide customer support.</li>
              <li>3.4. To administer tournaments, award prizes, and manage in-game currency systems.</li>
              <li>3.5. To comply with legal obligations and protect our rights as required by applicable law.</li>
            </ul>

            <h2 className="text-xl font-semibold mt-6 mb-3 text-fantasy-accent">Data Sharing and Disclosure</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>4.1. Your personal information is collected solely for the purpose of operating a functional web game and ensuring legal compliance.</li>
              <li>4.2. We will not share, sell, or rent your personal information to any third party unless required by law or with your explicit consent.</li>
              <li>4.3. In situations where disclosure is legally mandated, we will take steps to ensure that your data is protected in accordance with POPIA and other relevant regulations.</li>
            </ul>

            <h2 className="text-xl font-semibold mt-6 mb-3 text-fantasy-accent">Data Security and Retention</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>5.1. We implement reasonable technical and organizational measures to protect your personal information from unauthorized access, disclosure, or loss.</li>
              <li>5.2. Your information is retained only for as long as necessary to fulfill the purposes for which it was collected or as required by law.</li>
            </ul>

            <h2 className="text-xl font-semibold mt-6 mb-3 text-fantasy-accent">Your Rights</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>6.1. You have the right to access, correct, or delete your personal information held by us.</li>
              <li>6.2. If you wish to exercise these rights or have any questions about our data practices, please contact us using the contact details provided below.</li>
            </ul>

            <h2 className="text-xl font-semibold mt-6 mb-3 text-fantasy-accent">International Data Transfers</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>7.1. While our primary operations are in South Africa, we may process your data in accordance with global data protection standards.</li>
              <li>7.2. Any transfer of personal data outside of South Africa will be done in compliance with applicable laws and will ensure an adequate level of protection.</li>
            </ul>

            <h2 className="text-xl font-semibold mt-6 mb-3 text-fantasy-accent">Changes to this Privacy Policy</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>8.1. We may update this Privacy Policy periodically.</li>
              <li>8.2. Any changes will be posted on this page, and your continued use of the Service constitutes your acceptance of such changes.</li>
            </ul>

            <h2 className="text-xl font-semibold mt-6 mb-3 text-fantasy-accent">Contact Information</h2>
            <p>
              If you have any questions or concerns regarding this Privacy Policy or our data practices, please contact us at:
            </p>
            <p className="mt-2">
              Email: <a href="mailto:mythicmastersp2e@gmail.com" className="text-fantasy-accent">mythicmastersp2e@gmail.com</a>
            </p>
            <p>
              Address: FH11, Groot Zorgfontein, Grootbrak, Western Cape, South Africa
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

export default PrivacyPolicy;
