
import React, { useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { formatDate } from '@/lib/utils';
import PaymentSection from '@/components/profile/PaymentSection';
import { Loader2, Lock, AlertTriangle } from 'lucide-react';
import MusicSettings from '@/components/music/MusicSettings';
import MusicPlayer from '@/components/MusicPlayer';
import AdminPanel from '@/components/admin/AdminPanel';

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
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="col-span-2 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Your Profile</CardTitle>
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm text-gray-500">Name</h3>
                      <p className="text-lg">{userProfile.name} {userProfile.surname}</p>
                    </div>
                    <div>
                      <h3 className="text-sm text-gray-500">Email</h3>
                      <p className="text-lg">{user?.email}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm text-gray-500">Age</h3>
                      <p className="text-lg">{userProfile.age}</p>
                    </div>
                    <div>
                      <h3 className="text-sm text-gray-500">Gender</h3>
                      <p className="text-lg">{userProfile.gender || 'Not specified'}</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm text-gray-500">Country</h3>
                    <p className="text-lg">{userProfile.country || 'Not specified'}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p>No profile data available.</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Game Status</CardTitle>
            </CardHeader>
            <CardContent>
              {profileLoading || (!userProfile && !error) ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : error ? (
                <div className="flex flex-col items-center py-8 text-center">
                  <AlertTriangle className="h-10 w-10 text-yellow-500 mb-3" />
                  <p className="text-lg font-medium">Error loading game status</p>
                  <p className="text-gray-500 mb-4">{error}</p>
                  <Button onClick={() => window.location.reload()}>
                    Try Again
                  </Button>
                </div>
              ) : userProfile ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-100 rounded-lg">
                    <div>
                      <h3 className="font-medium">Account Status</h3>
                      <p className="text-sm text-gray-600">
                        {userProfile.has_paid ? "Full Access" : "Limited Access (Demo Mode)"}
                      </p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm ${userProfile.has_paid ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
                      {userProfile.has_paid ? "Paid" : "Free"}
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-100 rounded-lg">
                    <div>
                      <h3 className="font-medium">Card Access</h3>
                      <p className="text-sm text-gray-600">
                        {userProfile.has_paid ? "All 200 cards" : "Limited cards (Demo only)"}
                      </p>
                    </div>
                    {!userProfile.has_paid && (
                      <Lock className="h-5 w-5 text-gray-500" />
                    )}
                  </div>
                  
                  <div className="mt-6">
                    <Button onClick={() => navigate('/card-gallery')} className="w-full">
                      View Card Gallery
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p>No game status available.</p>
                </div>
              )}
            </CardContent>
          </Card>

          <MusicSettings />
        </div>

        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Game Access</CardTitle>
            </CardHeader>
            <CardContent>
              {profileLoading || (!userProfile && !error) ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : error ? (
                <div className="flex flex-col items-center py-8 text-center">
                  <AlertTriangle className="h-10 w-10 text-yellow-500 mb-3" />
                  <p className="text-gray-500 mb-4">{error}</p>
                  <Button onClick={() => window.location.reload()}>
                    Try Again
                  </Button>
                </div>
              ) : userProfile ? (
                <PaymentSection userProfile={userProfile} onPaymentComplete={refreshProfile} />
              ) : (
                <div className="text-center py-4">
                  <p>No payment data available.</p>
                </div>
              )}
            </CardContent>
          </Card>

          <MusicPlayer />
        </div>
      </div>
    </div>
  );
};

export default Profile;
