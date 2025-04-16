
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Gamepad2 } from 'lucide-react';
import { RegistrationForm } from '@/modules/auth';

const Register = () => {
  return (
    <div className="container mx-auto py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center">Create Your Account</h1>
        <p className="text-gray-500 mb-8 text-center">
          Join our gaming community and start your adventure
        </p>
        
        {/* Registration form */}
        <RegistrationForm />
        
        {/* Demo battle option for visitors */}
        <div className="mt-12 text-center">
          <p className="text-lg mb-4">Not ready to register yet?</p>
          <Link to="/visitor-demo-battle">
            <Button className="bg-fantasy-accent hover:bg-fantasy-accent/80 text-black font-bold">
              <Gamepad2 className="mr-2 h-5 w-5" />
              Try Demo Battle
            </Button>
          </Link>
          <p className="text-sm text-gray-300 mt-2">No registration required</p>
        </div>
      </div>
    </div>
  );
};

export default Register;
