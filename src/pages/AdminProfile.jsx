import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Mail,
  Phone,
  Shield,
  ShieldAlert,
  Edit3,
  Save,
  Calendar
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { AdminOnly } from "../components/auth/RouteProtection";
import { format } from "date-fns";
import ProfileAvatar from "../components/shared/ProfileAvatar";

function AdminProfileContent() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    full_name: "",
    phone: ""
  });

  useEffect(() => {
    loadUser();
    
    // Listen for avatar updates
    const handleAvatarUpdate = (event) => {
      if (event.detail?.avatar_url) {
        setUser(prevUser => ({
          ...prevUser,
          avatar_url: event.detail.avatar_url
        }));
      }
    };
    
    window.addEventListener('avatarUpdated', handleAvatarUpdate);
    
    return () => {
      window.removeEventListener('avatarUpdated', handleAvatarUpdate);
    };
  }, []);

  const loadUser = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
      setFormData({
        full_name: userData.full_name || "",
        phone: userData.phone || ""
      });
    } catch (error) {
      console.error("Error loading user:", error);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await base44.auth.updateMe(formData);
      setUser(prevUser => ({ ...prevUser, ...formData }));
      setEditing(false);
      
      toast({
        title: "✓ Profile Updated",
        description: "Your changes have been saved",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update profile",
      });
    }
    setSaving(false);
  };

  const handleAvatarUpload = (newAvatarUrl) => {
    setUser(prevUser => ({ ...prevUser, avatar_url: newAvatarUrl }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-zinc-900 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-zinc-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-zinc-200 px-6 py-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-zinc-900">Admin Profile</h1>
            <p className="text-xs text-zinc-500">System Administrator</p>
          </div>
        </div>

        {/* Profile Card */}
        <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-start gap-4 mb-4">
            {/* Avatar */}
            <ProfileAvatar 
              user={user} 
              size="lg"
              editable={true}
              onUploadSuccess={handleAvatarUpload}
            />

            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-zinc-900 truncate mb-1">
                {user?.full_name || "Admin User"}
              </h2>
              <Badge variant="outline" className="bg-black text-white border-black mb-2">
                <ShieldAlert className="w-3 h-3 mr-1" />
                Administrator
              </Badge>
              <div className="flex items-center gap-1 text-xs text-zinc-500">
                <Shield className="w-3.5 h-3.5" />
                <span className="font-medium">Full Access</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          {!editing ? (
            <Button
              onClick={() => setEditing(true)}
              className="w-full h-10 bg-zinc-900 hover:bg-zinc-800"
            >
              <Edit3 className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setEditing(false);
                  setFormData({
                    full_name: user.full_name || "",
                    phone: user.phone || ""
                  });
                }}
                className="flex-1 h-10"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 h-10 bg-zinc-900 hover:bg-zinc-800"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Saving
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Profile Information */}
      <div className="px-4 max-w-3xl mx-auto space-y-3 mt-6">
        
        {/* Personal Information */}
        <Card className="border-zinc-200">
          <CardContent className="p-5">
            <h3 className="font-bold text-zinc-900 mb-4 flex items-center gap-2 text-sm">
              <User className="w-4 h-4 text-zinc-600" />
              Personal Information
            </h3>
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                  Full Name
                </Label>
                {editing ? (
                  <Input
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="h-11"
                    placeholder="Enter your name"
                  />
                ) : (
                  <p className="text-gray-900 font-medium p-3 bg-gray-50 rounded-lg">
                    {user?.full_name || "Not set"}
                  </p>
                )}
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                  Email Address
                </Label>
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <p className="text-gray-900 font-medium">{user?.email}</p>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                  Phone Number
                </Label>
                {editing ? (
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="h-11"
                    placeholder="+1 (555) 123-4567"
                  />
                ) : (
                  <p className="text-gray-900 font-medium p-3 bg-gray-50 rounded-lg">
                    {user?.phone || "Not set"}
                  </p>
                )}
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                  Account Created
                </Label>
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <p className="text-gray-900 font-medium">
                    {user?.created_date ? format(new Date(user.created_date), 'MMMM d, yyyy') : 'Unknown'}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Admin Privileges */}
        <Card className="border-2 border-zinc-900 bg-zinc-50">
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-zinc-900 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-zinc-900 text-sm mb-1">Administrator Privileges</h4>
                <p className="text-xs text-zinc-600 leading-relaxed">
                  You have full access to all system features including user management, shift oversight, and system configuration.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function AdminProfile() {
  return (
    <AdminOnly>
      <AdminProfileContent />
    </AdminOnly>
  );
}