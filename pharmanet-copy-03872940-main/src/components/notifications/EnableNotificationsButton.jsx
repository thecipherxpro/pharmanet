import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Bell, BellOff, Loader2, XCircle, Smartphone, Monitor } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";

/**
 * Convert base64 VAPID key to Uint8Array
 */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Detect device type
 */
function getDeviceType() {
  const ua = navigator.userAgent;
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'tablet';
  }
  if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
    return 'mobile';
  }
  return 'desktop';
}

/**
 * Check if browser supports notifications
 */
function isNotificationSupported() {
  return 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
}

/**
 * Get current notification permission status
 */
function getNotificationPermission() {
  if (!isNotificationSupported()) return 'denied';
  return Notification.permission;
}

/**
 * Request notification permission from user
 */
async function requestNotificationPermission() {
  try {
    console.log('🔔 [Push] Requesting notification permission...');
    
    if (!isNotificationSupported()) {
      console.warn('⚠️ [Push] Notifications not supported in this browser');
      return false;
    }

    if (Notification.permission === 'granted') {
      console.log('✅ [Push] Permission already granted');
      return true;
    }

    if (Notification.permission === 'denied') {
      console.log('❌ [Push] Permission previously denied by user');
      return false;
    }

    console.log('📱 [Push] Showing permission dialog to user...');
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      console.log('✅ [Push] Permission granted by user!');
      return true;
    } else {
      console.log('❌ [Push] Permission denied by user');
      return false;
    }
  } catch (error) {
    console.error('❌ [Push] Error requesting permission:', error);
    return false;
  }
}

/**
 * Prompt user to enable notifications
 */
async function promptForNotificationPermission() {
  try {
    if (!isNotificationSupported()) {
      const device = getDeviceType();
      return {
        success: false,
        message: `Push notifications are not supported on this ${device}.`
      };
    }

    const currentPermission = getNotificationPermission();
    
    if (currentPermission === 'granted') {
      return {
        success: true,
        message: 'Notifications are already enabled!'
      };
    }

    if (currentPermission === 'denied') {
      return {
        success: false,
        message: 'Notification permission was previously denied. Please enable it in your browser settings.'
      };
    }

    const granted = await requestNotificationPermission();
    
    if (granted) {
      return {
        success: true,
        message: 'Notification permission granted!'
      };
    } else {
      return {
        success: false,
        message: 'Notification permission denied.'
      };
    }
  } catch (error) {
    console.error('Error prompting for permission:', error);
    return {
      success: false,
      message: 'Failed to request notification permission.'
    };
  }
}

/**
 * Register service worker
 */
async function registerServiceWorker() {
  try {
    if (!('serviceWorker' in navigator)) {
      throw new Error('Service Workers not supported');
    }

    const registration = await navigator.serviceWorker.register('/service-worker.js');
    console.log('✅ [Push] Service Worker registered');
    
    await navigator.serviceWorker.ready;
    
    return registration;
  } catch (error) {
    console.error('❌ [Push] Service Worker registration failed:', error);
    throw error;
  }
}

/**
 * Check if user is already subscribed to push
 */
async function getExistingSubscription() {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      console.log('✅ [Push] Existing subscription found');
    }
    
    return subscription;
  } catch (error) {
    console.error('❌ [Push] Error checking subscription:', error);
    return null;
  }
}

/**
 * Subscribe user to push notifications
 */
async function subscribeToPushNotifications() {
  try {
    console.log('🔔 [Push] Starting subscription process...');

    if (!isNotificationSupported()) {
      throw new Error('Push notifications not supported');
    }

    const existingSubscription = await getExistingSubscription();
    if (existingSubscription) {
      console.log('🔁 [Push] Already subscribed');
      return existingSubscription;
    }

    const permissionGranted = await requestNotificationPermission();
    if (!permissionGranted) {
      throw new Error('Notification permission denied');
    }

    await registerServiceWorker();

    console.log('🔑 [Push] Fetching VAPID public key...');
    const response = await base44.functions.invoke('getVapidPublicKey');
    const { data } = response;
    
    if (!data.publicKey) {
      throw new Error('No VAPID public key received from server');
    }

    const vapidKey = urlBase64ToUint8Array(data.publicKey);

    console.log('📱 [Push] Subscribing to push manager...');
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: vapidKey
    });

    console.log('✅ [Push] Subscribed successfully');

    console.log('💾 [Push] Saving subscription to backend...');
    await base44.functions.invoke('registerPushSubscription', {
      subscription: subscription.toJSON(),
      endpoint: subscription.endpoint,
      userAgent: navigator.userAgent
    });

    console.log('🎉 [Push] Push notifications fully enabled!');
    return subscription;

  } catch (error) {
    console.error('❌ [Push] Subscription failed:', error);
    return null;
  }
}

/**
 * Unsubscribe from push notifications
 */
async function unsubscribeFromPush() {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    if (!subscription) {
      console.log('ℹ️ [Push] No active subscription to unsubscribe');
      return true;
    }

    const successful = await subscription.unsubscribe();
    
    if (successful) {
      console.log('✅ [Push] Successfully unsubscribed');
    }
    
    return successful;
  } catch (error) {
    console.error('❌ [Push] Error unsubscribing:', error);
    return false;
  }
}

/**
 * Test push notification
 */
