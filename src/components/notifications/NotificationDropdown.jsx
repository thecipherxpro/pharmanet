import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  ExternalLink,
  Wifi,
  WifiOff
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotifications } from "./NotificationProvider";

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
  shift_posted: "bg-cyan-50 text-cyan-600 border-cyan-200",
  system: "bg-gray-50 text-gray-600 border-gray-200",
  general: "bg-gray-50 text-gray-600 border-gray-200"
};

const priorityBadges = {
  urgent: { color: "bg-red-500", text: "Urgent" },
  high: { color: "bg-orange-500", text: "High" },
  medium: { color: "bg-blue-500", text: "Medium" },
  low: { color: "bg-gray-400", text: "Low" }
};

export default function NotificationDropdown() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  
  // Use the centralized notification provider - with safe defaults
  let notificationContext = { notifications: [], unreadCount: 0, isConnected: false, refresh: () => {}, markAsRead: () => {}, markAllAsRead: () => {} };
  try {
    notificationContext = useNotifications();
  } catch (e) {
    // Provider not mounted yet
  }
  const { 
    notifications = [], 
    unreadCount = 0, 
    isConnected = false,
    refresh = () => {},
    markAsRead = () => {},
    markAllAsRead = () => {} 
  } = notificationContext || {};

  // Get current user info
  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        setCurrentUser(userData);
      } catch (error) {
        console.error('Failed to load user:', error);
      }
    };
    loadUser();
  }, []);

  const isLoading = false; // Provider handles loading state



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
      setOpen(false);
      
      const url = notification.action_url.startsWith('/') 
        ? notification.action_url 
        : createPageUrl(notification.action_url);
      
      navigate(url);
    }
  };

  const handleMarkAllRead = () => {
    markAllAsRead();
  };

  const handleDelete = (e, notificationId) => {
    e.stopPropagation();
    deleteNotificationMutation.mutate(notificationId);
  };

  const recentNotifications = notifications.slice(0, 8);

  // Show warning if user has no user_type
  if (currentUser && !currentUser.user_type && currentUser.role !== 'admin') {
    return (
      <button 
        className="relative p-1.5 rounded-lg bg-amber-100 opacity-50 cursor-not-allowed"
        title="Please complete role selection"
      >
        <AlertCircle size={16} className="text-amber-600" />
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1">
      {/* Notifications Dropdown */}
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <button className="relative p-1.5 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors">
            <Bell size={16} className="text-gray-700" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 shadow-lg ring-2 ring-white animate-pulse">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
        </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-96 p-0 mr-2" sideOffset={8}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-teal-50 to-cyan-50">
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-gray-900 text-base">Notifications</h3>
                {isConnected ? (
                  <Wifi className="w-3 h-3 text-green-500" />
                ) : (
                  <WifiOff className="w-3 h-3 text-gray-400" />
                )}
              </div>
              {currentUser?.user_type && (
                <p className="text-xs text-gray-600 capitalize">{currentUser.user_type} Portal</p>
              )}
            </div>
            {unreadCount > 0 && (
              <Badge className="bg-red-500 text-white text-xs">
                {unreadCount} new
              </Badge>
            )}
          </div>
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleMarkAllRead}
                className="h-7 text-xs hover:bg-teal-100"
              >
                <CheckCheck className="w-3 h-3 mr-1" />
                Mark all read
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setOpen(false);
                navigate(createPageUrl("Notifications"));
              }}
              className="h-7 text-xs hover:bg-teal-100"
            >
              <ExternalLink className="w-3 h-3 mr-1" />
              View all
            </Button>
          </div>
        </div>

        {/* Notifications List */}
        <ScrollArea className="max-h-[450px]">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="w-8 h-8 border-3 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">Loading...</p>
            </div>
          ) : recentNotifications.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Bell className="w-8 h-8 text-gray-400" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-1">All caught up!</h4>
              <p className="text-sm text-gray-600">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {recentNotifications.map((notification) => {
                const Icon = iconMap[notification.icon] || Bell;
                const colorClass = typeColors[notification.type] || typeColors.general;
                const isUnread = !notification.is_read;

                return (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-3 hover:bg-gray-50 cursor-pointer transition-colors relative ${
                      isUnread ? 'bg-blue-50/30' : ''
                    }`}
                  >
                    {/* Unread indicator */}
                    {isUnread && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-teal-500"></div>
                    )}

                    <div className="flex gap-3">
                      {/* Icon */}
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 border ${colorClass}`}>
                        <Icon className="w-5 h-5" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className={`text-sm font-semibold ${isUnread ? 'text-gray-900' : 'text-gray-700'}`}>
                            {notification.title}
                          </h4>
                          {notification.priority !== 'low' && notification.priority !== 'medium' && (
                            <Badge 
                              className={`${priorityBadges[notification.priority].color} text-white text-[10px] px-1.5 h-4`}
                            >
                              {priorityBadges[notification.priority].text}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            {format(new Date(notification.created_date), 'MMM d, h:mm a')}
                          </span>
                          <button
                            onClick={(e) => handleDelete(e, notification.id)}
                            className="w-6 h-6 rounded hover:bg-red-100 flex items-center justify-center transition-colors"
                            title="Delete notification"
                          >
                            <Trash2 className="w-3 h-3 text-gray-400 hover:text-red-600" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        {recentNotifications.length > 0 && (
          <div className="p-3 border-t border-gray-200 bg-gray-50">
            <Button
              variant="ghost"
              onClick={() => {
                setOpen(false);
                navigate(createPageUrl("Notifications"));
              }}
              className="w-full h-9 text-sm font-semibold text-teal-600 hover:bg-teal-50 hover:text-teal-700"
            >
              View All Notifications
            </Button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
    </div>
  );
}