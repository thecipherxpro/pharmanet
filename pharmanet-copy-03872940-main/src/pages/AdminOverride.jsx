import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminOnly } from "../components/auth/RouteProtection";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { 
  Settings, 
  AlertTriangle, 
  Wrench, 
  Shield, 
  Lock,
  AlertCircle,
  Server,
  CloudOff,
  Plus,
  Save,
  Eye,
  Timer
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

const iconOptions = [
  { name: "Settings", icon: Settings },
  { name: "AlertTriangle", icon: AlertTriangle },
  { name: "Wrench", icon: Wrench },
  { name: "Shield", icon: Shield },
  { name: "Lock", icon: Lock },
  { name: "AlertCircle", icon: AlertCircle },
  { name: "Server", icon: Server },
  { name: "CloudOff", icon: CloudOff },
];

function AdminOverrideContent() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    is_enabled: false,
    icon_name: "Settings",
    title: "System Maintenance",
    title_size: "3xl",
    message: "We're currently performing scheduled maintenance. Please check back soon.",
    footer_text: "Thank you for your patience.",
    primary_color: "#000000",
    background_color: "#FFFFFF",
    countdown_enabled: false,
    countdown_target: "",
    countdown_label: "Back online in:"
  });

  const { data: overrides = [], isLoading } = useQuery({
    queryKey: ['systemOverride'],
    queryFn: () => base44.entities.SystemOverride.list(),
  });

  const existingOverride = overrides[0];

  React.useEffect(() => {
    if (existingOverride) {
      setFormData({
        is_enabled: existingOverride.is_enabled || false,
        icon_name: existingOverride.icon_name || "Settings",
        title: existingOverride.title || "System Maintenance",
        title_size: existingOverride.title_size || "3xl",
        message: existingOverride.message || "We're currently performing scheduled maintenance. Please check back soon.",
        footer_text: existingOverride.footer_text || "Thank you for your patience.",
        primary_color: existingOverride.primary_color || "#000000",
        background_color: existingOverride.background_color || "#FFFFFF",
        countdown_enabled: existingOverride.countdown_enabled || false,
        countdown_target: existingOverride.countdown_target || "",
        countdown_label: existingOverride.countdown_label || "Back online in:"
      });
    }
  }, [existingOverride]);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.SystemOverride.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['systemOverride'] });
      toast({
        title: "Override Created",
        description: "System override configuration saved successfully.",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.SystemOverride.update(existingOverride.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['systemOverride'] });
      toast({
        title: "Override Updated",
        description: "System override configuration updated successfully.",
      });
    },
  });

  const handleSave = () => {
    if (existingOverride) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const SelectedIcon = iconOptions.find(opt => opt.name === formData.icon_name)?.icon || Settings;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="px-4 py-4">
          <h1 className="text-xl font-bold text-gray-900">System Override</h1>
          <p className="text-sm text-gray-600">Configure maintenance mode settings</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Enable/Disable Switch */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Override Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-900">
                  {formData.is_enabled ? "Maintenance Mode Active" : "Maintenance Mode Disabled"}
                </p>
                <p className="text-sm text-gray-600">
                  {formData.is_enabled 
                    ? "Users are being redirected to maintenance page" 
                    : "Users have normal access to the app"}
                </p>
              </div>
              <Switch
                checked={formData.is_enabled}
                onCheckedChange={(checked) => setFormData({ ...formData, is_enabled: checked })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Icon Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Icon</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
              {iconOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.name}
                    onClick={() => setFormData({ ...formData, icon_name: option.name })}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      formData.icon_name === option.name
                        ? "border-blue-600 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <Icon className="w-6 h-6 mx-auto" />
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Text Content */}
        <Card>
          <CardHeader>
            <CardTitle>Content</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="System Maintenance"
              />
            </div>
            <div>
              <Label htmlFor="title_size">Title Size</Label>
              <Select
                value={formData.title_size}
                onValueChange={(value) => setFormData({ ...formData, title_size: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2xl">Small (2xl)</SelectItem>
                  <SelectItem value="3xl">Medium (3xl)</SelectItem>
                  <SelectItem value="4xl">Large (4xl)</SelectItem>
                  <SelectItem value="5xl">Extra Large (5xl)</SelectItem>
                  <SelectItem value="6xl">Huge (6xl)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="message">Message (Rich Text)</Label>
              <ReactQuill
                theme="snow"
                value={formData.message}
                onChange={(value) => setFormData({ ...formData, message: value })}
                modules={{
                  toolbar: [
                    [{ 'size': ['small', false, 'large', 'huge'] }],
                    ['bold', 'italic', 'underline'],
                    [{ 'color': [] }, { 'background': [] }],
                    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                    ['clean']
                  ]
                }}
                className="bg-white"
              />
            </div>
            <div>
              <Label htmlFor="footer">Footer Text</Label>
              <Input
                id="footer"
                value={formData.footer_text}
                onChange={(e) => setFormData({ ...formData, footer_text: e.target.value })}
                placeholder="Thank you for your patience."
              />
            </div>
          </CardContent>
        </Card>

        {/* Colors */}
        <Card>
          <CardHeader>
            <CardTitle>Colors</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="primary_color">Primary Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="primary_color"
                    type="color"
                    value={formData.primary_color}
                    onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                    className="w-20 h-10"
                  />
                  <Input
                    value={formData.primary_color}
                    onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                    placeholder="#000000"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="background_color">Background Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="background_color"
                    type="color"
                    value={formData.background_color}
                    onChange={(e) => setFormData({ ...formData, background_color: e.target.value })}
                    className="w-20 h-10"
                  />
                  <Input
                    value={formData.background_color}
                    onChange={(e) => setFormData({ ...formData, background_color: e.target.value })}
                    placeholder="#FFFFFF"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Countdown Timer */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Timer className="w-5 h-5" />
              Countdown Timer
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-900">Enable Countdown</p>
                <p className="text-sm text-gray-600">Show a countdown timer to users</p>
              </div>
              <Switch
                checked={formData.countdown_enabled}
                onCheckedChange={(checked) => setFormData({ ...formData, countdown_enabled: checked })}
              />
            </div>
            
            {formData.countdown_enabled && (
              <>
                <div>
                  <Label htmlFor="countdown_label">Countdown Label</Label>
                  <Input
                    id="countdown_label"
                    value={formData.countdown_label}
                    onChange={(e) => setFormData({ ...formData, countdown_label: e.target.value })}
                    placeholder="Back online in:"
                  />
                </div>
                <div>
                  <Label htmlFor="countdown_target">Target Date & Time</Label>
                  <Input
                    id="countdown_target"
                    type="datetime-local"
                    value={formData.countdown_target ? new Date(formData.countdown_target).toISOString().slice(0, 16) : ""}
                    onChange={(e) => setFormData({ ...formData, countdown_target: e.target.value ? new Date(e.target.value).toISOString() : "" })}
                    className="h-10"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Set when maintenance will be complete
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div 
              className="rounded-lg p-8 min-h-[300px] flex items-start"
              style={{ backgroundColor: formData.background_color, color: formData.primary_color }}
            >
              <div className="w-full">
                <div className="flex items-center gap-4 mb-6">
                  <div 
                    className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${formData.primary_color}15` }}
                  >
                    <SelectedIcon className="w-8 h-8" style={{ color: formData.primary_color }} />
                  </div>
                  <h2 className={`text-${formData.title_size} font-bold`}>{formData.title}</h2>
                </div>
                <div 
                  className="text-lg opacity-80 mb-6 prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: formData.message }}
                  style={{ color: formData.primary_color }}
                />
                
                {/* Countdown Preview */}
                {formData.countdown_enabled && formData.countdown_target && (
                  <div className="my-6 p-4 border-2 border-dashed rounded-lg" style={{ borderColor: `${formData.primary_color}30` }}>
                    <div className="text-center">
                      <p className="text-sm font-medium mb-3 opacity-70" style={{ color: formData.primary_color }}>
                        {formData.countdown_label}
                      </p>
                      <div className="flex items-center justify-center gap-2">
                        <div className="text-center">
                          <div className="text-3xl font-bold" style={{ color: formData.primary_color }}>00</div>
                          <p className="text-xs opacity-60" style={{ color: formData.primary_color }}>Hours</p>
                        </div>
                        <div className="text-2xl font-bold opacity-50" style={{ color: formData.primary_color }}>:</div>
                        <div className="text-center">
                          <div className="text-3xl font-bold" style={{ color: formData.primary_color }}>00</div>
                          <p className="text-xs opacity-60" style={{ color: formData.primary_color }}>Minutes</p>
                        </div>
                        <div className="text-2xl font-bold opacity-50" style={{ color: formData.primary_color }}>:</div>
                        <div className="text-center">
                          <div className="text-3xl font-bold" style={{ color: formData.primary_color }}>00</div>
                          <p className="text-xs opacity-60" style={{ color: formData.primary_color }}>Seconds</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <p className="text-sm opacity-60">{formData.footer_text}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            onClick={handleSave}
            disabled={createMutation.isPending || updateMutation.isPending}
            className="flex-1 h-11"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Configuration
          </Button>
          <Button
            onClick={() => navigate(createPageUrl("MaintenanceMode"))}
            variant="outline"
            className="h-11"
          >
            <Eye className="w-4 h-4 mr-2" />
            View Page
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function AdminOverride() {
  return (
    <AdminOnly>
      <AdminOverrideContent />
    </AdminOnly>
  );
}