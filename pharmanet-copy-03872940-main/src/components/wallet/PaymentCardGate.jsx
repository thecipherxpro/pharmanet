import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard, AlertTriangle, Shield, DollarSign } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import AddCardForm from "./AddCardForm";

export default function PaymentCardGate({ 
  userType, 
  actionType,
  onHasCard 
}) {
  const navigate = useNavigate();
  const [showAddCard, setShowAddCard] = useState(false);

  const { data: cards = [], isLoading, refetch } = useQuery({
    queryKey: ['walletCards'],
    queryFn: () => base44.entities.WalletCard.list(),
  });

  const hasValidCard = cards.length > 0;

  React.useEffect(() => {
    if (hasValidCard && onHasCard) {
      onHasCard(true);
    }
  }, [hasValidCard, onHasCard]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-gray-600">Checking payment status...</p>
        </div>
      </div>
    );
  }

  if (hasValidCard) {
    return null;
  }

  const getMessage = () => {
    if (userType === 'employer' && actionType === 'accept') {
      return {
        title: "Payment Card Required",
        description: "To accept applications and book pharmacists, you need to add a valid payment card. You'll be charged $50.00 when you accept your first application.",
        icon: CreditCard,
        charge: "$50.00 acceptance fee per booking"
      };
    }
    if (userType === 'pharmacist' && actionType === 'apply') {
      return {
        title: "Payment Card Required",
        description: "To apply for shifts, you need to add a payment card. This is required for cancellation penalty protection. No charges will be made unless you cancel a confirmed shift with less than 48 hours notice.",
        icon: Shield,
        charge: "Only charged if late cancellation occurs"
      };
    }
    return {
      title: "Payment Card Required",
      description: "Please add a valid payment card to continue.",
      icon: CreditCard,
      charge: ""
    };
  };

  const message = getMessage();
  const MessageIcon = message.icon;

  if (showAddCard) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-2xl mx-auto pt-6">
          <button
            onClick={() => setShowAddCard(false)}
            className="text-sm text-gray-600 hover:text-gray-900 mb-4 flex items-center gap-2"
          >
            ← Back
          </button>
          <Card>
            <CardHeader>
              <CardTitle>Add Payment Card</CardTitle>
            </CardHeader>
            <CardContent>
              <AddCardForm
                onSuccess={() => {
                  refetch();
                  setShowAddCard(false);
                }}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-lg w-full shadow-xl">
        <CardContent className="p-8 text-center">
          <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <MessageIcon className="w-10 h-10 text-orange-600" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-3">{message.title}</h2>
          <p className="text-sm text-gray-600 mb-6 leading-relaxed">
            {message.description}
          </p>

          {message.charge && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-center gap-2 text-blue-900">
                <DollarSign className="w-5 h-5" />
                <span className="font-semibold">{message.charge}</span>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <Button
              onClick={() => setShowAddCard(true)}
              className="w-full h-12 bg-blue-600 hover:bg-blue-700"
            >
              <CreditCard className="w-5 h-5 mr-2" />
              Add Payment Card
            </Button>
            
            <Button
              onClick={() => navigate(-1)}
              variant="outline"
              className="w-full h-12"
            >
              Go Back
            </Button>
          </div>

          <div className="mt-6 flex items-start gap-2 text-xs text-gray-500">
            <Shield className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <p className="text-left">
              Your payment information is securely processed by Stripe. We never store your full card details.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}