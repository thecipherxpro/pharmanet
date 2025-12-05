import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminOnly } from "../components/auth/RouteProtection";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Bell,
  Send,
  Users,
  Briefcase,
  Stethoscope,
  Globe,
  Loader2,
  AlertCircle,
  Calendar,
  User,
  Check,
  X,
  DollarSign,
  Star,
  Mail,
  Clock,
  MessageSquare,
  ArrowLeft,
  ArrowRight,
  CheckCircle2
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/components/ui/use-toast";

const iconOptions = [
  { value: 'bell', label: 'Bell', Icon: Bell },
  { value: 'calendar', label: 'Calendar', Icon: Calendar },
  { value: 'user', label: 'User', Icon: User },
  { value: 'check', label: 'Check', Icon: Check },
  { value: 'x', label: 'X', Icon: X },
  { value: 'alert', label: 'Alert', Icon: AlertCircle },
  { value: 'dollar', label: 'Dollar', Icon: DollarSign },
  { value: 'star', label: 'Star', Icon: Star },
  { value: 'mail', label: 'Mail', Icon: Mail },
  { value: 'clock', label: 'Clock', Icon: Clock },
];

const typeOptions = [
  'system_announcement',
  'account_verified',
  'profile_updated',
  'review_received',
  'shift_posted',
  'shift_filled',
  'shift_reminder',
  'shift_completed',
  'shift_cancelled',
  'payment_received',
  'payment_sent'
];

