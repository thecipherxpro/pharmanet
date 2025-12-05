import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Building2,
  Mail,
  Banknote,
  Lock,
  CheckCircle,
  XCircle,
  Info,
  DollarSign,
  Eye,
  EyeOff
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function PayrollPreview({ pharmacistId, shiftId, isAccepted }) {
  const [loading, setLoading] = useState(true);
  const [payrollData, setPayrollData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (pharmacistId && shiftId) {
      loadPayrollData();
    }
  }, [pharmacistId, shiftId, isAccepted]);

  const loadPayrollData = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await base44.functions.invoke('payrollGetPharmacistPreference', {
        pharmacistId,
        shiftId
      });
      setPayrollData(data);
    } catch (err) {
      setError(err.message);
      console.error('Error loading payroll data:', err);
    }
    setLoading(false);
  };

  const getMethodIcon = (method) => {
    switch(method) {
      case "Direct Deposit":
        return Building2;
      case "Bank E-Transfer":
        return Mail;
      case "Cheque":
        return Banknote;
      default:
        return DollarSign;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Skeleton className="w-12 h-12 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-900">Unable to Load Payroll Info</p>
              <p className="text-xs text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!payrollData) {
    return null;
  }

  const Icon = getMethodIcon(payrollData.method);
  const isPublic = payrollData.is_public;

  return (
    <Card className={isAccepted ? "border-green-200 bg-green-50" : "border-blue-200 bg-blue-50"}>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <DollarSign className="w-5 h-5 text-gray-700" />
          <h4 className="font-semibold text-gray-900">Payroll Information</h4>
        </div>

        {/* Payment Method - Always Visible */}
        <div className="bg-white rounded-lg p-3 mb-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              isAccepted ? 'bg-green-100' : 'bg-blue-100'
            }`}>
              <Icon className={`w-5 h-5 ${isAccepted ? 'text-green-600' : 'text-blue-600'}`} />
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-500 font-medium mb-0.5">Payment Method</p>
              <p className="font-semibold text-gray-900">{payrollData.method}</p>
            </div>
            <Badge variant="outline" className={
              isAccepted ? "bg-green-100 text-green-700 border-green-300" : "bg-blue-100 text-blue-700 border-blue-300"
            }>
              {isPublic ? <Eye className="w-3 h-3 mr-1" /> : <Lock className="w-3 h-3 mr-1" />}
              {isPublic ? 'Public' : 'Private'}
            </Badge>
          </div>
        </div>

        {/* Detailed Information - Only After Acceptance */}
        {!isPublic && isAccepted ? (
          <div className="space-y-3">
            {/* Legal Name */}
            <div className="bg-white rounded-lg p-3 shadow-sm">
              <p className="text-xs text-gray-500 font-medium mb-1">Legal Name</p>
              <p className="font-semibold text-gray-900">
                {payrollData.legal_first_name} {payrollData.legal_last_name}
              </p>
            </div>

            {/* Direct Deposit Details */}
            {payrollData.method === "Direct Deposit" && (
              <>
                {payrollData.bank_name && (
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <p className="text-xs text-gray-500 font-medium mb-1">Bank Name</p>
                    <p className="font-semibold text-gray-900">{payrollData.bank_name}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <p className="text-xs text-gray-500 font-medium mb-1">Institution #</p>
                    <p className="font-mono text-gray-900">{payrollData.institution_number || 'N/A'}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <p className="text-xs text-gray-500 font-medium mb-1">Transit #</p>
                    <p className="font-mono text-gray-900">{payrollData.transit_number || 'N/A'}</p>
                  </div>
                </div>
                {payrollData.account_number && (
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <p className="text-xs text-gray-500 font-medium mb-1">Account Number</p>
                    <p className="font-mono text-gray-900">{payrollData.account_number}</p>
                  </div>
                )}
              </>
            )}

            {/* E-Transfer Details */}
            {payrollData.method === "Bank E-Transfer" && (
              <>
                {payrollData.etransfer_email && (
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <p className="text-xs text-gray-500 font-medium mb-1">E-Transfer Email</p>
                    <p className="font-semibold text-gray-900 break-all">{payrollData.etransfer_email}</p>
                  </div>
                )}
                {payrollData.bank_name && (
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <p className="text-xs text-gray-500 font-medium mb-1">Bank Name</p>
                    <p className="font-semibold text-gray-900">{payrollData.bank_name}</p>
                  </div>
                )}
                <div className="bg-white rounded-lg p-3 shadow-sm">
                  <p className="text-xs text-gray-500 font-medium mb-2">Auto-Deposit</p>
                  <Badge className={payrollData.auto_deposit_enabled ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}>
                    {payrollData.auto_deposit_enabled ? (
                      <><CheckCircle className="w-3 h-3 mr-1" /> Enabled</>
                    ) : (
                      <><XCircle className="w-3 h-3 mr-1" /> Disabled</>
                    )}
                  </Badge>
                  {!payrollData.auto_deposit_enabled && payrollData.has_security_qa && (
                    <p className="text-xs text-gray-600 mt-2">Security Q&A configured</p>
                  )}
                </div>
              </>
            )}

            {/* Cheque Details */}
            {payrollData.method === "Cheque" && payrollData.bank_name && (
              <div className="bg-white rounded-lg p-3 shadow-sm">
                <p className="text-xs text-gray-500 font-medium mb-1">Bank Name</p>
                <p className="font-semibold text-gray-900">{payrollData.bank_name}</p>
              </div>
            )}

            {/* Security Notice */}
            <div className="flex items-start gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
              <Lock className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-green-900">
                Payroll details are encrypted and only visible after shift acceptance.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
            <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-amber-900 mb-1">
                {isPublic ? 'Limited Information' : 'Detailed Information Available'}
              </p>
              <p className="text-xs text-amber-800">
                {isPublic 
                  ? 'Full payroll details will be revealed once you accept this application.' 
                  : 'Accept the application to view complete payroll details.'}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}