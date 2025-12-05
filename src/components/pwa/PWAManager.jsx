import React, { useEffect, useState } from "react";
import { Wifi, WifiOff, RefreshCw } from "lucide-react";
import { getLastSync, getPendingActions } from "./OfflineStorage";

/**
 * PWA Manager Component
 * Handles online/offline status with visual feedback
 */
export default function PWAManager() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [showBanner, setShowBanner] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const handleOnline = () => {
      console.log('🌐 App is online');
      setIsOffline(false);
      document.body.classList.remove('offline');
      
      // Show reconnected message briefly
      setShowBanner(true);
      setTimeout(() => setShowBanner(false), 3000);
      
      // Check pending actions
      const pending = getPendingActions();
      if (pending.length > 0) {
        setPendingCount(pending.length);
      }
    };

    const handleOffline = () => {
      console.log('📴 App is offline');
      setIsOffline(true);
      setShowBanner(true);
      document.body.classList.add('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check initial status
    if (!navigator.onLine) {
      setIsOffline(true);
      setShowBanner(true);
      document.body.classList.add('offline');
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showBanner) return null;

  return (
    <div 
      className={`fixed top-0 left-0 right-0 z-[99999] px-4 py-2 flex items-center justify-center gap-2 text-sm font-medium transition-all duration-300 ${
        isOffline 
          ? 'bg-amber-500 text-white' 
          : 'bg-green-500 text-white'
      }`}
    >
      {isOffline ? (
        <>
          <WifiOff className="w-4 h-4" />
          <span>You're offline. Viewing cached data.</span>
        </>
      ) : (
        <>
          <Wifi className="w-4 h-4" />
          <span>Back online!</span>
          {pendingCount > 0 && (
            <span className="flex items-center gap-1 ml-2">
              <RefreshCw className="w-3 h-3 animate-spin" />
              Syncing {pendingCount} changes...
            </span>
          )}
        </>
      )}
    </div>
  );
}