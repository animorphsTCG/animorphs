
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/components/ui/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

const Register = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    name: "",
    surname: "",
    age: "",
    gender: "",
    country: "",
    vipCode: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!acceptTerms) {
      toast({
        title: "Error",
        description: "You must accept the Terms and Conditions",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      toast({
        title: "Registration Submitted",
        description: "Your account has been registered successfully!",
      });
      setIsLoading(false);
      // In a real implementation, you would redirect the user or show a success screen
    }, 1500);
  };

  const countries = ["United States", "Canada", "United Kingdom", "Australia", "Germany", "France", "Japan", "Brazil", "Other"];
  const genderOptions = ["Male", "Female", "Non-binary", "Prefer not to say"];

  return (
    <div className="min-h-screen py-16 px-4">
      <div className="container mx-auto max-w-3xl">
        <Card className="border-2 border-fantasy-primary bg-black/70">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-fantasy text-fantasy-accent">Create Your Account</CardTitle>
            <CardDescription>Join the Animorph Battle Verse and start your journey</CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    name="username"
                    placeholder="Choose a unique username"
                    value={formData.username}
                    onChange={handleChange}
                    required
                    className="fantasy-input"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Your email address"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="fantasy-input"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="name">First Name</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Your first name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="fantasy-input"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="surname">Last Name</Label>
                  <Input
                    id="surname"
                    name="surname"
                    placeholder="Your last name"
                    value={formData.surname}
                    onChange={handleChange}
                    required
                    className="fantasy-input"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    name="age"
                    type="number"
                    min="13"
                    max="120"
                    placeholder="Your age"
                    value={formData.age}
                    onChange={handleChange}
                    required
                    className="fantasy-input"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender (Optional)</Label>
                  <Select value={formData.gender} onValueChange={(value) => handleSelectChange("gender", value)}>
                    <SelectTrigger id="gender" className="fantasy-input">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      {genderOptions.map((option) => (
                        <SelectItem key={option} value={option}>{option}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="country">Country (Optional)</Label>
                  <Select value={formData.country} onValueChange={(value) => handleSelectChange("country", value)}>
                    <SelectTrigger id="country" className="fantasy-input">
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((country) => (
                        <SelectItem key={country} value={country}>{country}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="vipCode">VIP Code (Optional)</Label>
                  <Input
                    id="vipCode"
                    name="vipCode"
                    placeholder="Enter your VIP code if you have one"
                    value={formData.vipCode}
                    onChange={handleChange}
                    className="fantasy-input"
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-2 pt-4">
                <Checkbox 
                  id="terms" 
                  checked={acceptTerms}
                  onCheckedChange={(checked) => setAcceptTerms(checked === true)}
                  className="border-fantasy-accent data-[state=checked]:bg-fantasy-accent data-[state=checked]:text-black"
                />
                <label
                  htmlFor="terms"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  I accept the <a href="#" className="text-fantasy-accent underline">Terms and Conditions</a> and <a href="#" className="text-fantasy-accent underline">Privacy Policy</a>
                </label>
              </div>
            </form>
          </CardContent>
          
          <CardFooter>
            <Button 
              className="fantasy-button w-full text-lg py-6" 
              onClick={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? "Creating Your Account..." : "Register Now"}
            </Button>
          </CardFooter>
        </Card>
        
        <div className="mt-8 text-center">
          <p className="text-gray-300">
            Already have an account?{" "}
            <a href="#" className="text-fantasy-accent hover:underline">
              Login here
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
