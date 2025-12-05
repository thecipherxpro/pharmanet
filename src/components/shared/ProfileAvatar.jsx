import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Camera, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function ProfileAvatar({ user, size = "md", editable = true, onUploadSuccess }) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const { toast } = useToast();

  const sizes = {
    xs: "w-8 h-8 text-xs",
    sm: "w-12 h-12 text-sm",
    md: "w-16 h-16 text-lg",
    lg: "w-20 h-20 text-xl",
    xl: "w-24 h-24 text-2xl"
  };

  const getInitials = (name) => {
    if (!name) return "P";
    const parts = name.split(" ");
    return parts.length >= 2
      ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
      : parts[0][0].toUpperCase();
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        variant: "destructive",
        title: "Invalid File",
        description: "Please select an image file",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "File Too Large",
        description: "Please select an image under 5MB",
      });
      return;
    }

    setUploading(true);

    try {
      // Upload file using Core.UploadFile integration
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      // Update user profile with new avatar URL
      await base44.auth.updateMe({ avatar_url: file_url });

      // Trigger sync for pharmacists or employers
      if (user?.user_type === 'pharmacist') {
        try {
          await base44.functions.invoke('syncPublicPharmacistProfile', {});
        } catch (syncError) {
          console.error('Failed to sync public profile:', syncError);
        }
      } else if (user?.user_type === 'employer') {
        try {
          await base44.functions.invoke('syncPublicEmployerProfile', {});
        } catch (syncError) {
          console.error('Failed to sync employer profile:', syncError);
        }
      }

      toast({
        title: "✓ Avatar Updated",
        description: "Your profile picture has been updated",
      });

      // Trigger custom event for other components to update
      window.dispatchEvent(new CustomEvent('avatarUpdated', {
        detail: { avatar_url: file_url }
      }));

      // Call parent callback if provided
      if (onUploadSuccess) {
        onUploadSuccess(file_url);
      }

    } catch (error) {
      console.error('Avatar upload error:', error);
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: error.message || "Failed to upload avatar",
      });
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="relative group">
      <div className={`${sizes[size]} rounded-full ring-2 ring-teal-500/20 bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center text-white font-bold overflow-hidden flex-shrink-0`}>
        {user?.avatar_url ? (
          <img 
            src={user.avatar_url} 
            alt="Avatar" 
            className="w-full h-full object-cover"
          />
        ) : (
          getInitials(user?.full_name)
        )}
        
        {uploading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <Loader2 className="w-1/3 h-1/3 text-white animate-spin" />
          </div>
        )}
      </div>

      {editable && !uploading && (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-0 right-0 bg-teal-600 hover:bg-teal-700 text-white rounded-full p-1.5 shadow-lg transition-all opacity-0 group-hover:opacity-100"
            title="Change avatar"
          >
            <Camera className="w-3 h-3" />
          </button>
        </>
      )}
    </div>
  );
}