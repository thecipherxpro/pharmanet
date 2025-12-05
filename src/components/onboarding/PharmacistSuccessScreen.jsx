import React from "react";
import { CheckCircle2, Calendar, TrendingUp, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function PharmacistSuccessScreen({ onComplete }) {
  // No auto-redirect - let user click when ready

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center py-8"
    >
      {/* Success Icon */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
        className="w-24 h-24 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
      >
        <CheckCircle2 className="w-12 h-12 text-white" />
      </motion.div>

      {/* Success Message */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h2 className="text-3xl font-bold text-gray-900 mb-3">
          You're All Set! 🎉
        </h2>
        <p className="text-gray-600 text-lg mb-8">
          Your profile is complete and ready to go
        </p>
      </motion.div>

      {/* Summary Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="grid grid-cols-2 gap-4 mb-8"
      >
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
          <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center mx-auto mb-2">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <p className="text-sm font-semibold text-gray-900">Ready to Browse</p>
          <p className="text-xs text-gray-600 mt-1">Start finding shifts</p>
        </div>

        <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl p-4 border border-teal-200">
          <div className="w-10 h-10 bg-teal-500 rounded-lg flex items-center justify-center mx-auto mb-2">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <p className="text-sm font-semibold text-gray-900">Profile Active</p>
          <p className="text-xs text-gray-600 mt-1">Visible to employers</p>
        </div>
      </motion.div>

      {/* Next Steps */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="bg-gray-50 rounded-xl p-6 mb-6 text-left"
      >
        <h3 className="font-bold text-gray-900 mb-3 text-center">What's Next?</h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-teal-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white text-xs font-bold">1</span>
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">Browse Available Shifts</p>
              <p className="text-xs text-gray-600 mt-0.5">Find opportunities that match your preferences</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-teal-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white text-xs font-bold">2</span>
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">Apply to Shifts</p>
              <p className="text-xs text-gray-600 mt-0.5">Submit applications and connect with employers</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-teal-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white text-xs font-bold">3</span>
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">Start Working</p>
              <p className="text-xs text-gray-600 mt-0.5">Get hired and build your reputation</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Action Button - No auto-redirect */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
      >
        <Button
          onClick={onComplete}
          className="w-full h-12 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white font-semibold shadow-lg"
        >
          <span>Go to Dashboard</span>
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </motion.div>
    </motion.div>
  );
}