import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SuccessCompletionScreen({ pharmacyCount, onComplete }) {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (onComplete) onComplete();
          navigate(createPageUrl("EmployerDashboard"), { replace: true });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate, onComplete]);

  const handleGoNow = () => {
    if (onComplete) onComplete();
    navigate(createPageUrl("EmployerDashboard"), { replace: true });
  };

  return (
    <div className="text-center py-4">
      {/* Success Icon */}
      <div className="w-16 h-16 mx-auto mb-4 bg-green-500 rounded-full flex items-center justify-center">
        <Check className="w-8 h-8 text-white stroke-[3]" />
      </div>

      {/* Success Message */}
      <h2 className="text-xl font-bold text-gray-900 mb-1">
        Setup Complete
      </h2>
      <p className="text-sm text-gray-500 mb-6">
        Your account is ready
      </p>

      {/* Stats Row */}
      <div className="flex justify-center gap-6 mb-6 py-4 border-y border-gray-100">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">{pharmacyCount}</p>
          <p className="text-xs text-gray-500">
            {pharmacyCount === 1 ? 'Pharmacy' : 'Pharmacies'}
          </p>
        </div>
        <div className="w-px bg-gray-200" />
        <div className="text-center">
          <p className="text-2xl font-bold text-green-600">✓</p>
          <p className="text-xs text-gray-500">Verified</p>
        </div>
      </div>

      {/* Next Steps */}
      <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
        <p className="text-xs font-semibold text-gray-900 mb-3 uppercase tracking-wide">Next Steps</p>
        <div className="space-y-2.5">
          {[
            "Post your first shift",
            "Browse pharmacists",
            "Review applications"
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2.5">
              <div className="w-5 h-5 rounded-full bg-gray-900 flex items-center justify-center flex-shrink-0">
                <Check className="w-3 h-3 text-white" />
              </div>
              <span className="text-sm text-gray-700">{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Button */}
      <Button
        onClick={handleGoNow}
        className="w-full h-12 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-xl"
      >
        Go to Dashboard
        <ArrowRight className="w-4 h-4 ml-2" />
      </Button>

      {/* Auto-redirect */}
      <p className="text-xs text-gray-400 mt-3">
        Redirecting in {countdown}s
      </p>
    </div>
  );
}