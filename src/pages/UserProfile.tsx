import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { UserProfile as UserProfileType } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import PaymentSection from '@/components/payment/PaymentSection';

const UserProfile = () => {
  const { id } = useParams<{ id: string }>();
  const { user, userProfile, isLoading, refreshProfile } = useAuth();
  const [profile, setProfile] = useState<UserProfileType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        if (id) {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', id)
            .single();

          if (error) {
            console.error('Error fetching profile:', error);
          } else {
            setProfile(data as UserProfileType);
          }
        } else if (userProfile) {
          // If no ID in params, use the current user's profile
          setProfile(userProfile);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [id, userProfile]);

  if (isLoading || loading) {
    return (
      <div className="container mx-auto py-12 px-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-center">
              <Skeleton className="h-8 w-40 mx-auto" />
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center space-y-4">
            <Skeleton className="h-24 w-24 rounded-full" />
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto py-12 px-4">
        <Card>
          <CardContent className="text-center">
            <p>Profile not found.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-12 px-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl text-center">
            {profile.name}'s Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center space-y-4">
          <Avatar className="h-24 w-24">
            <AvatarImage src={`https://avatar.vercel.sh/${profile.name}.png`} />
            <AvatarFallback>{profile.name?.charAt(0)}{profile.surname?.charAt(0)}</AvatarFallback>
          </Avatar>
          <p className="text-lg font-semibold">{profile.name} {profile.surname}</p>
          <p className="text-gray-500">Age: {profile.age}</p>
          
          <PaymentSection userProfile={profile} onPaymentComplete={refreshProfile} />
          
          <Button onClick={() => window.location.href = '/card-gallery'} className="w-full">
            View Card Gallery
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserProfile;
