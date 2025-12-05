import { useState, useEffect, useCallback } from 'react';

/**
 * Hook for browser notifications using the Notification API
 * No VAPID keys or service worker needed
 */
export function useBrowserNotification() {
  const [permission, setPermission] = useState('default');
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Check if notifications are supported
    const supported = 'Notification' in window;
    setIsSupported(supported);
    
    if (supported) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!isSupported) {
      console.warn('Browser notifications not supported');
      return 'unsupported';
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      // Save preference to localStorage
      localStorage.setItem('pharmanet_notification_permission', result);
      
      return result;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return 'error';
    }
  }, [isSupported]);

  const showNotification = useCallback((title, options = {}) => {
    if (!isSupported || permission !== 'granted') {
      console.log('Notifications not available or not permitted');
      return null;
    }

    const defaultOptions = {
      icon: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fc5eaf1b32d1359be8744a/6852a121a_android-launchericon-512-512.png',
      badge: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fc5eaf1b32d1359be8744a/6852a121a_android-launchericon-512-512.png',
      vibrate: [200, 100, 200],
      requireInteraction: false,
      silent: false,
      ...options,
    };

    try {
      const notification = new Notification(title, defaultOptions);

      // Handle click - navigate to URL if provided
      notification.onclick = (event) => {
        event.preventDefault();
        window.focus();
        
        if (options.url) {
          window.location.href = options.url;
        }
        
        notification.close();
      };

      // Auto close after timeout
      if (options.autoClose !== false) {
        setTimeout(() => notification.close(), options.timeout || 5000);
      }

      return notification;
    } catch (error) {
      console.error('Error showing notification:', error);
      return null;
    }
  }, [isSupported, permission]);

  return {
    permission,
    isSupported,
    isGranted: permission === 'granted',
    isDenied: permission === 'denied',
    requestPermission,
    showNotification,
  };
}

/**
 * Notification types with predefined settings
 */
export const NotificationTypes = {
  SHIFT_APPLICATION: {
    tag: 'shift-application',
    requireInteraction: true,
  },
  SHIFT_ACCEPTED: {
    tag: 'shift-accepted',
    requireInteraction: true,
  },
  SHIFT_REMINDER: {
    tag: 'shift-reminder',
    requireInteraction: true,
  },
  NEW_INVITATION: {
    tag: 'invitation',
    requireInteraction: true,
  },
  GENERAL: {
    tag: 'general',
  },
};

/**
 * Helper to create notification with type presets
 */
export function createNotification(showFn, type, title, body, url) {
  const typeSettings = NotificationTypes[type] || NotificationTypes.GENERAL;
  return showFn(title, {
    body,
    url,
    ...typeSettings,
  });
}