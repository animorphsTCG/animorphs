
import React from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import ClerkLoginForm from "@/components/auth/ClerkLoginForm";

const Login = () => {
  return (
    <div className="container flex items-center justify-center min-h-[80vh] py-12 px-4">
      <Card className="w-full max-w-md border-2 border-fantasy-primary bg-black/70">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-fantasy font-bold text-fantasy-accent">Login</CardTitle>
          <CardDescription>Enter your credentials to access your account</CardDescription>
        </CardHeader>
        
        <CardContent>
          <ClerkLoginForm />
        </CardContent>
        
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-sm text-gray-400 text-center">
            Don't have an account yet?{" "}
            <Link to="/register" className="text-fantasy-accent hover:underline">
              Register here
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Login;
