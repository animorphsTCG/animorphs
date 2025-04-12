
import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface UserPreferencesProps {
  isEditing: boolean;
  formData: {
    country: string;
    profile_image_url: string;
    [key: string]: string;
  };
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const UserPreferences: React.FC<UserPreferencesProps> = ({ 
  isEditing, 
  formData, 
  handleInputChange 
}) => {
  return (
    <div className="space-y-4 border rounded-md p-4 bg-black/50">
      <h3 className="text-xl font-semibold mb-2 text-fantasy-accent">Profile Settings</h3>
      
      <div className="space-y-2">
        <Label htmlFor="country">Country</Label>
        {isEditing ? (
          <Input
            id="country"
            name="country"
            value={formData.country}
            onChange={handleInputChange}
            placeholder="Your country"
            className="bg-gray-800"
          />
        ) : (
          <p className="text-gray-300">{formData.country || "Not specified"}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="profile_image_url">Profile Image URL</Label>
        {isEditing ? (
          <Input
            id="profile_image_url"
            name="profile_image_url"
            value={formData.profile_image_url}
            onChange={handleInputChange}
            placeholder="https://example.com/your-image.jpg"
            className="bg-gray-800"
          />
        ) : (
          <p className="text-gray-300 truncate">
            {formData.profile_image_url || "No image set"}
          </p>
        )}
      </div>

      {isEditing && (
        <div className="text-xs text-gray-400 mt-2">
          <p>Profile image should be a direct URL to an image file (jpg, png, etc.)</p>
        </div>
      )}
    </div>
  );
};

export default UserPreferences;
