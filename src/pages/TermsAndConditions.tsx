
import React from 'react';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';

const TermsAndConditions = () => {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold mb-6">Terms and Conditions</h1>
        
        <div className="prose max-w-none">
          <h2 className="text-xl font-semibold mt-8 mb-4">1. Introduction</h2>
          <p>
            Welcome to our gaming platform. These terms and conditions outline the rules and regulations
            for the use of our Website and services.
          </p>
          
          <h2 className="text-xl font-semibold mt-8 mb-4">2. Acceptance of Terms</h2>
          <p>
            By accessing this website, we assume you accept these terms and conditions. Do not continue
            to use our website if you do not agree to take all of the terms and conditions stated on this page.
          </p>
          
          <h2 className="text-xl font-semibold mt-8 mb-4">3. User Eligibility</h2>
          <p>
            To use our gaming services, users must be at least 18 years old. By registering, you confirm
            that you meet this age requirement and that online gaming with potential real-money rewards
            is legal in your jurisdiction.
          </p>
          
          <h2 className="text-xl font-semibold mt-8 mb-4">4. Registration and Account</h2>
          <p>
            Users must provide accurate, current, and complete information during the registration process.
            You are responsible for maintaining the confidentiality of your account credentials and for all
            activities that occur under your account.
          </p>
          
          <h2 className="text-xl font-semibold mt-8 mb-4">5. Payment Terms</h2>
          <p>
            Some features of our service require payment. By making a payment, you agree to provide accurate
            billing information and authorize us to charge the specified amount to your chosen payment method.
            All payments are final and non-refundable unless required by law.
          </p>
          
          <h2 className="text-xl font-semibold mt-8 mb-4">6. Code of Conduct</h2>
          <p>
            Users agree to behave responsibly while using our services. Prohibited activities include cheating,
            harassment, exploitation of game mechanics, and any illegal activities.
          </p>
          
          <h2 className="text-xl font-semibold mt-8 mb-4">7. Intellectual Property</h2>
          <p>
            All content on this website, including text, graphics, logos, images, audio clips, digital downloads,
            and software, is the property of our company and is protected by international copyright laws.
          </p>
          
          <h2 className="text-xl font-semibold mt-8 mb-4">8. Changes to Terms</h2>
          <p>
            We reserve the right to modify these terms at any time. Your continued use of the website after
            changes to the Terms constitutes your acceptance of the new Terms.
          </p>
          
          <h2 className="text-xl font-semibold mt-8 mb-4">9. Contact Information</h2>
          <p>
            If you have any questions about these Terms, please contact us at support@example.com.
          </p>
        </div>
        
        <div className="mt-12 flex justify-between">
          <Button onClick={() => navigate(-1)} variant="outline">
            Go Back
          </Button>
          <Link to="/register">
            <Button>
              Register Now
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditions;
