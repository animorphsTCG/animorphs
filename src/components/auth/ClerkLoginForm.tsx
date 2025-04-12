
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSignIn } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

const ClerkLoginForm = () => {
  const { isLoaded, signIn, setActive } = useSignIn();
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;

    setIsLoading(true);
    try {
      const result = await signIn.create({
        identifier: emailAddress,
        password,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        toast({
          title: "Login successful",
          description: "Welcome back!",
        });
        
        // Update: Redirect to profile page instead of battle
        navigate("/profile");
      } else {
        toast({
          title: "Login incomplete",
          description: "Please complete additional steps if required",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      toast({
        title: "Login failed",
        description: err.errors?.[0]?.message || "Please check your credentials and try again",
        variant: "destructive",
      });
      console.error("Login error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          placeholder="Your email address"
          type="email"
          autoCapitalize="none"
          autoComplete="email"
          autoCorrect="off"
          value={emailAddress}
          onChange={(e) => setEmailAddress(e.target.value)}
          required
          disabled={isLoading}
          className="bg-gray-800"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          placeholder="Your password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={isLoading}
          className="bg-gray-800"
        />
      </div>
      <Button 
        type="submit" 
        className="w-full fantasy-button" 
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Logging in...
          </>
        ) : (
          "Login"
        )}
      </Button>
    </form>
  );
};

export default ClerkLoginForm;
