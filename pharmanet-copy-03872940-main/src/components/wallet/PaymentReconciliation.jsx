import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, AlertCircle, DollarSign, Calendar, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

export default function PaymentReconciliation({ payment, shift, onDownloadInvoice }) {
  if (!payment) return null;

  const getStatusInfo = () => {
    switch (payment.status) {
      case 'charged':
        return {
          icon: CheckCircle,
          color: 'bg-green-100 text-green-700 border-green-200',
          label: 'Paid',
          description: 'Payment processed successfully'
        };
      case 'pending':
        return {
          icon: Clock,
          color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
          label: 'Pending',
          description: 'Payment being processed'
        };
      case 'failed':
        return {
          icon: AlertCircle,
          color: 'bg-red-100 text-red-700 border-red-200',
          label: 'Failed',
          description: 'Payment failed - please retry'
        };
      case 'refunded':
        return {
          icon: AlertCircle,
          color: 'bg-gray-100 text-gray-700 border-gray-200',
          label: 'Refunded',
          description: 'Payment has been refunded'
        };
      default:
        return {
          icon: Clock,
          color: 'bg-gray-100 text-gray-700 border-gray-200',
          label: payment.status,
          description: 'Payment status'
        };
    }
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  return (
    <Card className="border-gray-200 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-teal-600" />
          Payment Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Status Badge */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Status</span>
          <Badge className={`${statusInfo.color} border font-semibold`}>
            <StatusIcon className="w-3 h-3 mr-1" />
            {statusInfo.label}
          </Badge>
        </div>

        {/* Amount Breakdown */}
        <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-lg p-3 border-2 border-teal-200">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-700">Amount</span>
              <span className="text-2xl font-bold text-teal-700">
                ${payment.amount.toFixed(2)}
              </span>
            </div>
            {shift && (
              <div className="pt-2 border-t border-teal-200 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-600">Hours Worked:</span>
                  <span className="font-semibold text-gray-900">{shift.total_hours}h</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Hourly Rate:</span>
                  <span className="font-semibold text-gray-900">${shift.hourly_rate}/hr</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Payment Info */}
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-600">Type:</span>
            <span className="font-semibold text-gray-900">
              {payment.type === 'acceptance_fee' ? 'Acceptance Fee' : payment.type}
            </span>
          </div>
          {payment.stripe_payment_id && (
            <div className="flex justify-between">
              <span className="text-gray-600">Transaction ID:</span>
              <span className="font-mono text-gray-900 text-[10px]">
                {payment.stripe_payment_id.slice(-8)}
              </span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-600">Date:</span>
            <span className="font-semibold text-gray-900">
              {format(new Date(payment.created_date), "MMM d, yyyy 'at' h:mm a")}
            </span>
          </div>
        </div>

        {/* Description */}
        {payment.description && (
          <div className="bg-gray-50 rounded-lg p-2 border border-gray-200">
            <p className="text-xs text-gray-700">{payment.description}</p>
          </div>
        )}

        {/* Download Invoice Button */}
        {onDownloadInvoice && payment.status === 'charged' && (
          <Button
            onClick={onDownloadInvoice}
            variant="outline"
            className="w-full h-10"
          >
            <Download className="w-4 h-4 mr-2" />
            Download Invoice
          </Button>
        )}

        {/* Status Description */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
          <p className="text-xs text-blue-800">
            {statusInfo.description}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}