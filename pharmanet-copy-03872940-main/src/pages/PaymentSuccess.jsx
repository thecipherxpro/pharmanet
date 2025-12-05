import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import { createPageUrl } from "@/utils";

export default function PaymentSuccess() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful</h1>
        <p className="text-gray-600 mb-8">
          Thank you for your payment. Your transaction has been completed successfully.
        </p>
        <Button 
          onClick={() => navigate(createPageUrl("Dashboard"))}
          className="w-full bg-teal-600 hover:bg-teal-700"
        >
          Return to Dashboard
        </Button>
      </div>
    </div>
  );
}