async function testPushNotification(title = "Test Notification", body = "This is a test!") {
  try {
    const subscription = await getExistingSubscription();
    
    if (!subscription) {
      console.error('❌ [Push] No subscription found. Please subscribe first.');
      return false;
    }

    console.log('🧪 [Push] Sending test notification...');
    
    await base44.functions.invoke('sendPushNotification', {
      subscription: subscription.toJSON(),
      title,
      body,
      icon: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fc5eaf1b32d1359be8744a/6852a121a_android-launchericon-512-512.png',
      badge: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fc5eaf1b32d1359be8744a/6852a121a_android-launchericon-512-512.png',
      data: { url: '/' }
    });

    console.log('✅ [Push] Test notification sent!');
    return true;
  } catch (error) {
    console.error('❌ [Push] Test notification failed:', error);
    return false;
  }
}

/**
 * Get notification status summary
 */
async function getNotificationStatus() {
  const supported = isNotificationSupported();
  const permission = getNotificationPermission();
  const subscription = await getExistingSubscription();
  const deviceType = getDeviceType();
  
  return {
    supported,
    permission,
    subscribed: !!subscription,
    subscription: subscription ? subscription.toJSON() : null,
    deviceType,
    userAgent: navigator.userAgent
  };
}

export default function EnableNotificationsButton({ variant = "default", size = "default" }) {
  const { toast } = useToast();
  const [status, setStatus] = useState('loading');
  const [isProcessing, setIsProcessing] = useState(false);
  const [deviceType, setDeviceType] = useState('desktop');

  useEffect(() => {
    checkStatus();
    setDeviceType(getDeviceType());
  }, []);

  const checkStatus = async () => {
    const notifStatus = await getNotificationStatus();
    
    console.log('📊 [Notification Status]:', notifStatus);
    
    if (!notifStatus.supported) {
      setStatus('unsupported');
    } else if (notifStatus.permission === 'denied') {
      setStatus('denied');
    } else if (notifStatus.subscribed) {
      setStatus('subscribed');
    } else {
      setStatus('idle');
    }
  };

  const handleEnable = async () => {
    setIsProcessing(true);

    try {
      console.log('🎯 [Enable] User clicked enable notifications');
      
      const permissionResult = await promptForNotificationPermission();
      
      if (!permissionResult.success) {
        setStatus('denied');
        toast({
          variant: "destructive",
          title: "❌ Permission Denied",
          description: permissionResult.message,
        });
        setIsProcessing(false);
        return;
      }

      const subscription = await subscribeToPushNotifications();

      if (subscription) {
        setStatus('subscribed');
        toast({
          title: "🔔 Notifications Enabled!",
          description: `You'll now receive push notifications on your ${deviceType}`,
        });
        
        setTimeout(() => {
          testPushNotification(
            "Welcome to Pharmanet! 🎉",
            `Push notifications are now enabled on your ${deviceType}`
          );
        }, 1500);
      } else {
        setStatus('denied');
        toast({
          variant: "destructive",
          title: "❌ Setup Failed",
          description: "Could not complete notification setup. Please try again.",
        });
      }
    } catch (error) {
      console.error('Error enabling notifications:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to enable notifications. Please check your browser settings.",
      });
    }

    setIsProcessing(false);
  };

  const handleDisable = async () => {
    setIsProcessing(true);

    const success = await unsubscribeFromPush();

    if (success) {
      setStatus('idle');
      toast({
        title: "🔕 Notifications Disabled",
        description: "You won't receive push notifications anymore",
      });
    }

    setIsProcessing(false);
  };

  const handleTest = async () => {
    setIsProcessing(true);
    
    const device = getDeviceType();
    const success = await testPushNotification(
      `Test Notification 🧪 (${device})`,
      `This is a test push notification on your ${device}!`
    );

    if (success) {
      toast({
        title: "📬 Test Sent!",
        description: "Check for the notification on your device",
      });
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to send test notification",
      });
    }

    setIsProcessing(false);
  };

  const DeviceIcon = deviceType === 'mobile' ? Smartphone : Monitor;

  if (status === 'loading') {
    return (
      <Button variant={variant} size={size} disabled>
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        Checking...
      </Button>
    );
  }

  if (status === 'unsupported') {
    return (
      <Button variant="outline" size={size} disabled>
        <XCircle className="w-4 h-4 mr-2" />
        Not Supported on this {deviceType}
      </Button>
    );
  }

  if (status === 'denied') {
    return (
      <div className="space-y-2">
        <Button variant="outline" size={size} disabled className="w-full">
          <BellOff className="w-4 h-4 mr-2" />
          Permission Denied
        </Button>
        <p className="text-xs text-gray-600 text-center">
          Enable in your browser settings
        </p>
      </div>
    );
  }

  if (status === 'subscribed') {
    return (
      <div className="flex gap-2">
        <Button
          variant="outline"
          size={size}
          onClick={handleTest}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Bell className="w-4 h-4 mr-2" />
          )}
          Test
        </Button>
        <Button
          variant="outline"
          size={size}
          onClick={handleDisable}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <BellOff className="w-4 h-4 mr-2" />
          )}
          Disable
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleEnable}
      disabled={isProcessing}
      className="w-full"
    >
      {isProcessing ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Enabling...
        </>
      ) : (
        <>
          <DeviceIcon className="w-4 h-4 mr-2" />
          Enable Notifications on {deviceType === 'mobile' ? 'Mobile' : 'Desktop'}
        </>
      )}
    </Button>
  );
}