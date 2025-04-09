
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/components/ui/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, Link } from "react-router-dom";
import { Database } from "@/integrations/supabase/types";
import { Tables } from "@/types/supabase";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import TermsAndConditionsDialog from "@/components/TermsAndConditionsDialog";

// Define the form validation schema
const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").max(50),
  email: z.string().email("Invalid email address"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
  name: z.string().min(1, "First name is required"),
  surname: z.string().min(1, "Last name is required"),
  age: z.coerce.number().int().min(13, "You must be at least 13 years old"),
  gender: z.string().min(1, "Gender selection is required"),
  country: z.string().min(1, "Country selection is required"),
  vipCode: z.string().optional(),
  acceptTerms: z.boolean().refine(val => val === true, {
    message: "You must accept the Terms and Conditions"
  })
});

type RegisterFormValues = z.infer<typeof registerSchema>;

const Register = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [termsDialogOpen, setTermsDialogOpen] = useState(false);
  const navigate = useNavigate();
  
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      name: "",
      surname: "",
      age: undefined,
      gender: "",
      country: "",
      vipCode: "",
      acceptTerms: false
    }
  });

  const validateVipCode = async (vipCode: string): Promise<boolean> => {
    if (!vipCode || vipCode.trim() === "") return false;
    
    try {
      const { data, error } = await supabase
        .from("vip_codes")
        .select("*")
        .eq("code", vipCode.trim())
        .single();
      
      if (error || !data) return false;
      
      // Check if the code has remaining uses
      return data.current_uses < data.max_uses;
    } catch (err) {
      console.error("Error validating VIP code:", err);
      return false;
    }
  };

  const updateVipCodeUsage = async (vipCode: string) => {
    try {
      const { data } = await supabase
        .from("vip_codes")
        .select("current_uses")
        .eq("code", vipCode.trim())
        .single();
      
      if (data) {
        await supabase
          .from("vip_codes")
          .update({ current_uses: data.current_uses + 1 })
          .eq("code", vipCode.trim());
      }
    } catch (err) {
      console.error("Error updating VIP code usage:", err);
    }
  };

  const handleRegister = async (values: RegisterFormValues) => {
    setIsLoading(true);
    
    try {
      // Validate VIP code if provided
      let isVipValid = false;
      if (values.vipCode && values.vipCode.trim() !== "") {
        isVipValid = await validateVipCode(values.vipCode);
        
        if (!isVipValid) {
          toast({
            title: "Invalid VIP Code",
            description: "The VIP code is invalid or has been used too many times.",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }
      }
      
      // Create the user account with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password, // Now using the actual password entered by user
        options: {
          data: {
            username: values.username,
            name: values.name,
            surname: values.surname,
            age: values.age,
            gender: values.gender,
            country: values.country,
          }
        }
      });
      
      if (error) {
        toast({
          title: "Registration Failed",
          description: error.message,
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
      
      // If we have a valid VIP code, update its usage
      if (isVipValid && values.vipCode) {
        await updateVipCodeUsage(values.vipCode);
      }
      
      // Show success message
      toast({
        title: "Registration Successful",
        description: "Your account has been created successfully. Please check your email for verification.",
      });
      
      // Redirect to home page or login
      navigate("/");
      
    } catch (err) {
      console.error("Registration error:", err);
      toast({
        title: "Registration Failed",
        description: "An unexpected error occurred. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const countries = [
    "United States", "Canada", "United Kingdom", "Australia", 
    "Germany", "France", "Japan", "Brazil", "South Africa", "Other"
  ];
  const genderOptions = ["Male", "Female", "Non-binary", "Prefer not to say"];
  
  const handleTermsAccept = () => {
    form.setValue("acceptTerms", true);
  };

  return (
    <div className="min-h-screen py-16 px-4">
      <div className="container mx-auto max-w-3xl">
        <Card className="border-2 border-fantasy-primary bg-black/70">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-fantasy text-fantasy-accent">Create Your Account</CardTitle>
            <CardDescription>Join the Animorph Battle Verse and start your journey</CardDescription>
          </CardHeader>
          
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleRegister)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="Choose a unique username" 
                            className="fantasy-input"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="email" 
                            placeholder="Your email address" 
                            className="fantasy-input"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="password" 
                            placeholder="Create a secure password"
                            className="fantasy-input"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="Your first name" 
                            className="fantasy-input"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="surname"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="Your last name" 
                            className="fantasy-input"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="age"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel>Age</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="number" 
                            min="13"
                            max="120"
                            placeholder="Your age" 
                            className="fantasy-input"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel>Gender</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="fantasy-input">
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {genderOptions.map((option) => (
                              <SelectItem key={option} value={option}>{option}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel>Country</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="fantasy-input">
                              <SelectValue placeholder="Select country" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {countries.map((country) => (
                              <SelectItem key={country} value={country}>{country}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="vipCode"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel>VIP Code (Optional)</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="Enter your VIP code if you have one" 
                            className="fantasy-input"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="acceptTerms"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-2 space-y-0 pt-4">
                      <FormControl>
                        <Checkbox 
                          checked={field.value} 
                          onCheckedChange={field.onChange}
                          className="border-fantasy-accent data-[state=checked]:bg-fantasy-accent data-[state=checked]:text-black"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          I accept the <button 
                            type="button" 
                            onClick={() => setTermsDialogOpen(true)}
                            className="text-fantasy-accent underline"
                          >
                            Terms and Conditions
                          </button>
                        </FormLabel>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />
                
                <Button 
                  type="submit" 
                  className="fantasy-button w-full text-lg py-6" 
                  disabled={isLoading}
                >
                  {isLoading ? "Creating Your Account..." : "Register Now"}
                </Button>
              </form>
            </Form>
          </CardContent>
          
          <CardFooter>
            <div className="w-full text-center">
              <p className="text-gray-300">
                Already have an account?{" "}
                <Link to="/login" className="text-fantasy-accent hover:underline">
                  Login here
                </Link>
              </p>
            </div>
          </CardFooter>
        </Card>
      </div>
      
      <TermsAndConditionsDialog 
        open={termsDialogOpen} 
        onOpenChange={setTermsDialogOpen}
        onAccept={handleTermsAccept}
      />
    </div>
  );
};

export default Register;
