
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { UserProfile } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock, Flag, Gamepad, Trophy, User2 } from 'lucide-react';
import { useAuth } from '@/modules/auth';

const PublicProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        if (!userId) {
          throw new Error('No user ID provided');
        }

        const { data, error: fetchError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();

        if (fetchError) {
          console.error('Error fetching profile:', fetchError);
          throw new Error('Failed to fetch profile');
        }

        if (!data) {
          throw new Error('Profile not found');
        }

        setProfile(data);
        setError(null);
      } catch (err: any) {
        console.error('Error in fetchProfile:', err);
        setError(err.message);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId]);

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <Skeleton className="h-16 w-16 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-800">Profile Not Found</h2>
              <p className="text-gray-600 mt-2">
                {error || "The requested profile could not be found."}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={profile?.profile_image_url || ''} />
              <AvatarFallback>
                {profile?.name?.[0]}{profile?.surname?.[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-2xl">
                {profile?.name} {profile?.surname}
              </CardTitle>
              <p className="text-gray-500">@{profile?.username}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {profile?.bio && (
            <div>
              <h3 className="text-lg font-semibold mb-2">About</h3>
              <p className="text-gray-600">{profile.bio}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {profile.favorite_animorph && (
              <div className="flex items-center space-x-2">
                <Trophy className="h-5 w-5 text-fantasy-accent" />
                <div>
                  <p className="text-sm text-gray-500">Favorite Animorph</p>
                  <p className="font-medium">{profile.favorite_animorph}</p>
                </div>
              </div>
            )}

            {profile.favorite_battle_mode && (
              <div className="flex items-center space-x-2">
                <Gamepad className="h-5 w-5 text-fantasy-accent" />
                <div>
                  <p className="text-sm text-gray-500">Favorite Battle Mode</p>
                  <p className="font-medium">{profile.favorite_battle_mode}</p>
                </div>
              </div>
            )}

            {profile.online_times_gmt2 && (
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-fantasy-accent" />
                <div>
                  <p className="text-sm text-gray-500">Online Times (GMT+2)</p>
                  <p className="font-medium">{profile.online_times_gmt2}</p>
                </div>
              </div>
            )}

            {profile.country && (
              <div className="flex items-center space-x-2">
                <Flag className="h-5 w-5 text-fantasy-accent" />
                <div>
                  <p className="text-sm text-gray-500">Country</p>
                  <p className="font-medium">{profile.country}</p>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 pt-6 border-t">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-fantasy-accent">{profile.mp}</p>
                <p className="text-sm text-gray-500">MP</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-fantasy-accent">{profile.ai_points}</p>
                <p className="text-sm text-gray-500">AI Points</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-fantasy-accent">{profile.lbp}</p>
                <p className="text-sm text-gray-500">LBP</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-fantasy-accent">{profile.digi}</p>
                <p className="text-sm text-gray-500">DIGI</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PublicProfile;
