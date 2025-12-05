import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle, AlertCircle, AlertTriangle, CreditCard } from "lucide-react";

const BANNER_TYPES = {
  success: {
    bg: "bg-green-500",
    icon: CheckCircle,
    textColor: "text-white"
  },
  error: {
    bg: "bg-red-500",
    icon: AlertCircle,
    textColor: "text-white"
  },
  warning: {
    bg: "bg-amber-500",
    icon: AlertTriangle,
    textColor: "text-white"
  },
  info: {
    bg: "bg-blue-500",
    icon: CreditCard,
    textColor: "text-white"
  }
};

export default function WalletBanner({ message, type = "info", onClose, autoClose = true, duration = 4000 }) {
  const [visible, setVisible] = useState(true);
  const config = BANNER_TYPES[type] || BANNER_TYPES.info;
  const Icon = config.icon;

  useEffect(() => {
    if (autoClose && duration > 0) {
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(() => onClose?.(), 300);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [autoClose, duration, onClose]);

  const handleClose = () => {
    setVisible(false);
    setTimeout(() => onClose?.(), 300);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 500 }}
          className={`fixed top-0 left-0 right-0 z-[99999] ${config.bg} shadow-lg`}
        >
          <div className="px-4 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1">
              <Icon className={`w-5 h-5 ${config.textColor} flex-shrink-0`} />
              <p className={`text-sm font-medium ${config.textColor}`}>
                {message}
              </p>
            </div>
            <button
              onClick={handleClose}
              className={`p-1 rounded-full hover:bg-white/20 transition-colors ${config.textColor}`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Hook to manage wallet banners
export function useWalletBanner() {
  const [banner, setBanner] = useState(null);

  const showBanner = (message, type = "info", duration = 4000) => {
    setBanner({ message, type, duration, key: Date.now() });
  };

  const showSuccess = (message, duration = 4000) => showBanner(message, "success", duration);
  const showError = (message, duration = 5000) => showBanner(message, "error", duration);
  const showWarning = (message, duration = 4000) => showBanner(message, "warning", duration);
  const showInfo = (message, duration = 4000) => showBanner(message, "info", duration);

  const closeBanner = () => setBanner(null);

  const BannerComponent = banner ? (
    <WalletBanner
      key={banner.key}
      message={banner.message}
      type={banner.type}
      duration={banner.duration}
      onClose={closeBanner}
    />
  ) : null;

  return {
    banner: BannerComponent,
    showBanner,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    closeBanner
  };
}