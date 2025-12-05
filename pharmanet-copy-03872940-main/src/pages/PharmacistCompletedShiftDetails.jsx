import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Calendar,
  Clock,
  DollarSign,
  MapPin,
  Building2,
  CheckCircle,
  Download,
  Printer,
  Receipt,
  User,
  Mail,
  Phone
} from "lucide-react";
import { format } from "date-fns";
import { formatTime12Hour } from "../components/utils/timeUtils";
import { PharmacistOnly } from "../components/auth/RouteProtection";

function PharmacistCompletedShiftDetailsContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  
  const searchParams = new URLSearchParams(location.search);
  const shiftId = searchParams.get('id');

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const userData = await base44.auth.me();
    setUser(userData);
  };

  const { data: shift, isLoading: shiftLoading } = useQuery({
    queryKey: ['completedShift', shiftId],
    queryFn: async () => {
      const shifts = await base44.entities.Shift.filter({ id: shiftId });
      return shifts[0];
    },
    enabled: !!shiftId
  });

  const { data: application } = useQuery({
    queryKey: ['myApplication', shiftId, user?.email],
    queryFn: () => base44.entities.ShiftApplication.filter({
      shift_id: shiftId,
      pharmacist_email: user?.email,
      status: 'accepted'
    }),
    enabled: !!shiftId && !!user,
    initialData: []
  });

  const { data: pharmacy } = useQuery({
    queryKey: ['pharmacy', shift?.pharmacy_id],
    queryFn: async () => {
      if (!shift?.pharmacy_id) return null;
      const pharmacies = await base44.entities.Pharmacy.filter({ id: shift.pharmacy_id });
      return pharmacies[0];
    },
    enabled: !!shift?.pharmacy_id
  });

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Create a printable version
    const printWindow = window.open('', '', 'height=800,width=600');
    const receiptContent = document.getElementById('receipt-content');
    
    printWindow.document.write('<html><head><title>Shift Receipt</title>');
    printWindow.document.write('<style>');
    printWindow.document.write('body { font-family: Arial, sans-serif; padding: 20px; }');
    printWindow.document.write('h1 { text-align: center; color: #0d9488; }');
    printWindow.document.write('.section { margin-bottom: 20px; }');
    printWindow.document.write('.label { font-weight: bold; }');
    printWindow.document.write('</style>');
    printWindow.document.write('</head><body>');
    printWindow.document.write(receiptContent.innerHTML);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.print();
  };

  if (shiftLoading || !user) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="h-64 bg-white rounded-2xl animate-pulse" />
          <div className="h-96 bg-white rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (!shift || !application || application.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card>
          <CardContent className="p-8 text-center">
            <Receipt className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Receipt Not Found</h2>
            <p className="text-gray-600 mb-4">Unable to find this shift receipt.</p>
            <Button onClick={() => navigate(createPageUrl("MySchedule"))}>
              Back to Schedule
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const completedDate = shift.updated_date ? new Date(shift.updated_date) : new Date();

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header - No Print */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm print:hidden">
        <div className="max-w-2xl mx-auto px-3 sm:px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="w-9 h-9 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-gray-700" />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-base sm:text-lg font-semibold text-gray-900">Shift Receipt</h1>
              <p className="text-xs text-gray-600">Completed shift details</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {/* Action Buttons - No Print */}
        <div className="flex gap-2 mb-4 print:hidden">
          <Button
            onClick={handlePrint}
            variant="outline"
            className="flex-1 gap-2 h-10"
          >
            <Printer className="w-4 h-4" />
            Print
          </Button>
          <Button
            onClick={handleDownload}
            variant="outline"
            className="flex-1 gap-2 h-10"
          >
            <Download className="w-4 h-4" />
            Download
          </Button>
        </div>

        {/* Receipt Card */}
        <Card className="border-2 border-gray-300 shadow-xl overflow-hidden">
          <CardContent className="p-0" id="receipt-content">
            {/* Receipt Header */}
            <div className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white p-6 text-center border-b-4 border-teal-700">
              <Receipt className="w-16 h-16 mx-auto mb-3 opacity-90" />
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">SHIFT RECEIPT</h1>
              <p className="text-sm text-teal-100">Pharmanet Professional Services</p>
              <div className="mt-4 pt-4 border-t border-teal-500">
                <Badge className="bg-white text-teal-700 text-sm px-4 py-1">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  COMPLETED
                </Badge>
              </div>
            </div>

            {/* Receipt Info Bar */}
            <div className="bg-gray-100 px-6 py-4 border-b border-gray-300">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600 text-xs mb-1">Receipt Date</p>
                  <p className="font-bold text-gray-900">
                    {format(completedDate, "MMM d, yyyy 'at' h:mm a")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-gray-600 text-xs mb-1">Receipt #</p>
                  <p className="font-bold text-gray-900">
                    #{shiftId.slice(-8).toUpperCase()}
                  </p>
                </div>
              </div>
            </div>

            {/* Pharmacist Info */}
            <div className="p-6 border-b border-gray-200 bg-white">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4">
                Pharmacist Information
              </h3>
              <div className="bg-teal-50 rounded-lg p-4 border-2 border-teal-200">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-teal-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-900 text-lg mb-2">{user.full_name}</p>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-2 text-gray-700">
                        <Mail className="w-4 h-4 text-teal-600" />
                        <span>{user.email}</span>
                      </div>
                      {user.license_number && (
                        <div className="flex items-center gap-2 text-gray-700">
                          <CheckCircle className="w-4 h-4 text-teal-600" />
                          <span>License #{user.license_number}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Shift Details */}
            <div className="p-6 border-b border-gray-200 bg-white">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4">
                Shift Details
              </h3>
              
              <div className="space-y-4">
                {/* Pharmacy */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-start gap-3">
                    <Building2 className="w-5 h-5 text-gray-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 mb-1">Pharmacy</p>
                      <p className="font-bold text-gray-900 text-lg">{shift.pharmacy_name}</p>
                      <div className="flex items-start gap-2 mt-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <div>
                          {pharmacy?.address && <p>{pharmacy.address}</p>}
                          <p>{shift.pharmacy_city}, {shift.pharmacy_province}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Date & Time */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-5 h-5 text-blue-600" />
                      <p className="text-xs text-gray-600 font-medium">Date</p>
                    </div>
                    <p className="font-bold text-gray-900">
                      {format(new Date(shift.shift_date), "EEE, MMM d, yyyy")}
                    </p>
                  </div>

                  <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-5 h-5 text-purple-600" />
                      <p className="text-xs text-gray-600 font-medium">Time</p>
                    </div>
                    <p className="font-bold text-gray-900 text-sm">
                      {formatTime12Hour(shift.start_time)} - {formatTime12Hour(shift.end_time)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Breakdown */}
            <div className="p-6 bg-gradient-to-br from-gray-50 to-white">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4">
                Payment Summary
              </h3>

              <div className="space-y-3">
                <div className="flex items-center justify-between py-3 border-b border-gray-300">
                  <div>
                    <p className="text-gray-600 text-sm">Hourly Rate</p>
                    <p className="text-xs text-gray-500">{shift.total_hours} hours worked</p>
                  </div>
                  <p className="text-xl font-bold text-gray-900">${shift.hourly_rate}/hr</p>
                </div>

                <div className="flex items-center justify-between py-3 border-b border-gray-300">
                  <p className="text-gray-600">Total Hours</p>
                  <p className="text-lg font-semibold text-gray-900">{shift.total_hours}h</p>
                </div>

                {/* Total Amount - Highlighted */}
                <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl p-5 mt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-emerald-100 text-sm mb-1">Total Earned</p>
                      <p className="text-xs text-emerald-200">Before deductions</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-baseline gap-2">
                        <DollarSign className="w-6 h-6 text-white" />
                        <p className="text-4xl font-bold text-white">
                          {shift.total_pay.toFixed(2)}
                        </p>
                      </div>
                      <p className="text-xs text-emerald-200 mt-1">CAD</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Notes */}
            <div className="p-6 bg-gray-100 border-t-2 border-gray-300">
              <div className="space-y-3 text-xs text-gray-600">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" />
                  <p>
                    This receipt confirms the completion of your shift at {shift.pharmacy_name} on{' '}
                    {format(new Date(shift.shift_date), "MMMM d, yyyy")}.
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <DollarSign className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" />
                  <p>
                    Payment will be processed according to your payroll preferences. 
                    Please allow 3-5 business days for funds to be deposited.
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <Receipt className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" />
                  <p>
                    For questions about this receipt or payment, please contact support@pharmanet.ca
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-300 text-center">
                <p className="text-xs text-gray-500 italic">
                  This is a computer-generated receipt. No signature required.
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  Generated on {format(new Date(), "MMM d, yyyy 'at' h:mm a")}
                </p>
              </div>
            </div>

            {/* Barcode/ID Footer */}
            <div className="bg-gray-900 text-white py-3 px-6 text-center">
              <div className="font-mono text-xs opacity-75">
                RECEIPT-{shiftId.toUpperCase()}
              </div>
              <div className="mt-2 text-[10px] text-gray-400">
                Pharmanet Professional Services Inc. • Toronto, ON
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bottom Action - No Print */}
        <div className="mt-6 text-center print:hidden">
          <Button
            onClick={() => navigate(createPageUrl("MySchedule"))}
            variant="outline"
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Schedule
          </Button>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body {
            background: white;
          }
          
          .print\\:hidden {
            display: none !important;
          }
          
          #receipt-content {
            box-shadow: none !important;
          }
        }
      `}</style>
    </div>
  );
}

export default function PharmacistCompletedShiftDetails() {
  return (
    <PharmacistOnly>
      <PharmacistCompletedShiftDetailsContent />
    </PharmacistOnly>
  );
}