function AdminNotificationsContent() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    target_audience: 'all',
    type: 'system_announcement',
    priority: 'medium',
    icon: 'bell',
    action_url: '',
    action_text: '',
    send_email: false
  });

  // Fetch all notifications for history
  const { data: notifications = [], isLoading: notificationsLoading } = useQuery({
    queryKey: ['allNotifications'],
    queryFn: async () => {
      const data = await base44.entities.Notification.list('-created_date', 100);
      return data;
    },
    refetchInterval: 30000,
  });

  // Fetch user counts
  const { data: userCounts, isLoading: userCountsLoading } = useQuery({
    queryKey: ['adminUserCounts'],
    queryFn: async () => {
      try {
        const response = await base44.functions.invoke('getUserCounts');
        return response.data;
      } catch (error) {
        return { total: 0, pharmacists: 0, employers: 0 };
      }
    },
    staleTime: 30000,
  });

  // Broadcast mutation
  const broadcastMutation = useMutation({
    mutationFn: async (data) => {
      const response = await base44.functions.invoke('adminBroadcastNotification', data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['allNotifications'] });
      toast({
        title: "Broadcast Sent",
        description: data.message,
        className: "bg-green-50 border-green-200 text-green-900"
      });
      
      // Reset
      setStep(1);
      setFormData({
        title: '',
        message: '',
        target_audience: 'all',
        type: 'system_announcement',
        priority: 'medium',
        icon: 'bell',
        action_url: '',
        action_text: '',
        send_email: false
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || 'Failed to send notification'
      });
    }
  });

  const updateFormData = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const targetAudience = [
    { value: 'all', label: 'All Users', Icon: Globe, count: userCounts?.total || 0 },
    { value: 'pharmacists', label: 'All Pharmacists', Icon: Stethoscope, count: userCounts?.pharmacists || 0 },
    { value: 'employers', label: 'All Employers', Icon: Briefcase, count: userCounts?.employers || 0 },
  ];

  const getAudienceLabel = (audience) => {
    const option = targetAudience.find(a => a.value === audience);
    return option?.label || 'Unknown';
  };

  // Stats
  const recentNotifications = notifications.slice(0, 20);
  const totalSent = notifications.length;
  const unreadCount = notifications.filter(n => !n.is_read).length;
  const urgentCount = notifications.filter(n => n.priority === 'urgent').length;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-600 text-white px-4 pt-6 pb-12">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
            <Bell className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-3xl font-black">Notifications</h1>
            <p className="text-purple-100 text-sm">Broadcast messages to users</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-2">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center border border-white/20">
            <p className="text-2xl font-bold">
              {userCountsLoading ? '...' : (userCounts?.total || 0)}
            </p>
            <p className="text-xs text-purple-100">Total Users</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center border border-white/20">
            <p className="text-2xl font-bold">{totalSent}</p>
            <p className="text-xs text-purple-100">Sent</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center border border-white/20">
            <p className="text-2xl font-bold">{unreadCount}</p>
            <p className="text-xs text-purple-100">Unread</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center border border-white/20">
            <p className="text-2xl font-bold">{urgentCount}</p>
            <p className="text-xs text-purple-100">Urgent</p>
          </div>
        </div>
      </div>

      {/* Stepper Wizard */}
      <div className="px-4 -mt-6 mb-8 relative z-10">
        <Card className="shadow-xl border-0">
          <CardHeader className="border-b pb-4">
            {/* Steps Indicator */}
            <div className="flex items-center justify-between px-2">
              {[
                { num: 1, label: 'Audience' },
                { num: 2, label: 'Content' },
                { num: 3, label: 'Review' }
              ].map((s, idx) => (
                <div key={s.num} className="flex items-center">
                  <div className={`flex flex-col items-center relative z-10`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                      step >= s.num 
                        ? 'bg-purple-600 text-white shadow-md scale-110' 
                        : 'bg-gray-100 text-gray-400 border border-gray-200'
                    }`}>
                      {step > s.num ? <CheckCircle2 className="w-5 h-5" /> : s.num}
                    </div>
                    <span className={`text-[10px] mt-1 font-medium ${
                      step >= s.num ? 'text-purple-600' : 'text-gray-400'
                    }`}>
                      {s.label}
                    </span>
                  </div>
                  {idx < 2 && (
                    <div className={`h-0.5 w-16 sm:w-24 mx-2 -mt-4 transition-colors duration-300 ${
                      step > s.num ? 'bg-purple-200' : 'bg-gray-100'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </CardHeader>

          <CardContent className="p-6 min-h-[300px]">
            
            {/* STEP 1: AUDIENCE */}
            {step === 1 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Who should receive this?</h3>
                {userCountsLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {targetAudience.map((audience) => {
                      const Icon = audience.Icon;
                      const isSelected = formData.target_audience === audience.value;
                      return (
                        <div 
                          key={audience.value}
                          onClick={() => updateFormData('target_audience', audience.value)}
                          className={`cursor-pointer rounded-xl border-2 p-4 transition-all hover:shadow-md ${
                            isSelected 
                              ? 'border-purple-600 bg-purple-50 ring-1 ring-purple-600' 
                              : 'border-gray-200 hover:border-purple-300 bg-white'
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 ${
                            isSelected ? 'bg-purple-200 text-purple-800' : 'bg-gray-100 text-gray-600'
                          }`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <h3 className="font-bold text-sm text-gray-900">{audience.label.replace('All ', '')}</h3>
                          <p className="text-xs text-gray-500 mt-1">{audience.count} users</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* STEP 2: CONTENT */}
            {step === 2 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label className="text-xs font-bold text-gray-500 uppercase mb-1">Title</Label>
                    <Input
                      value={formData.title}
                      onChange={(e) => updateFormData('title', e.target.value)}
                      placeholder="Notification Title"
                      className="h-11 font-semibold"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-bold text-gray-500 uppercase mb-1">Message</Label>
                    <Textarea
                      value={formData.message}
                      onChange={(e) => updateFormData('message', e.target.value)}
                      placeholder="Type your message..."
                      className="min-h-[100px]"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs font-bold text-gray-500 uppercase mb-1">Priority</Label>
                      <Select value={formData.priority} onValueChange={(v) => updateFormData('priority', v)}>
                        <SelectTrigger className="h-10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs font-bold text-gray-500 uppercase mb-1">Icon</Label>
                      <Select value={formData.icon} onValueChange={(v) => updateFormData('icon', v)}>
                        <SelectTrigger className="h-10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {iconOptions.map(i => (
                            <SelectItem key={i.value} value={i.value}>
                              <div className="flex items-center gap-2">
                                <i.Icon className="w-4 h-4" /> {i.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="sendEmail"
                        checked={formData.send_email}
                        onChange={(e) => updateFormData('send_email', e.target.checked)}
                        className="w-5 h-5 rounded text-purple-600 focus:ring-purple-500"
                      />
                      <Label htmlFor="sendEmail" className="text-sm font-medium text-gray-900 cursor-pointer">
                        Send as Email as well?
                      </Label>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 ml-8">
                      Will send a basic email notification to all recipients.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: REVIEW */}
            {step === 3 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">Preview</h3>
                  <div className="flex gap-4 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                    <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      {(() => {
                        const Icon = iconOptions.find(i => i.value === formData.icon)?.Icon || Bell;
                        return <Icon className="w-5 h-5 text-purple-600" />;
                      })()}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm">{formData.title || 'Notification Title'}</h4>
                      <p className="text-sm text-gray-600 mt-1">{formData.message || 'Message body will appear here...'}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-purple-50 p-3 rounded-lg">
                    <p className="text-xs text-purple-700 font-medium uppercase">Audience</p>
                    <p className="font-bold text-purple-900">{getAudienceLabel(formData.target_audience)}</p>
                  </div>
                  <div className={`p-3 rounded-lg ${formData.priority === 'urgent' ? 'bg-red-50' : 'bg-blue-50'}`}>
                    <p className={`text-xs font-medium uppercase ${formData.priority === 'urgent' ? 'text-red-700' : 'text-blue-700'}`}>Priority</p>
                    <p className={`font-bold ${formData.priority === 'urgent' ? 'text-red-900' : 'text-blue-900'}`}>
                      {formData.priority.charAt(0).toUpperCase() + formData.priority.slice(1)}
                    </p>
                  </div>
                </div>
              </div>
            )}

          </CardContent>

          <CardFooter className="bg-gray-50 rounded-b-xl border-t p-4 flex justify-between">
            {step > 1 ? (
              <Button variant="outline" onClick={() => setStep(step - 1)}>
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
              </Button>
            ) : (
              <div /> 
            )}

            {step < 3 ? (
              <Button 
                onClick={() => {
                  if (step === 2 && (!formData.title || !formData.message)) {
                    toast({ title: "Please fill in title and message", variant: "destructive" });
                    return;
                  }
                  setStep(step + 1);
                }}
                className="bg-purple-600 hover:bg-purple-700"
              >
                Next <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button 
                onClick={() => broadcastMutation.mutate(formData)} 
                disabled={broadcastMutation.isPending}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg"
              >
                {broadcastMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" /> Send Broadcast
                  </>
                )}
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>

      {/* Recent Broadcasts List */}
      <div className="px-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Recent Broadcasts</h2>
          <Badge variant="outline">Last {recentNotifications.length}</Badge>
        </div>

        {notificationsLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-white rounded-xl animate-pulse shadow-sm" />
            ))}
          </div>
        ) : recentNotifications.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
            <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No notifications sent yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentNotifications.map((notification) => {
              const IconComponent = iconOptions.find(i => i.value === notification.icon)?.Icon || Bell;
              return (
                <Card key={notification.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <IconComponent className="w-5 h-5 text-purple-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2">
                          <h3 className="font-bold text-gray-900 text-sm truncate">{notification.title}</h3>
                          <span className="text-[10px] text-gray-500 whitespace-nowrap">
                            {format(new Date(notification.created_date), 'MMM d')}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 line-clamp-1 mt-0.5">{notification.message}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminNotifications() {
  return (
    <AdminOnly>
      <AdminNotificationsContent />
    </AdminOnly>
  );
}