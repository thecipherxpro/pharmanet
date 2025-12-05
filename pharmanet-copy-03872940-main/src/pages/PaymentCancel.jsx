import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { XCircle } from "lucide-react";
import { createPageUrl } from "@/utils";

export default function PaymentCancel() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <XCircle className="w-8 h-8 text-red-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Cancelled</h1>
        <p className="text-gray-600 mb-8">
          Your payment was cancelled. No charges were made.
        </p>
        <div className="flex gap-3">
           <Button 
            variant="outline"
            onClick={() => navigate(-1)}
            className="flex-1"
          >
            Try Again
          </Button>
          <Button 
            onClick={() => navigate(createPageUrl("Dashboard"))}
            className="flex-1 bg-gray-900 hover:bg-gray-800"
          >
            Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}