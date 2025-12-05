import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Lightbulb, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Onboarding Tooltip Component
 * Shows contextual tips to guide users through first-time experiences
 */
export default function OnboardingTooltip({ 
  id,
  title, 
  message, 
  position = "bottom",
  show = true,
  onDismiss,
  actions = []
}) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has seen this tooltip
    const seen = localStorage.getItem(`tooltip_seen_${id}`);
    if (!seen && show) {
      // Show after small delay for better UX
      setTimeout(() => setIsVisible(true), 500);
    }
  }, [id, show]);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem(`tooltip_seen_${id}`, 'true');
    onDismiss?.();
  };

  const positionClasses = {
    top: "-top-2 -translate-y-full",
    bottom: "top-full mt-2",
    left: "-left-2 -translate-x-full",
    right: "left-full ml-2"
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: position === 'bottom' ? -10 : 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.2 }}
          className={`absolute ${positionClasses[position]} z-50 w-80 max-w-[calc(100vw-32px)]`}
        >
          <div className="bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl shadow-2xl p-4 border-2 border-teal-300">
            {/* Close button */}
            <button
              onClick={handleDismiss}
              className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4 text-white" />
            </button>

            {/* Icon */}
            <div className="flex items-start gap-3 mb-3">
              <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Lightbulb className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 pr-6">
                <h4 className="text-white font-bold text-sm mb-1">{title}</h4>
                <p className="text-white/90 text-xs leading-relaxed">{message}</p>
              </div>
            </div>

            {/* Actions */}
            {actions.length > 0 && (
              <div className="flex gap-2 mt-3">
                {actions.map((action, idx) => (
                  <Button
                    key={idx}
                    size="sm"
                    onClick={() => {
                      action.onClick();
                      handleDismiss();
                    }}
                    className="bg-white text-teal-700 hover:bg-teal-50 h-8 text-xs font-semibold"
                  >
                    {action.label}
                    <ChevronRight className="w-3 h-3 ml-1" />
                  </Button>
                ))}
              </div>
            )}

            {/* Pointer arrow */}
            <div className={`absolute ${
              position === 'bottom' ? 'bottom-full left-6' : 
              position === 'top' ? 'top-full left-6' : ''
            }`}>
              <div className={`w-0 h-0 border-l-8 border-r-8 border-transparent ${
                position === 'bottom' ? 'border-b-8 border-b-teal-300' :
                position === 'top' ? 'border-t-8 border-t-teal-300' : ''
              }`}></div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}