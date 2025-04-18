import React, { useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Loader2, AlertTriangle } from 'lucide-react';
import MusicSettings from '@/components/music/MusicSettings';
import MusicPlayer from '@/components/MusicPlayer';
import AdminPanel from '@/components/admin/AdminPanel';
import UserProfileEditor from '@/components/profile/UserProfileEditor';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Profile = () => {
  const { user, userProfile, isLoading, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [profileLoading, setProfileLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/login');
    }
  }, [user, isLoading, navigate]);

  // Ensure profile is loaded
  useEffect(() => {
    const loadProfile = async () => {
      if (user && !userProfile) {
        setProfileLoading(true);
        try {
          await refreshProfile();
        } catch (err) {
          setError('Failed to load profile data');
          console.error('Error refreshing profile:', err);
        } finally {
          setProfileLoading(false);
        }
      }
    };
    
    loadProfile();
  }, [user, userProfile, refreshProfile]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-12 px-4">
      <AdminPanel />
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
                {profileLoading || (!userProfile && !error) ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : error ? (
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
