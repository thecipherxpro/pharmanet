import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, 
  XCircle, 
  Smartphone, 
  Wifi, 
  WifiOff, 
  Bell,
  Download 
} from "lucide-react";

/**
 * PWAStatus Component
 * 
 * Displays the current status of PWA features:
 * - Installation status
 * - Online/Offline status
 * - Notification permission
 * - Service worker status
 * 
 * Usage:
 * <PWAStatus />
 */
export default function PWAStatus() {
  const [status, setStatus] = useState({
    installed: false,
    online: navigator.onLine,
    notifications: 'default',
    serviceWorker: false
  });

  useEffect(() => {
    // Check if installed (standalone mode)
    const isInstalled = window.matchMedia('(display-mode: standalone)').matches || 
                       window.navigator.standalone ||
                       document.referrer.includes('android-app://');
    
    // Check notification permission
    const notificationStatus = 'Notification' in window ? Notification.permission : 'unsupported';
    
    // Check service worker
    const hasServiceWorker = 'serviceWorker' in navigator && 
                            navigator.serviceWorker.controller !== null;

    setStatus({
      installed: isInstalled,
      online: navigator.onLine,
      notifications: notificationStatus,
      serviceWorker: hasServiceWorker
    });

    // Listen for online/offline changes
    const handleOnline = () => setStatus(prev => ({ ...prev, online: true }));
    const handleOffline = () => setStatus(prev => ({ ...prev, online: false }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <Card className="border-gray-200">
      <CardContent className="p-4">
        <h3 className="font-semibold text-sm text-gray-900 mb-3">PWA Status</h3>
        
        <div className="space-y-2">
          {/* Installation Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-gray-600" />
              <span className="text-sm text-gray-700">Installed</span>
            </div>
            {status.installed ? (
              <Badge className="bg-green-100 text-green-700 border-green-300">
                <CheckCircle className="w-3 h-3 mr-1" />
                Yes
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-gray-100">
                <Download className="w-3 h-3 mr-1" />
                Browser
              </Badge>
            )}
          </div>

          {/* Network Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {status.online ? (
                <Wifi className="w-4 h-4 text-gray-600" />
              ) : (
                <WifiOff className="w-4 h-4 text-gray-600" />
              )}
              <span className="text-sm text-gray-700">Network</span>
            </div>
            {status.online ? (
              <Badge className="bg-green-100 text-green-700 border-green-300">
                <CheckCircle className="w-3 h-3 mr-1" />
                Online
              </Badge>
            ) : (
              <Badge className="bg-amber-100 text-amber-700 border-amber-300">
                <WifiOff className="w-3 h-3 mr-1" />
                Offline
              </Badge>
            )}
          </div>

          {/* Notification Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-gray-600" />
              <span className="text-sm text-gray-700">Notifications</span>
            </div>
            {status.notifications === 'granted' ? (
              <Badge className="bg-green-100 text-green-700 border-green-300">
                <CheckCircle className="w-3 h-3 mr-1" />
                Enabled
              </Badge>
            ) : status.notifications === 'denied' ? (
              <Badge className="bg-red-100 text-red-700 border-red-300">
                <XCircle className="w-3 h-3 mr-1" />
                Denied
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-gray-100">
                Not Set
              </Badge>
            )}
          </div>

          {/* Service Worker Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-gray-600" />
              <span className="text-sm text-gray-700">Service Worker</span>
            </div>
            {status.serviceWorker ? (
              <Badge className="bg-green-100 text-green-700 border-green-300">
                <CheckCircle className="w-3 h-3 mr-1" />
                Active
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-gray-100">
                <XCircle className="w-3 h-3 mr-1" />
                Inactive
              </Badge>
            )}
          </div>
        </div>

        {/* Info Message */}
        {!status.installed && (
          <div className="mt-3 p-2 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-800">
              💡 Install the app for the best experience with offline access
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}