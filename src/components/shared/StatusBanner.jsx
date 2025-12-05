import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { X, Info, AlertTriangle, AlertCircle, CheckCircle, Megaphone } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const ICON_MAP = {
  info: Info,
  warning: AlertTriangle,
  alert: AlertCircle,
  success: CheckCircle,
  announcement: Megaphone
};

const COLOR_MAP = {
  info: 'bg-green-600',
  warning: 'bg-red-600',
  alert: 'bg-red-600',
  success: 'bg-green-600',
  announcement: 'bg-red-600'
};

const TEXT_COLOR_MAP = {
  info: 'text-white',
  warning: 'text-white',
  alert: 'text-white',
  success: 'text-white',
  announcement: 'text-white'
};

const SWIPE_TEXT_COLOR_MAP = {
  info: 'text-white',
  warning: 'text-white',
  alert: 'text-white',
  success: 'text-white',
  announcement: 'text-white'
};

export default function StatusBanner() {
  const [notification, setNotification] = useState(null);
  const [dismissed, setDismissed] = useState(false);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  useEffect(() => {
    loadNotification();
  }, []);

  useEffect(() => {
    if (notification && !dismissed) {
      const timer = setTimeout(() => {
        handleClose();
      }, 40000); // Auto close after 40 seconds

      return () => clearTimeout(timer);
    }
  }, [notification, dismissed]);

  const loadNotification = async () => {
    try {
      const response = await base44.functions.invoke('getActiveNotification');
      if (response.data?.notification) {
        setNotification(response.data.notification);
        setDismissed(false);
      }
    } catch (error) {
      console.error('Error loading notification:', error);
    }
  };

  const handleClose = () => {
    setDismissed(true);
  };

  const handleTouchStart = (e) => {
    setTouchStart(e.touches[0].clientY);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.touches[0].clientY);
  };

  const handleTouchEnd = () => {
    if (touchStart - touchEnd > 30) {
      // Swiped up
      handleClose();
    }
    setTouchStart(0);
    setTouchEnd(0);
  };

  if (!notification || dismissed) return null;

  const IconComponent = ICON_MAP[notification.icon_type] || Info;
  const bgColor = COLOR_MAP[notification.icon_type] || 'bg-gray-900';
  const textColor = TEXT_COLOR_MAP[notification.icon_type] || 'text-white';
  const swipeTextColor = SWIPE_TEXT_COLOR_MAP[notification.icon_type] || 'text-white';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={`fixed top-0 left-0 right-0 z-50 ${bgColor} ${textColor} shadow-lg`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="px-4 py-4 sm:py-5">
          <div className="flex items-start gap-3 sm:gap-4 max-w-6xl mx-auto">
            <div className="w-10 h-10 sm:w-11 sm:h-11 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <IconComponent className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-extrabold text-white text-sm sm:text-base mb-1 leading-tight">
                {notification.title}
              </h4>
              <p className="text-white font-medium text-xs sm:text-sm leading-relaxed">
                {notification.message}
              </p>
              {notification.action_button_text && notification.action_button_url && (
                <a
                  href={notification.action_button_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-3 px-4 py-2 bg-white text-gray-900 rounded-lg text-xs sm:text-sm font-semibold hover:bg-gray-100 transition-colors"
                >
                  {notification.action_button_text}
                </a>
              )}
            </div>
            <button
              onClick={handleClose}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg hover:bg-white/10 flex items-center justify-center transition-colors flex-shrink-0"
              aria-label="Close notification"
            >
              <X className="w-5 h-5 sm:w-5 sm:h-5 text-white" />
            </button>
          </div>
        </div>
        <div className="text-center pb-2">
          <p className={`${swipeTextColor} text-[10px] sm:text-xs uppercase tracking-wider font-medium opacity-80`}>
            Swipe Up to close
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}