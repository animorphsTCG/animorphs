
import React, { useEffect } from 'react';
import { useAuth } from '@/modules/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Loader2, AlertTriangle, Shield } from 'lucide-react';
import MusicSettings from '@/components/music/MusicSettings';
import MusicPlayer from '@/components/MusicPlayer';
import AdminPanel from '@/modules/admin/components/AdminPanel';
import UserProfileEditor from '@/components/profile/UserProfileEditor';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from '@/components/ui/use-toast';
import AdminProfileButton from '@/modules/admin/components/AdminProfileButton';

const Profile = () => {
  const { user, userProfile, isLoading, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [profileLoading, setProfileLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [showAdminPanel, setShowAdminPanel] = React.useState(false);
  const [isAdmin, setIsAdmin] = React.useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/login');
      return;
    }

    const loadProfile = async () => {
      if (user && !userProfile) {
        setProfileLoading(true);
        try {
          await refreshProfile();
          // Instead of checking the return value directly, we'll check userProfile in the next render
        } catch (err) {
          setError('Failed to load profile data');
          console.error('Error refreshing profile:', err);
          toast({
            title: "Error loading profile",
            description: "Could not load your profile data",
            variant: "destructive",
          });
        } finally {
          setProfileLoading(false);
        }
      }
    };
    
    loadProfile();
  }, [user, userProfile, refreshProfile, navigate, isLoading]);

  // This useEffect will handle showing errors if the profile wasn't found
  useEffect(() => {
    if (!profileLoading && user && !userProfile && !isLoading) {
      setError('Profile not found');
    }
  }, [profileLoading, user, userProfile, isLoading]);

  // Check if user is admin when profile loads
  useEffect(() => {
    if (userProfile) {
      setIsAdmin(userProfile.is_admin === true);
    }
  }, [userProfile]);

  if (isLoading || profileLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="container mx-auto py-12 px-4">
      {showAdminPanel && <AdminPanel onClose={() => setShowAdminPanel(false)} />}
      <div className="max-w-4xl mx-auto space-y-8">
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="profile">Profile Info</TabsTrigger>
            <TabsTrigger value="settings">Game Settings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Your Profile</CardTitle>
              </CardHeader>
              <CardContent>
                {error ? (
                  <div className="flex flex-col items-center py-8 text-center">
                    <AlertTriangle className="h-10 w-10 text-yellow-500 mb-3" />
                    <p className="text-lg font-medium">Error loading profile</p>
                    <p className="text-gray-500 mb-4">{error}</p>
                    <Button onClick={() => window.location.reload()}>
                      Try Again
                    </Button>
                  </div>
                ) : userProfile ? (
                  <div className="space-y-6">
                    <UserProfileEditor />
                    
                    {isAdmin && (
                      <div className="mt-8 border-t pt-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <Shield className="h-5 w-5 mr-2 text-green-500" />
                            <h3 className="text-lg font-medium">Admin Access</h3>
                          </div>
                          <Button 
                            onClick={() => setShowAdminPanel(true)}
                            variant="default"
                          >
                            Open Admin Panel
                          </Button>
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">
                          As an admin, you have access to additional features for managing the game.
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p>No profile data available.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="settings">
            <div className="space-y-8">
              {user && user.email?.toLowerCase() === "adanacia23d@gmail.com" && !isAdmin && (
                <AdminProfileButton onAuthenticated={() => setShowAdminPanel(true)} />
              )}
              <MusicSettings />
              <MusicPlayer />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Profile;
