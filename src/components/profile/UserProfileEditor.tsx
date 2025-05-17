
import React from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/modules/auth";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import { d1Worker } from "@/lib/cloudflare/d1Worker";
import { UserProfile } from "@/types/user";

const profileSchema = z.object({
  bio: z.string().max(500, "Bio must be less than 500 characters").optional(),
  favorite_animorph: z.string().max(100).optional(),
  favorite_battle_mode: z.string().max(100).optional(),
  online_times_gmt2: z.string().max(100).optional(),
  playing_times: z.string().max(100).optional(),
  profile_image_url: z.string().url("Please enter a valid URL").optional().or(z.literal('')),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const UserProfileEditor = () => {
  const { user, token, userProfile, refreshProfile } = useAuth();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      bio: userProfile?.bio || "",
      favorite_animorph: userProfile?.favorite_animorph || "",
      favorite_battle_mode: userProfile?.favorite_battle_mode || "",
      online_times_gmt2: userProfile?.online_times_gmt2 || "",
      playing_times: userProfile?.playing_times || "",
      profile_image_url: userProfile?.profile_image_url || "",
    }
  });

  const onSubmit = async (data: ProfileFormValues) => {
    if (!user || !token?.access_token) return;
    
    setIsSubmitting(true);
    try {
      await d1Worker.update(
        'profiles',
        data,
        'id = ?',
        [user.id],
        token.access_token
      );

      await refreshProfile();
      toast({
        title: "Profile updated successfully",
        description: "Your profile information has been saved.",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error updating profile",
        description: "There was a problem updating your profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bio</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Tell us about yourself..."
                  className="h-32"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="favorite_animorph"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Favorite Animorph</FormLabel>
              <FormControl>
                <Input placeholder="Your favorite Animorph" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="favorite_battle_mode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Favorite Battle Mode</FormLabel>
              <FormControl>
                <Input placeholder="Your preferred battle mode" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="online_times_gmt2"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Online Times (GMT+2)</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Weekdays 18:00-22:00" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="playing_times"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Playing Schedule</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Weekends, Evening hours" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="profile_image_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Profile Image URL</FormLabel>
              <FormControl>
                <Input placeholder="https://example.com/your-image.jpg" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving changes...
            </>
          ) : (
            "Save Changes"
          )}
        </Button>
      </form>
    </Form>
  );
};

export default UserProfileEditor;
