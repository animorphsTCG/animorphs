
import React from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import ClerkRegistrationForm from "@/components/auth/ClerkRegistrationForm";

const Register = () => {
  return (
    <div className="container flex items-center justify-center py-12 px-4">
      <Card className="w-full max-w-md border-2 border-fantasy-primary bg-black/70">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-fantasy font-bold text-fantasy-accent">Register</CardTitle>
          <CardDescription>Create your account to start playing</CardDescription>
        </CardHeader>
        
        <CardContent>
          <ClerkRegistrationForm />
        </CardContent>
        
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-sm text-gray-400 text-center">
            Already have an account?{" "}
            <Link to="/login" className="text-fantasy-accent hover:underline">
              Login here
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Register;
