import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/ClerkAuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import PaymentSection from "@/components/profile/PaymentSection";
import UserStats from "@/components/profile/UserStats";
import UserPreferences from "@/components/profile/UserPreferences";
import { Loader2, User, Edit, Save, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ProfileData {
  id: string;
  username: string;
  name: string;
  surname: string;
  age: number;
  gender: string | null;
  country: string | null;
  bio: string | null;
  playing_times: string | null;
  profile_image_url: string | null;
}

interface PaymentStatus {
  has_paid: boolean;
  payment_date: string | null;
  payment_method: string | null;
}

const UserProfile = () => {
  const { username } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null);
  
  const [formData, setFormData] = useState({
    bio: "",
    playing_times: "",
    country: "",
    profile_image_url: ""
  });

  // Determine if this is the current user's profile
  const isOwnProfile = !username || (user && (username === user.username || username === user.id));
  
  // Fetch profile data on component mount
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        if (!user && isOwnProfile) {
          setError("You must be logged in to view your profile");
          setIsLoading(false);
          return;
        }
        
        const lookupUsername = isOwnProfile ? (user?.username || user?.id) : username;
        
        if (!lookupUsername) {
          throw new Error("No username provided");
        }
        
        // Try to fetch the profile by username (which contains the Clerk ID)
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('username', lookupUsername)
          .maybeSingle();
        
        if (profileError) {
          console.error("Error fetching profile:", profileError);
          setError("Could not load user profile");
          setIsLoading(false);
          return;
        }

        if (!profile) {
          setError("User profile not found. Please sign out and sign back in to create a profile.");
          setIsLoading(false);
          return;
        }
        
        setProfileData(profile);
        setFormData({
          bio: profile.bio || "",
          playing_times: profile.playing_times || "",
          country: profile.country || "",
          profile_image_url: profile.profile_image_url || ""
        });

        // Fetch payment status if viewing own profile
        if (isOwnProfile && profile) {
          const { data: paymentData, error: paymentError } = await supabase
            .from('payment_status')
            .select('has_paid, payment_date, payment_method')
            .eq('id', profile.id)
            .maybeSingle();

          if (!paymentError && paymentData) {
            setPaymentStatus(paymentData);
          }
        }
        
        setIsLoading(false);
      } catch (err) {
        console.error("Error:", err);
        setError("Failed to load profile information");
        setIsLoading(false);
      }
    };

    fetchProfileData();
  }, [username, user, isOwnProfile]);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Save profile changes
  const handleSaveProfile = async () => {
    if (!user || !profileData) return;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          bio: formData.bio,
          playing_times: formData.playing_times,
          country: formData.country,
          profile_image_url: formData.profile_image_url
        })
        .eq('username', user.username || user.id);

      if (error) {
        console.error("Error updating profile:", error);
        toast({
          variant: "destructive",
          title: "Update failed",
          description: "Could not update profile information."
        });
        return;
      }

      // Update local state with new values
      setProfileData({
        ...profileData,
        bio: formData.bio,
        playing_times: formData.playing_times,
        country: formData.country,
        profile_image_url: formData.profile_image_url
      });

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully."
      });
      
      setIsEditing(false);
    } catch (err) {
      console.error("Error saving profile:", err);
      toast({
        variant: "destructive",
        title: "Update failed",
        description: "An unexpected error occurred."
      });
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-12 px-4 flex justify-center items-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-fantasy-accent" />
          <p className="text-lg">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-12 px-4">
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={() => navigate("/battle")} className="fantasy-button">
          Back to Battle Menu
        </Button>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="container mx-auto py-12 px-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Profile not found</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="border-2 border-fantasy-primary bg-black/70">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border-2 border-fantasy-accent">
              <AvatarImage src={profileData.profile_image_url || ""} />
              <AvatarFallback className="bg-fantasy-accent/20 text-lg">
                {profileData.username?.substring(0, 2).toUpperCase() || "UN"}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-2xl font-fantasy text-fantasy-accent">
                {profileData.username}
              </CardTitle>
              <CardDescription>
                {profileData.name} {profileData.surname} • {profileData.country || "Unknown location"}
              </CardDescription>
            </div>
          </div>
          
          {isOwnProfile && !isEditing && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setIsEditing(true)}
            >
              <Edit className="h-4 w-4 mr-2" /> Edit Profile
            </Button>
          )}
          
          {isOwnProfile && isEditing && (
            <Button 
              className="fantasy-button-secondary" 
              size="sm"
              onClick={handleSaveProfile}
            >
              <Save className="h-4 w-4 mr-2" /> Save Changes
            </Button>
          )}
        </CardHeader>

        <CardContent>
          <Tabs defaultValue={isOwnProfile ? "profile" : "about"} className="space-y-4">
            <TabsList className="grid grid-cols-3">
              <TabsTrigger value="about">About</TabsTrigger>
              <TabsTrigger value="stats">Stats</TabsTrigger>
              {isOwnProfile && <TabsTrigger value="profile">My Profile</TabsTrigger>}
              {!isOwnProfile && <TabsTrigger value="cards">Cards</TabsTrigger>}
            </TabsList>
            
            <TabsContent value="about" className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Bio</h3>
                {isEditing ? (
                  <Textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    placeholder="Tell others about yourself..."
                    className="h-32 bg-gray-800"
                  />
                ) : (
                  <p className="text-gray-300">{profileData.bio || "No bio available."}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Playing Times</h3>
                {isEditing ? (
                  <Input
                    name="playing_times"
                    value={formData.playing_times}
                    onChange={handleInputChange}
                    placeholder="When are you usually online? (e.g. Weekdays 18:00-21:00 GMT+2)"
                    className="bg-gray-800"
                  />
                ) : (
                  <p className="text-gray-300">{profileData.playing_times || "Not specified."}</p>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="stats">
              <UserStats userId={profileData.id} />
            </TabsContent>
            
            {isOwnProfile && (
              <TabsContent value="profile" className="space-y-6">
                <UserPreferences 
                  isEditing={isEditing} 
                  formData={formData} 
                  handleInputChange={handleInputChange} 
                />
                
                <div className="border rounded-md p-4 bg-black/50">
                  <h3 className="text-xl font-semibold mb-4 text-fantasy-accent">Card Access</h3>
                  <PaymentSection 
                    paymentStatus={paymentStatus} 
                    setPaymentStatus={setPaymentStatus} 
                    userId={profileData.id} 
                  />
                </div>
              </TabsContent>
            )}
            
            {!isOwnProfile && (
              <TabsContent value="cards">
                <div className="text-center py-6">
                  <p className="text-gray-400">Card collection viewing coming soon!</p>
                </div>
              </TabsContent>
            )}
          </Tabs>
        </CardContent>
        
        <CardFooter className="flex justify-between border-t border-gray-800 pt-6">
          <Button variant="outline" onClick={() => navigate("/battle")}>
            Battle Menu
          </Button>
          
          {isOwnProfile && paymentStatus?.has_paid && (
            <Button onClick={() => navigate("/1v1-battle")} className="fantasy-button">
              Play 1v1 Battle
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default UserProfile;
