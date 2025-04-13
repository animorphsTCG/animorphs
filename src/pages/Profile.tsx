
import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { formatDate } from '@/lib/utils';
import PaymentSection from '@/components/payment/PaymentSection';
import { Loader2, Lock } from 'lucide-react';

const Profile = () => {
  const { user, userProfile, isLoading, refreshProfile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/login');
    }
  }, [user, isLoading, navigate]);

  // Ensure profile is loaded
  useEffect(() => {
    if (user && !userProfile) {
      refreshProfile();
    }
  }, [user, userProfile, refreshProfile]);

  if (isLoading || !user) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Your Profile</CardTitle>
            </CardHeader>
            <CardContent>
              {!userProfile ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm text-gray-500">Name</h3>
                      <p className="text-lg">{userProfile.name} {userProfile.surname}</p>
                    </div>
                    <div>
                      <h3 className="text-sm text-gray-500">Email</h3>
                      <p className="text-lg">{userProfile.email}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm text-gray-500">Date of Birth</h3>
                      <p className="text-lg">{formatDate(userProfile.date_of_birth)}</p>
                    </div>
                    <div>
                      <h3 className="text-sm text-gray-500">Gender</h3>
                      <p className="text-lg">{userProfile.gender}</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm text-gray-500">Country</h3>
                    <p className="text-lg">{userProfile.country}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Game Status</CardTitle>
              </CardHeader>
              <CardContent>
                {!userProfile ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : (
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
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Game Access</CardTitle>
            </CardHeader>
            <CardContent>
              {!userProfile ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <PaymentSection userProfile={userProfile} onPaymentComplete={refreshProfile} />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;
