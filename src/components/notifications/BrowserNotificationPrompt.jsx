import React, { useState, useEffect } from 'react';
import { Bell, BellOff, BellRing, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBrowserNotification } from './useBrowserNotification';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Prompt to request browser notification permission
 * Shows as a banner or card depending on variant
 */
export default function BrowserNotificationPrompt({ 
  variant = 'banner', // 'banner', 'card', 'inline'
  onDismiss,
  showAfterDelay = 3000, // Delay before showing (ms)
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const { permission, isSupported, requestPermission, isGranted, isDenied } = useBrowserNotification();

  useEffect(() => {
    // Check if already dismissed
    const dismissed = localStorage.getItem('pharmanet_notification_prompt_dismissed');
    if (dismissed) {
      setIsDismissed(true);
      return;
    }

    // Don't show if not supported or already granted/denied
    if (!isSupported || isGranted || isDenied) {
      return;
    }

    // Show after delay
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, showAfterDelay);

    return () => clearTimeout(timer);
  }, [isSupported, isGranted, isDenied, showAfterDelay]);

  const handleEnable = async () => {
    const result = await requestPermission();
    if (result === 'granted') {
      setIsVisible(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('pharmanet_notification_prompt_dismissed', 'true');
    onDismiss?.();
  };

  if (!isVisible || isDismissed || !isSupported || isGranted || isDenied) {
    return null;
  }

  if (variant === 'banner') {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-14 left-0 right-0 z-50 px-4 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg"
        >
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <BellRing className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-sm">Enable Notifications</p>
                <p className="text-xs text-white/80">Get alerts for new shifts, applications & updates</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={handleEnable}
                className="bg-white text-teal-600 hover:bg-white/90 h-8 text-xs font-medium"
              >
                <Bell className="w-3.5 h-3.5 mr-1.5" />
                Enable
              </Button>
              <button
                onClick={handleDismiss}
                className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  if (variant === 'card') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gradient-to-br from-teal-50 to-cyan-50 border border-teal-100 rounded-xl p-4"
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
            <BellRing className="w-5 h-5 text-teal-600" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900 text-sm mb-1">Stay Updated</h4>
            <p className="text-xs text-gray-600 mb-3">
              Enable notifications to get instant alerts for new shifts, application updates, and important reminders.
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleEnable}
                className="bg-teal-600 hover:bg-teal-700 h-8 text-xs"
              >
                <Bell className="w-3.5 h-3.5 mr-1.5" />
                Enable Notifications
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDismiss}
                className="h-8 text-xs text-gray-500"
              >
                Not Now
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // Inline variant
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
      <div className="flex items-center gap-2">
        <Bell className="w-4 h-4 text-gray-500" />
        <span className="text-sm text-gray-700">Browser notifications</span>
      </div>
      <Button size="sm" variant="outline" onClick={handleEnable} className="h-7 text-xs">
        Enable
      </Button>
    </div>
  );
}

/**
 * Compact notification status indicator for settings pages
 */
export function NotificationStatus() {
  const { permission, isSupported, requestPermission, isGranted, isDenied } = useBrowserNotification();

  if (!isSupported) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <BellOff className="w-4 h-4" />
        <span>Not supported in this browser</span>
      </div>
    );
  }

  if (isGranted) {
    return (
      <div className="flex items-center gap-2 text-sm text-green-600">
        <Check className="w-4 h-4" />
        <span>Notifications enabled</span>
      </div>
    );
  }

  if (isDenied) {
    return (
      <div className="flex items-center gap-2 text-sm text-red-500">
        <BellOff className="w-4 h-4" />
        <span>Blocked - Enable in browser settings</span>
      </div>
    );
  }

  return (
    <Button size="sm" variant="outline" onClick={requestPermission} className="h-8">
      <Bell className="w-3.5 h-3.5 mr-1.5" />
      Enable Notifications
    </Button>
  );
}