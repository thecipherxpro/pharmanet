import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "../components/notifications/NotificationProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bell,
  Calendar,
  User,
  Check,
  X,
  AlertCircle,
  DollarSign,
  Star,
  Mail,
  Clock,
  CheckCheck,
  Trash2,
  Filter
} from "lucide-react";
import { format } from "date-fns";

const iconMap = {
  bell: Bell,
  calendar: Calendar,
  user: User,
  check: Check,
  x: X,
  alert: AlertCircle,
  dollar: DollarSign,
  star: Star,
  mail: Mail,
  clock: Clock
};

const typeColors = {
  shift_application: "bg-blue-50 text-blue-600 border-blue-200",
  application_accepted: "bg-green-50 text-green-600 border-green-200",
  application_rejected: "bg-red-50 text-red-600 border-red-200",
  shift_cancelled: "bg-orange-50 text-orange-600 border-orange-200",
  shift_filled: "bg-teal-50 text-teal-600 border-teal-200",
  shift_reminder: "bg-purple-50 text-purple-600 border-purple-200",
  shift_completed: "bg-indigo-50 text-indigo-600 border-indigo-200",
  review_received: "bg-yellow-50 text-yellow-600 border-yellow-200",
  payment_received: "bg-emerald-50 text-emerald-600 border-emerald-200",
  penalty_charged: "bg-pink-50 text-pink-600 border-pink-200",
  invitation_received: "bg-violet-50 text-violet-600 border-violet-200",
  system: "bg-gray-50 text-gray-600 border-gray-200",
  general: "bg-gray-50 text-gray-600 border-gray-200"
};

const priorityColors = {
  urgent: "bg-red-500 text-white",
  high: "bg-orange-500 text-white",
  medium: "bg-blue-500 text-white",
  low: "bg-gray-400 text-white"
};

