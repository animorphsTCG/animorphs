
import React from 'react';
import RegistrationForm from '@/components/auth/RegistrationForm';

const Register = () => {
  return (
    <div className="container mx-auto py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center">Create Your Account</h1>
        <p className="text-gray-500 mb-8 text-center">
          Join our gaming community and start your adventure
        </p>
        <RegistrationForm />
      </div>
    </div>
  );
};

export default Register;
