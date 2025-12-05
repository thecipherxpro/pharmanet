import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminOnly } from "../components/auth/RouteProtection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Edit, Trash2, Info, AlertTriangle, AlertCircle, CheckCircle, Megaphone, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";

const ICON_TYPES = [
  { value: "info", label: "Info", icon: Info },
  { value: "warning", label: "Warning", icon: AlertTriangle },
  { value: "alert", label: "Alert", icon: AlertCircle },
  { value: "success", label: "Success", icon: CheckCircle },
  { value: "announcement", label: "Announcement", icon: Megaphone }
];

const TARGET_AUDIENCE = [
  { value: "all", label: "Everyone" },
  { value: "employer", label: "Employers Only" },
  { value: "pharmacist", label: "Pharmacists Only" }
];

function StatusNotifyContent() {
  const [showDialog, setShowDialog] = useState(false);
  const [editingNotify, setEditingNotify] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    icon_type: "info",
    action_button_text: "",
    action_button_url: "",
    is_enabled: false,
    target_audience: "all"
  });
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => base44.entities.Notify.list('-created_date')
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Notify.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
      setShowDialog(false);
      resetForm();
      toast({ title: "Notification created successfully" });
    },
    onError: (error) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Notify.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
      setShowDialog(false);
      resetForm();
      toast({ title: "Notification updated successfully" });
    },
    onError: (error) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Notify.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
      toast({ title: "Notification deleted successfully" });
    },
    onError: (error) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    }
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, is_enabled }) => base44.entities.Notify.update(id, { is_enabled }),
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
    }
  });

  const resetForm = () => {
    setFormData({
      title: "",
      message: "",
      icon_type: "info",
      action_button_text: "",
      action_button_url: "",
      is_enabled: false,
      target_audience: "all"
    });
    setEditingNotify(null);
  };

  const handleEdit = (notify) => {
    setEditingNotify(notify);
    setFormData({
      title: notify.title,
      message: notify.message,
      icon_type: notify.icon_type,
      action_button_text: notify.action_button_text || "",
      action_button_url: notify.action_button_url || "",
      is_enabled: notify.is_enabled,
      target_audience: notify.target_audience || "all"
    });
    setShowDialog(true);
  };

  const handleSubmit = () => {
    if (!formData.title || !formData.message) {
      toast({ variant: "destructive", title: "Error", description: "Title and message are required" });
      return;
    }

    if (editingNotify) {
      updateMutation.mutate({ id: editingNotify.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const getIconComponent = (type) => {
    const iconType = ICON_TYPES.find(i => i.value === type);
    return iconType ? iconType.icon : Info;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* Header */}
      <div className="bg-gray-900 text-white px-3 py-4 sm:py-6 border-b border-gray-800">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-lg sm:text-xl font-bold">Status Notifications</h1>
            <p className="text-xs sm:text-sm text-gray-400 mt-0.5">Manage portal-wide announcements</p>
          </div>
          <Button
            onClick={() => {
              resetForm();
              setShowDialog(true);
            }}
            className="bg-white text-gray-900 hover:bg-gray-100 h-9 sm:h-10"
            size="sm"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            <span className="hidden sm:inline">Add New</span>
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-3 py-4">
        {notifications.length === 0 ? (
          <Card className="border border-gray-200">
            <CardContent className="p-8 sm:p-12 text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full mx-auto mb-3 flex items-center justify-center">
                <Megaphone className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
              </div>
              <h3 className="font-bold text-gray-900 mb-1 text-sm sm:text-base">No notifications yet</h3>
              <p className="text-xs sm:text-sm text-gray-600 mb-4">Create your first status notification</p>
              <Button
                onClick={() => setShowDialog(true)}
                className="bg-gray-900 text-white hover:bg-gray-800"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Notification
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {notifications.map((notify) => {
              const IconComponent = getIconComponent(notify.icon_type);
              return (
                <Card key={notify.id} className="border border-gray-200">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gray-900 rounded-lg flex items-center justify-center flex-shrink-0">
                        <IconComponent className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className="font-bold text-gray-900 text-sm sm:text-base">{notify.title}</h3>
                          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                            <button
                              onClick={() => toggleMutation.mutate({ 
                                id: notify.id, 
                                is_enabled: !notify.is_enabled 
                              })}
                              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                                notify.is_enabled 
                                  ? 'bg-gray-900 text-white' 
                                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              }`}
                            >
                              {notify.is_enabled ? 'Active' : 'Inactive'}
                            </button>
                            <Button
                              onClick={() => handleEdit(notify)}
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              onClick={() => deleteMutation.mutate(notify.id)}
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-xs sm:text-sm text-gray-600 mb-2">{notify.message}</p>
                        <div className="flex flex-wrap gap-2 text-xs">
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded">
                            {notify.icon_type}
                          </span>
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded">
                            {TARGET_AUDIENCE.find(t => t.value === notify.target_audience)?.label || 'Everyone'}
                          </span>
                          {notify.action_button_text && (
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded">
                              Button: {notify.action_button_text}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">
              {editingNotify ? 'Edit Notification' : 'Create Notification'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 sm:space-y-4">
            <div>
              <Label className="text-xs sm:text-sm">Title *</Label>
              <Input
                placeholder="System Update"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs sm:text-sm">Message *</Label>
              <Textarea
                placeholder="Brief message about the update..."
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                rows={3}
                className="mt-1 resize-none"
              />
            </div>
            <div>
              <Label className="text-xs sm:text-sm">Icon Type</Label>
              <div className="grid grid-cols-3 gap-2 mt-1">
                {ICON_TYPES.map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    onClick={() => setFormData({ ...formData, icon_type: value })}
                    className={`px-2 py-2 rounded-lg border-2 text-xs font-medium transition-all ${
                      formData.icon_type === value
                        ? 'border-gray-900 bg-gray-900 text-white'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    <Icon className="w-4 h-4 mx-auto mb-1" />
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-xs sm:text-sm">Target Audience</Label>
              <div className="grid grid-cols-3 gap-2 mt-1">
                {TARGET_AUDIENCE.map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => setFormData({ ...formData, target_audience: value })}
                    className={`px-2 py-2 rounded-lg border-2 text-xs font-medium transition-all ${
                      formData.target_audience === value
                        ? 'border-gray-900 bg-gray-900 text-white'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-xs sm:text-sm">Action Button (Optional)</Label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <Input
                  placeholder="Button text"
                  value={formData.action_button_text}
                  onChange={(e) => setFormData({ ...formData, action_button_text: e.target.value })}
                />
                <Input
                  placeholder="URL"
                  value={formData.action_button_url}
                  onChange={(e) => setFormData({ ...formData, action_button_url: e.target.value })}
                />
              </div>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="is_enabled"
                checked={formData.is_enabled}
                onChange={(e) => setFormData({ ...formData, is_enabled: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300"
              />
              <label htmlFor="is_enabled" className="text-xs sm:text-sm font-medium text-gray-900">
                Enable immediately
              </label>
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                onClick={() => setShowDialog(false)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                className="flex-1 bg-gray-900 text-white hover:bg-gray-800"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {editingNotify ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function StatusNotify() {
  return (
    <AdminOnly>
      <StatusNotifyContent />
    </AdminOnly>
  );
}