export default function Notifications() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("all");

  // Use centralized notification provider - with safe defaults
  let notificationContext = { notifications: [], unreadCount: 0, refresh: () => {}, markAsRead: () => {}, markAllAsRead: () => {} };
  try {
    notificationContext = useNotifications();
  } catch (e) {
    // Provider not mounted yet
  }
  const { 
    notifications = [], 
    unreadCount = 0, 
    refresh = () => {},
    markAsRead = () => {},
    markAllAsRead: markAllRead = () => {} 
  } = notificationContext || {};

  const isLoading = false;

  // Delete notification mutation
  const deleteNotificationMutation = useMutation({
    mutationFn: async (notification_id) => {
      await base44.entities.Notification.delete(notification_id);
    },
    onSuccess: () => {
      refresh();
    }
  });

  const handleNotificationClick = (notification) => {
    // Mark as read
    if (!notification.is_read) {
      markAsRead(notification.id);
    }

    // Navigate if action URL exists
    if (notification.action_url) {
      navigate(notification.action_url);
    }
  };

  const handleMarkAllRead = () => {
    markAllRead();
  };

  const handleDelete = (e, notificationId) => {
    e.stopPropagation();
    deleteNotificationMutation.mutate(notificationId);
  };

  // Filter notifications based on active tab
  const filteredNotifications = activeTab === "all" 
    ? notifications 
    : activeTab === "unread"
    ? notifications.filter(n => !n.is_read)
    : notifications.filter(n => n.priority === activeTab);

  const localUnreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-teal-500 via-cyan-600 to-teal-600 text-white px-4 pt-4 pb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold mb-1">Notifications</h1>
            <p className="text-sm text-teal-50">
              {localUnreadCount} unread • {notifications.length} total
            </p>
          </div>
          {localUnreadCount > 0 && (
            <Button
              size="sm"
              variant="secondary"
              onClick={handleMarkAllRead}
              disabled={false}
              className="bg-white/20 hover:bg-white/30 text-white border-0 h-10"
            >
              <CheckCheck className="w-4 h-4 mr-2" />
              Mark all read
            </Button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center border border-white/20">
            <p className="text-2xl font-bold">{localUnreadCount}</p>
            <p className="text-xs text-teal-100">Unread</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center border border-white/20">
            <p className="text-2xl font-bold">
              {notifications.filter(n => n.priority === 'urgent').length}
            </p>
            <p className="text-xs text-teal-100">Urgent</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center border border-white/20">
            <p className="text-2xl font-bold">
              {notifications.filter(n => n.priority === 'high').length}
            </p>
            <p className="text-xs text-teal-100">High</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center border border-white/20">
            <p className="text-2xl font-bold">{notifications.length}</p>
            <p className="text-xs text-teal-100">Total</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="px-4 -mt-3 mb-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full bg-white shadow-md grid grid-cols-5 border border-gray-200 h-12">
            <TabsTrigger 
              value="all" 
              className="text-xs font-semibold data-[state=active]:bg-teal-500 data-[state=active]:text-white"
            >
              All
            </TabsTrigger>
            <TabsTrigger 
              value="unread" 
              className="text-xs font-semibold data-[state=active]:bg-teal-500 data-[state=active]:text-white relative"
            >
              Unread
              {localUnreadCount > 0 && (
                <Badge className="ml-1 bg-red-500 text-white text-[10px] px-1.5 py-0 min-w-[18px] h-4">
                  {localUnreadCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="urgent" 
              className="text-xs font-semibold data-[state=active]:bg-red-500 data-[state=active]:text-white"
            >
              Urgent
            </TabsTrigger>
            <TabsTrigger 
              value="high" 
              className="text-xs font-semibold data-[state=active]:bg-orange-500 data-[state=active]:text-white"
            >
              High
            </TabsTrigger>
            <TabsTrigger 
              value="medium" 
              className="text-xs font-semibold data-[state=active]:bg-blue-500 data-[state=active]:text-white"
            >
              Medium
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Notifications List */}
      <div className="px-4 space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-24 bg-white rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filteredNotifications.length === 0 ? (
          <Card className="border-0 shadow-md">
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bell className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {activeTab === "all" ? "No notifications yet" : `No ${activeTab} notifications`}
              </h3>
              <p className="text-sm text-gray-600">
                {activeTab === "all" 
                  ? "You'll see updates about shifts, applications, and more here"
                  : `No ${activeTab} notifications at the moment`
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredNotifications.map((notification) => {
            const Icon = iconMap[notification.icon] || Bell;
            const colorClass = typeColors[notification.type] || typeColors.general;
            const isUnread = !notification.is_read;

            return (
              <Card
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`border-0 shadow-md hover:shadow-lg transition-all cursor-pointer ${
                  isUnread ? 'bg-blue-50/30 border-l-4 border-l-teal-500' : ''
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    {/* Icon */}
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 border-2 ${colorClass}`}>
                      <Icon className="w-6 h-6" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className={`text-base font-bold ${isUnread ? 'text-gray-900' : 'text-gray-700'}`}>
                            {notification.title}
                          </h3>
                          {isUnread && (
                            <Badge className="bg-teal-500 text-white text-xs h-5">
                              New
                            </Badge>
                          )}
                        </div>
                        <Badge className={`${priorityColors[notification.priority]} text-xs h-5`}>
                          {notification.priority}
                        </Badge>
                      </div>

                      <p className="text-sm text-gray-700 mb-3 leading-relaxed">
                        {notification.message}
                      </p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {format(new Date(notification.created_date), 'MMM d, yyyy \'at\' h:mm a')}
                          </span>
                          {notification.action_url && (
                            <Badge variant="outline" className="text-xs">
                              {notification.action_text || 'View'}
                            </Badge>
                          )}
                        </div>

                        <button
                          onClick={(e) => handleDelete(e, notification.id)}
                          className="w-8 h-8 rounded-lg hover:bg-red-100 flex items-center justify-center transition-colors"
                          title="Delete notification"
                        >
                          <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}