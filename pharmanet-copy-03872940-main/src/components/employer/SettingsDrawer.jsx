
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { 
  Bell, 
  Mail, 
  Shield, 
  Moon, 
  Globe,
  Lock,
  Smartphone,
  Calendar,
  DollarSign,
  LogOut,
  Trash2
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";

export default function SettingsDrawer({ open, onOpenChange, user, onUpdate }) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  const [settings, setSettings] = useState({
    // Notifications
    email_notifications: true,
    sms_notifications: false,
    new_application_alert: true,
    shift_filled_alert: true,
    weekly_report: true,
    
    // Privacy
    show_company_in_directory: true,
    allow_pharmacist_contact: true,
    
    // Preferences
    default_shift_duration: 8,
    auto_approve_qualified: false,
    require_references: false,
    
    // Display
    dark_mode: false,
    language: "en",
    timezone: "America/Toronto"
  });

  useEffect(() => {
    if (user) {
      setSettings({
        email_notifications: user.email_notifications ?? true,
        sms_notifications: user.sms_notifications ?? false,
        new_application_alert: user.new_application_alert ?? true,
        shift_filled_alert: user.shift_filled_alert ?? true,
        weekly_report: user.weekly_report ?? true,
        show_company_in_directory: user.show_company_in_directory ?? true,
        allow_pharmacist_contact: user.allow_pharmacist_contact ?? true,
        default_shift_duration: user.default_shift_duration ?? 8,
        auto_approve_qualified: user.auto_approve_qualified ?? false,
        require_references: user.require_references ?? false,
        dark_mode: user.dark_mode ?? false,
        language: user.language ?? "en",
        timezone: user.timezone ?? "America/Toronto"
      });
    }
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await base44.auth.updateMe(settings);
      toast({
        variant: "success",
        title: "Settings Saved",
        description: "Your preferences have been updated",
      });
      if (onUpdate) onUpdate();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save settings",
      });
    }
    setSaving(false);
  };

  const updateSetting = (key, value) => {
    setSettings({ ...settings, [key]: value });
  };

  const handleLogout = async () => {
    await base44.auth.logout();
  };

  const handleDeleteAccount = async () => {
    // In production, this would trigger an account deletion process
    toast({
      variant: "info",
      title: "Account Deletion Requested",
      description: "Our team will contact you within 24 hours",
    });
    setShowDeleteDialog(false);
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle className="text-2xl">Settings</SheetTitle>
            <SheetDescription>
              Manage your account preferences and notifications
            </SheetDescription>
          </SheetHeader>

          <Tabs defaultValue="notifications" className="w-full">
            <TabsList className="w-full grid grid-cols-3 mb-6">
              <TabsTrigger value="notifications">Alerts</TabsTrigger>
              <TabsTrigger value="privacy">Privacy</TabsTrigger>
              <TabsTrigger value="preferences">Prefs</TabsTrigger>
            </TabsList>

            {/* Notifications Tab */}
            <TabsContent value="notifications" className="space-y-6">
              <Card>
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-gray-600" />
                      <div>
                        <p className="font-medium text-gray-900">Email Notifications</p>
                        <p className="text-sm text-gray-600">Receive updates via email</p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.email_notifications}
                      onCheckedChange={(checked) => updateSetting("email_notifications", checked)}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Smartphone className="w-5 h-5 text-gray-600" />
                      <div>
                        <p className="font-medium text-gray-900">SMS Notifications</p>
                        <p className="text-sm text-gray-600">Receive urgent updates via SMS</p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.sms_notifications}
                      onCheckedChange={(checked) => updateSetting("sms_notifications", checked)}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Bell className="w-5 h-5 text-gray-600" />
                      <div>
                        <p className="font-medium text-gray-900">New Application Alerts</p>
                        <p className="text-sm text-gray-600">When pharmacists apply</p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.new_application_alert}
                      onCheckedChange={(checked) => updateSetting("new_application_alert", checked)}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-gray-600" />
                      <div>
                        <p className="font-medium text-gray-900">Shift Filled Alerts</p>
                        <p className="text-sm text-gray-600">When shifts are booked</p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.shift_filled_alert}
                      onCheckedChange={(checked) => updateSetting("shift_filled_alert", checked)}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <DollarSign className="w-5 h-5 text-gray-600" />
                      <div>
                        <p className="font-medium text-gray-900">Weekly Reports</p>
                        <p className="text-sm text-gray-600">Summary of shifts & spending</p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.weekly_report}
                      onCheckedChange={(checked) => updateSetting("weekly_report", checked)}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Privacy Tab */}
            <TabsContent value="privacy" className="space-y-6">
              <Card>
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Globe className="w-5 h-5 text-gray-600" />
                      <div>
                        <p className="font-medium text-gray-900">Show in Directory</p>
                        <p className="text-sm text-gray-600">Visible to pharmacists</p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.show_company_in_directory}
                      onCheckedChange={(checked) => updateSetting("show_company_in_directory", checked)}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-gray-600" />
                      <div>
                        <p className="font-medium text-gray-900">Allow Direct Contact</p>
                        <p className="text-sm text-gray-600">Pharmacists can message you</p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.allow_pharmacist_contact}
                      onCheckedChange={(checked) => updateSetting("allow_pharmacist_contact", checked)}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Shield className="w-5 h-5 text-blue-600" />
                    <p className="font-medium text-gray-900">Data & Security</p>
                  </div>
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full justify-start" size="sm">
                      <Lock className="w-4 h-4 mr-2" />
                      Change Password
                    </Button>
                    <Button variant="outline" className="w-full justify-start" size="sm">
                      <Shield className="w-4 h-4 mr-2" />
                      Two-Factor Authentication
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Preferences Tab */}
            <TabsContent value="preferences" className="space-y-6">
              <Card>
                <CardContent className="p-4 space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">
                      Default Shift Duration (hours)
                    </Label>
                    <Input
                      type="number"
                      min="1"
                      max="24"
                      value={settings.default_shift_duration}
                      onChange={(e) => updateSetting("default_shift_duration", parseInt(e.target.value))}
                      className="mt-1.5"
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">Auto-Approve Qualified</p>
                      <p className="text-sm text-gray-600">Match requirements automatically</p>
                    </div>
                    <Switch
                      checked={settings.auto_approve_qualified}
                      onCheckedChange={(checked) => updateSetting("auto_approve_qualified", checked)}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">Require References</p>
                      <p className="text-sm text-gray-600">Request professional references</p>
                    </div>
                    <Switch
                      checked={settings.require_references}
                      onCheckedChange={(checked) => updateSetting("require_references", checked)}
                    />
                  </div>

                  <Separator />

                  <div>
                    <Label className="text-sm font-medium text-gray-700">Language</Label>
                    <select
                      value={settings.language}
                      onChange={(e) => updateSetting("language", e.target.value)}
                      className="w-full mt-1.5 h-10 px-3 rounded-lg border border-gray-200 bg-white text-sm"
                    >
                      <option value="en">English</option>
                      <option value="fr">Français</option>
                    </select>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-700">Timezone</Label>
                    <select
                      value={settings.timezone}
                      onChange={(e) => updateSetting("timezone", e.target.value)}
                      className="w-full mt-1.5 h-10 px-3 rounded-lg border border-gray-200 bg-white text-sm"
                    >
                      <option value="America/Toronto">Eastern (Toronto)</option>
                      <option value="America/Vancouver">Pacific (Vancouver)</option>
                      <option value="America/Edmonton">Mountain (Edmonton)</option>
                      <option value="America/Winnipeg">Central (Winnipeg)</option>
                    </select>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Action Buttons */}
          <div className="mt-8 space-y-3 pb-6">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="w-full h-12 bg-blue-600 hover:bg-blue-700"
            >
              {saving ? "Saving..." : "Save Settings"}
            </Button>

            <Separator className="my-4" />

            <Button
              variant="outline"
              onClick={handleLogout}
              className="w-full h-11 border-gray-300"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>

            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(true)}
              className="w-full h-11 border-red-200 text-red-600 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Account
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete Account Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Account?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. All your data including pharmacies, shifts, and applications will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
