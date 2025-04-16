import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/components/auth/AuthProvider';
import { Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

const UserProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user, isLoading } = useAuth();
  const [profile, setProfile] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/login');
    }
  }, [user, isLoading, navigate]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (userId) {
        // Placeholder for fetching user profile data
        // Replace with your actual data fetching logic
        const mockProfile = {
          id: userId,
          username: 'johndoe',
          name: 'John',
          surname: 'Doe',
          email: 'john.doe@example.com',
          avatarUrl: 'https://github.com/shadcn.png',
          isVerified: true,
        };
        setProfile(mockProfile);
      }
    };

    fetchProfile();
  }, [userId]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Card>
          <CardContent className="p-8">
            <CardTitle className="text-lg font-semibold">User Profile Not Found</CardTitle>
            <p>Could not retrieve user profile.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-12 px-4">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">User Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-4">
            <Avatar>
              <AvatarImage src={profile.avatarUrl} alt={profile.name} />
              <AvatarFallback>{profile.name?.[0]}{profile.surname?.[0]}</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-lg font-semibold">{profile.name} {profile.surname}</h2>
              <p className="text-sm text-gray-500">{profile.username}</p>
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-500">Email</p>
            <p>{profile.email}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Status</p>
            {profile.isVerified ? (
              <Badge variant="outline">Verified</Badge>
            ) : (
              <Badge variant="destructive">Unverified</Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserProfile;
