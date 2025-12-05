import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, X, Share, Smartphone, Monitor, PlusSquare, MoreVertical } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const STORAGE_KEY = 'pwa_installed';
const DISMISSED_KEY = 'pwa_dismissed_permanently';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [platform, setPlatform] = useState('unknown'); // 'ios', 'android', 'windows', 'mac', 'unknown'
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    console.log('🎯 [PWA] InstallPrompt initializing...');

    // Check if already installed
    const checkInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isIOSStandalone = window.navigator.standalone === true;
      const isAndroidApp = document.referrer.includes('android-app://');
      const wasInstalled = localStorage.getItem(STORAGE_KEY) === 'true';
      
      const installed = isStandalone || isIOSStandalone || isAndroidApp || wasInstalled;
      
      if (installed) {
        console.log('✅ [PWA] App already installed - hiding prompt');
        setIsInstalled(true);
        localStorage.setItem(STORAGE_KEY, 'true');
        return true;
      }
      return false;
    };

    // Check if dismissed
    const isPermanentlyDismissed = () => {
      return localStorage.getItem(DISMISSED_KEY) === 'true';
    };

    if (checkInstalled()) {
      return;
    }

    if (isPermanentlyDismissed()) {
      console.log('🚫 [PWA] User permanently dismissed prompt');
      return;
    }

    // Detect Platform
    const userAgent = navigator.userAgent.toLowerCase();
    let detectedPlatform = 'unknown';

    if (/iphone|ipad|ipod/.test(userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) {
      detectedPlatform = 'ios';
    } else if (/android/.test(userAgent)) {
      detectedPlatform = 'android';
    } else if (/windows/.test(userAgent)) {
      detectedPlatform = 'windows';
    } else if (/mac/.test(userAgent)) {
      detectedPlatform = 'mac';
    }

    setPlatform(detectedPlatform);
    console.log('📱 [PWA] Platform detected:', detectedPlatform);

    // Listen for beforeinstallprompt (Chrome, Edge, Android)
    const handleBeforeInstall = (e) => {
      console.log('🎉 [PWA] beforeinstallprompt fired!');
      e.preventDefault();
      setDeferredPrompt(e);
      // Show prompt if it's a supported platform that fired the event
      if (!checkInstalled() && !isPermanentlyDismissed()) {
          setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // For iOS, show prompt after delay since it doesn't fire beforeinstallprompt
    if (detectedPlatform === 'ios' && !checkInstalled() && !isPermanentlyDismissed()) {
      setTimeout(() => {
        setShowPrompt(true);
      }, 3000);
    }

    // Listen for app installed
    const handleAppInstalled = () => {
      console.log('✅ [PWA] App installed successfully!');
      setShowPrompt(false);
      setIsInstalled(true);
      localStorage.setItem(STORAGE_KEY, 'true');
      localStorage.removeItem(DISMISSED_KEY);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    // Visibility change check
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        if (checkInstalled()) {
          setShowPrompt(false);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
        // If no prompt (e.g. weird state or unsupported browser that fired event?), just return
        return;
    }

    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log('📊 [PWA] User choice:', outcome);
      
      if (outcome === 'accepted') {
        setShowPrompt(false);
        setIsInstalled(true);
        localStorage.setItem(STORAGE_KEY, 'true');
        localStorage.removeItem(DISMISSED_KEY);
      }
      
      setDeferredPrompt(null);
    } catch (error) {
      console.error('❌ [PWA] Install error:', error);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
  };

  const handleDismissPermanently = () => {
    setShowPrompt(false);
    localStorage.setItem(DISMISSED_KEY, 'true');
  };

  if (isInstalled || !showPrompt) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.95 }}
        transition={{ type: "spring", damping: 25, stiffness: 120 }}
        className="fixed bottom-4 left-4 right-4 z-[9999] md:left-auto md:bottom-6 md:right-6 md:max-w-sm"
      >
        <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-md overflow-hidden ring-1 ring-black/5 rounded-2xl">
          <CardContent className="p-0 relative">
             {/* Decorative Top Gradient */}
             <div className="h-1 bg-gradient-to-r from-teal-500 via-blue-500 to-purple-500" />

            {/* Close Button */}
            <button
              onClick={handleDismiss}
              className="absolute top-3 right-3 p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors z-10"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="p-5">
              {/* iOS Instructions */}
              {platform === 'ios' && (
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                      <img 
                        src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fc5eaf1b32d1359be8744a/86aaf53ec_6852a121a_android-launchericon-512-512.png" 
                        alt="App Icon" 
                        className="w-10 h-10 object-contain"
                      />
                    </div>
                    <div className="flex-1 pr-6">
                       <h3 className="font-bold text-gray-900 text-base">Install Pharmanet</h3>
                       <p className="text-sm text-gray-600 mt-0.5">Add to Home Screen for the best experience.</p>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 space-y-3">
                    <div className="flex items-center gap-3 text-sm text-gray-700">
                      <span className="flex items-center justify-center w-6 h-6 bg-white rounded-full border border-gray-200 font-bold text-xs shadow-sm">1</span>
                      <span>Tap the <Share className="w-4 h-4 inline-block mx-1 text-blue-500" /> <strong>Share</strong> button</span>
                    </div>
                    <div className="w-full h-px bg-gray-200" />
                    <div className="flex items-center gap-3 text-sm text-gray-700">
                      <span className="flex items-center justify-center w-6 h-6 bg-white rounded-full border border-gray-200 font-bold text-xs shadow-sm">2</span>
                      <span>Scroll down & tap <PlusSquare className="w-4 h-4 inline-block mx-1 text-gray-600" /> <strong>Add to Home Screen</strong></span>
                    </div>
                    <div className="w-full h-px bg-gray-200" />
                     <div className="flex items-center gap-3 text-sm text-gray-700">
                      <span className="flex items-center justify-center w-6 h-6 bg-white rounded-full border border-gray-200 font-bold text-xs shadow-sm">3</span>
                      <span>Tap <strong>Add</strong> in top right</span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-1">
                     <Button 
                      onClick={handleDismissPermanently} 
                      variant="ghost" 
                      className="w-full text-gray-500 hover:text-gray-700 h-9 text-sm"
                    >
                      Don't show again
                    </Button>
                     <Button 
                      onClick={handleDismiss} 
                      variant="outline" 
                      className="w-full h-9 text-sm"
                    >
                      Maybe Later
                    </Button>
                  </div>
                </div>
              )}

              {/* Standard Install (Android, Windows, Chrome, etc) */}
              {platform !== 'ios' && (
                 <div className="space-y-4">
                   <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm border border-gray-100">
                      <img 
                        src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fc5eaf1b32d1359be8744a/86aaf53ec_6852a121a_android-launchericon-512-512.png" 
                        alt="App Icon" 
                        className="w-full h-full object-contain rounded-xl"
                      />
                    </div>
                    <div className="flex-1 pr-6">
                       <h3 className="font-bold text-gray-900 text-base">
                         {platform === 'windows' || platform === 'mac' ? 'Install Desktop App' : 'Install App'}
                       </h3>
                       <p className="text-sm text-gray-600 mt-0.5">
                         {platform === 'windows' || platform === 'mac' 
                           ? 'Install for a better desktop experience. Works offline.' 
                           : 'Add to your home screen for quick access and offline mode.'}
                       </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Button
                      onClick={handleInstall}
                      className="w-full bg-gray-900 hover:bg-black text-white h-10 font-medium shadow-md active:scale-95 transition-all"
                    >
                      {platform === 'windows' || platform === 'mac' ? (
                        <Monitor className="w-4 h-4 mr-2" />
                      ) : (
                        <Download className="w-4 h-4 mr-2" />
                      )}
                      Install Pharmanet
                    </Button>
                    
                    <div className="flex gap-2 justify-center">
                      <Button 
                        onClick={handleDismiss} 
                        variant="ghost" 
                        size="sm"
                        className="text-gray-500 hover:text-gray-700 text-xs h-8"
                      >
                        Not Now
                      </Button>
                       <Button 
                        onClick={handleDismissPermanently} 
                        variant="ghost" 
                        size="sm"
                        className="text-gray-400 hover:text-gray-600 text-xs h-8"
                      >
                        Don't Ask Again
                      </Button>
                    </div>
                  </div>
                 </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}