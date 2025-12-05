import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Settings,
  Shield,
  Bell,
  Database,
  Lock,
  Save
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { AdminOnly } from "../components/auth/RouteProtection";
import AboutCTACard from "@/components/shared/AboutCTACard";

function AdminSettingsContent() {
  const [user, setUser] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const userData = await base44.auth.me();
    setUser(userData);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-gray-700 to-gray-900 text-white p-6 pb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">System Settings</h1>
            <p className="text-gray-300 text-sm">Configure system preferences</p>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-4 space-y-3">
        {/* Admin Profile */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-5 h-5 text-red-600" />
              <h2 className="font-bold text-gray-900">Admin Account</h2>
            </div>
            <div className="space-y-3">
              <div>
                <Label className="text-sm text-gray-600">Name</Label>
                <p className="font-medium text-gray-900">{user?.full_name}</p>
              </div>
              <div>
                <Label className="text-sm text-gray-600">Email</Label>
                <p className="font-medium text-gray-900">{user?.email}</p>
              </div>
              <div>
                <Label className="text-sm text-gray-600">Role</Label>
                <p className="font-medium text-red-600">System Administrator</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Info */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <Database className="w-5 h-5 text-blue-600" />
              <h2 className="font-bold text-gray-900">System Information</h2>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Platform Version</span>
                <span className="font-medium">v1.0.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Database</span>
                <span className="font-medium">Base44</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Environment</span>
                <span className="font-medium">Production</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <Lock className="w-5 h-5 text-green-600" />
              <h2 className="font-bold text-gray-900">Security</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Two-Factor Authentication</p>
                  <p className="text-sm text-gray-600">Add extra security layer</p>
                </div>
                <Switch />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Session Timeout</p>
                  <p className="text-sm text-gray-600">Auto-logout after inactivity</p>
                </div>
                <Switch defaultChecked />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <Bell className="w-5 h-5 text-purple-600" />
              <h2 className="font-bold text-gray-900">Notifications</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">System Alerts</p>
                  <p className="text-sm text-gray-600">Critical system notifications</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">User Activity</p>
                  <p className="text-sm text-gray-600">New registrations & updates</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Daily Reports</p>
                  <p className="text-sm text-gray-600">Daily system summary</p>
                </div>
                <Switch />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* About & Support */}
        <AboutCTACard />
      </div>
    </div>
  );
}

export default function AdminSettings() {
  return (
    <AdminOnly>
      <AdminSettingsContent />
    </AdminOnly>
  );
}