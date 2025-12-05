import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Bell, BellOff, Check } from "lucide-react";
import { requestNotificationPermission } from "./PWAManager";
import { useToast } from "@/components/ui/use-toast";

/**
 * NotificationButton Component
 * 
 * Easy-to-use button for requesting push notification permissions.
 * Displays different states: enabled, disabled, or unavailable.
 * 
 * Usage:
 * <NotificationButton />
 */
export default function NotificationButton({ variant = "default", size = "default", className = "" }) {
  const [permission, setPermission] = useState('default');
  const [loading, setLoading] = useState(false);
  const [supported, setSupported] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Check if notifications are supported
    if (!('Notification' in window)) {
      setSupported(false);
      return;
    }

    // Get current permission status
    setPermission(Notification.permission);
  }, []);

  const handleEnableNotifications = async () => {
    if (!supported) {
      toast({
        variant: "destructive",
        title: "Not Supported",
        description: "Push notifications are not supported in this browser",
      });
      return;
    }

    if (permission === 'granted') {
      toast({
        title: "Already Enabled",
        description: "Push notifications are already enabled for this device",
      });
      return;
    }

    if (permission === 'denied') {
      toast({
        variant: "destructive",
        title: "Permission Denied",
        description: "Please enable notifications in your browser settings",
      });
      return;
    }

    setLoading(true);

    try {
      const granted = await requestNotificationPermission();
      
      if (granted) {
        setPermission('granted');
        toast({
          title: "✓ Notifications Enabled!",
          description: "You'll now receive updates about shifts and applications",
        });
      } else {
        setPermission('denied');
        toast({
          variant: "destructive",
          title: "Permission Denied",
          description: "You won't receive push notifications",
        });
      }
    } catch (error) {
      console.error('Error enabling notifications:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to enable notifications. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!supported) {
    return (
      <Button
        variant="outline"
        size={size}
        className={className}
        disabled
      >
        <BellOff className="w-4 h-4 mr-2" />
        Not Supported
      </Button>
    );
  }

  if (permission === 'granted') {
    return (
      <Button
        variant="outline"
        size={size}
        className={`${className} border-green-200 bg-green-50 text-green-700 hover:bg-green-100`}
        disabled
      >
        <Check className="w-4 h-4 mr-2" />
        Notifications On
      </Button>
    );
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleEnableNotifications}
      disabled={loading}
    >
      {loading ? (
        <>
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
          Enabling...
        </>
      ) : (
        <>
          <Bell className="w-4 h-4 mr-2" />
          Enable Notifications
        </>
      )}
    </Button>
  );
}