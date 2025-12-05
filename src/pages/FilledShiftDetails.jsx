import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Calendar,
  Clock,
  DollarSign,
  MapPin,
  Building2,
  User,
  Mail,
  Phone,
  Award,
  Briefcase,
  CheckCircle,
  ExternalLink,
  Shield,
  Monitor,
  Star,
  Banknote,
  Lock,
  Eye,
  EyeOff,
  Info,
  Download,
  Send,
  FileText,
  Calculator,
  Receipt,
  XCircle
} from "lucide-react";
import { format } from "date-fns";
import { formatTime12Hour } from "../components/utils/timeUtils";
import { EmployerOnly } from "../components/auth/RouteProtection";
import ProfileAvatar from "../components/shared/ProfileAvatar";
import { useToast } from "@/components/ui/use-toast";
import EmployerCancelShiftModal from "../components/shift/EmployerCancelShiftModal";

function FilledShiftDetailsContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("shift");
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showPaymentDetails, setShowPaymentDetails] = useState({
    account_number: false,
    institution_number: false,
    transit_number: false,
    etransfer_email: false,
    bank_name: false
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
    queryKey: ['shift', shiftId],
    queryFn: async () => {
      const shifts = await base44.entities.Shift.filter({ id: shiftId, created_by: user?.email });
      return shifts[0];
    },
    enabled: !!shiftId && !!user
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

  const { data: acceptedApplication } = useQuery({
    queryKey: ['acceptedApp', shiftId],
    queryFn: async () => {
      const apps = await base44.entities.ShiftApplication.filter({ 
        shift_id: shiftId, 
        status: 'accepted' 
      });
      return apps[0];
    },
    enabled: !!shiftId
  });

  const { data: pharmacist } = useQuery({
    queryKey: ['pharmacist', acceptedApplication?.pharmacist_email],
    queryFn: async () => {
      const { data } = await base44.functions.invoke('getPharmacistPublicProfile', {
        pharmacistEmail: acceptedApplication.pharmacist_email
      });
      return data;
    },
    enabled: !!acceptedApplication
  });

  const { data: payrollData, isLoading: payrollLoading } = useQuery({
    queryKey: ['payroll', pharmacist?.id, shiftId],
    queryFn: async () => {
      const { data } = await base44.functions.invoke('payrollGetPharmacistPreference', {
        pharmacistId: pharmacist.id,
        shiftId: shiftId
      });
      return data;
    },
    enabled: !!pharmacist && !!shiftId
  });

  const { data: invoices = [], refetch: refetchInvoices } = useQuery({
    queryKey: ['invoices', shiftId],
    queryFn: async () => {
      const allInvoices = await base44.entities.PayrollInvoice.filter({ 
        shift_id: shiftId,
        employer_id: user?.id
      }, '-created_date');
      return allInvoices;
    },
    enabled: !!shiftId && !!user
  });

  const cancelShiftMutation = useMutation({
    mutationFn: async ({ shiftId, reason }) => {
      const response = await base44.functions.invoke('handleEmployerShiftCancellation', {
        shiftId: shiftId,
        cancelledAt: new Date().toISOString(),
        reason: reason
      });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['shift'] });
      queryClient.invalidateQueries({ queryKey: ['myShiftsForApps'] });
      queryClient.invalidateQueries({ queryKey: ['employerShifts'] });
      setShowCancelModal(false);
      
      toast({
        title: "✓ Shift Cancelled",
        description: data.message,
      });

      setTimeout(() => {
        navigate(createPageUrl("MyShifts"));
      }, 1500);
    },
    onError: (error) => {
      const errorMsg = error?.response?.data?.error || error.message || 'Failed to cancel shift';
      
      toast({
        variant: "destructive",
        title: "Cancellation Failed",
        description: errorMsg,
      });
    }
  });

  const generateInvoiceNoDeductionsMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('generateInvoicePDF', {
        shiftId: shiftId,
        pharmacistId: pharmacist.id
      });
      return response.data;
    },
    onSuccess: (data) => {
      refetchInvoices();
      
      if (data.pdfUrl) {
        window.open(data.pdfUrl, '_blank');
      }
      
      toast({
        title: "✓ Invoice Generated",
        description: data.message || `Invoice created. Total: $${data.invoice.gross_amount.toFixed(2)}`,
      });
    },
    onError: (error) => {
      const errorMsg = error?.response?.data?.error || error.message || "Failed to generate invoice";
      toast({
        variant: "destructive",
        title: "Generation Failed",
        description: errorMsg,
      });
    }
  });

  const generateInvoiceWithDeductionsMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('generateInvoiceDeductions', {
        shiftId: shiftId,
        pharmacistId: pharmacist.id,
        includeDeductions: true
      });
      return response.data;
    },
    onSuccess: (data) => {
      refetchInvoices();
      
      if (data.pdfUrl) {
        window.open(data.pdfUrl, '_blank');
      }
      
      toast({
        title: "✓ Invoice Generated",
        description: data.message || `Invoice with deductions created. Net: $${data.invoice.net_amount.toFixed(2)}`,
      });
    },
    onError: (error) => {
      const errorMsg = error?.response?.data?.error || error.message || "Failed to generate invoice with deductions";
      toast({
        variant: "destructive",
        title: "Generation Failed",
        description: errorMsg,
      });
    }
  });

  const sendInvoiceMutation = useMutation({
    mutationFn: async (invoiceId) => {
      await base44.functions.invoke('payrollSendInvoiceToPharmacist', {
        invoiceId: invoiceId
      });
    },
    onSuccess: () => {
      refetchInvoices();
      toast({
        title: "✓ Invoice Sent",
        description: "Invoice has been emailed to the pharmacist",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Send Failed",
        description: error.message || "Failed to send invoice",
      });
    }
  });

  const handleSendInvoice = (invoiceId) => {
    if (window.confirm('Send this invoice to the pharmacist via email?')) {
      sendInvoiceMutation.mutate(invoiceId);
    }
  };

  const handleCancelShift = (shiftId, reason) => {
    cancelShiftMutation.mutate({ shiftId, reason });
  };

  const toggleFieldVisibility = (field) => {
    setShowPaymentDetails(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const maskValue = (value, showCount = 4) => {
    if (!value) return '';
    const length = value.length;
    if (length <= showCount) return value;
    return '•'.repeat(length - showCount) + value.slice(-showCount);
  };

  const handleViewProfile = () => {
    if (pharmacist) {
      navigate(createPageUrl("PublicProfile") + `?id=${pharmacist.id}`);
    }
  };

  const getInitials = (name) => {
    if (!name) return "P";
    const parts = name.split(" ");
    return parts.length >= 2
      ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
      : parts[0][0].toUpperCase();
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

  if (shiftLoading || !user) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-5xl mx-auto space-y-4">
          <div className="h-64 bg-white rounded-2xl animate-pulse" />
          <div className="h-96 bg-white rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (!shift || shift.created_by !== user.email) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card>
          <CardContent className="p-8 text-center">
            <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-4">You don't have permission to view this shift.</p>
            <Button onClick={() => navigate(createPageUrl("MyShifts"))}>
              Back to Shifts
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(createPageUrl("MyShifts"))}
              className="w-9 h-9 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-gray-700" />
            </button>
            <div className="flex-1">
              <h1 className="text-base font-semibold text-gray-900">Filled Shift Details</h1>
              <p className="text-xs text-gray-600">{shift.pharmacy_name}</p>
            </div>
            <Badge className="bg-green-100 text-green-700 border-green-300">
              <CheckCircle className="w-3 h-3 mr-1" />
              Filled
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-4 space-y-4">
        
        {/* Cancel Shift Button */}
        <Button
          onClick={() => setShowCancelModal(true)}
          variant="outline"
          className="w-full border-red-300 text-red-700 hover:bg-red-50 h-11"
        >
          <XCircle className="w-4 h-4 mr-2" />
          Cancel This Shift
        </Button>

        {/* Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full bg-white shadow-sm grid grid-cols-3">
            <TabsTrigger value="shift" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
              <Building2 className="w-4 h-4 mr-2" />
              Shift Info
            </TabsTrigger>
            <TabsTrigger value="pharmacist" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
              <User className="w-4 h-4 mr-2" />
              Pharmacist
            </TabsTrigger>
            <TabsTrigger value="payroll" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
              <DollarSign className="w-4 h-4 mr-2" />
              Payroll
            </TabsTrigger>
          </TabsList>

          {/* Shift Info Tab */}
          <TabsContent value="shift" className="space-y-4 mt-4">
            <Card className="border border-gray-200 shadow-sm overflow-hidden">
              <CardContent className="p-0">
                {/* Pharmacy Header */}
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-5 border-b border-blue-200">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                      <Building2 className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-lg font-bold text-gray-900 mb-1">
                        {shift.pharmacy_name}
                      </h2>
                      <div className="flex items-start gap-2 text-gray-700">
                        <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <div className="text-sm">
                          <p className="font-medium">{shift.pharmacy_address}</p>
                          <p>{shift.pharmacy_city}, {shift.pharmacy_province}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {shift.title && (
                    <div className="mt-3 pt-3 border-t border-blue-200">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-gray-900 font-semibold">{shift.title}</h3>
                        <Badge variant="secondary" className="bg-white text-gray-700 border border-gray-300">
                          {shift.shift_type?.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  )}
                </div>

                {/* Payment Info */}
                <div className="bg-white p-5 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500 mb-1 font-medium uppercase tracking-wide">Hourly Rate</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-gray-900">
                          ${shift.hourly_rate}
                        </span>
                        <span className="text-base text-gray-600">/hr</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500 mb-1 font-medium uppercase tracking-wide">Total Pay</p>
                      <p className="text-2xl font-bold text-blue-600">
                        ${shift.total_pay?.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Date & Time */}
                <div className="p-5 bg-gray-50">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                          <Calendar className="w-5 h-5 text-blue-600" />
                        </div>
                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Date</p>
                      </div>
                      <p className="font-bold text-gray-900 text-base mb-1">
                        {format(new Date(shift.shift_date), "EEEE")}
                      </p>
                      <p className="text-sm text-gray-600">
                        {format(new Date(shift.shift_date), "MMMM d, yyyy")}
                      </p>
                    </div>

                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                          <Clock className="w-5 h-5 text-blue-600" />
                        </div>
                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Time</p>
                      </div>
                      <p className="font-bold text-gray-900 text-base mb-1">
                        {formatTime12Hour(shift.start_time)}
                      </p>
                      <p className="font-bold text-gray-900 text-base">
                        {formatTime12Hour(shift.end_time)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-center gap-2 bg-white border border-gray-200 rounded-lg py-3 px-4">
                    <Clock className="w-5 h-5 text-gray-600" />
                    <span className="font-semibold text-gray-900">
                      {shift.total_hours} hours total
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pharmacist Tab */}
          <TabsContent value="pharmacist" className="space-y-4 mt-4">
            <Card className="border border-gray-200 shadow-sm overflow-hidden">
              <CardContent className="p-0">
                <div className="bg-gradient-to-r from-green-50 to-green-100 p-5 border-b border-green-200">
                  <div className="flex items-center gap-4">
                    <ProfileAvatar
                      user={pharmacist}
                      size="lg"
                      editable={false}
                      className="border-2 border-white shadow-md"
                    />
                    <div className="flex-1">
                      <h2 className="text-lg font-bold text-gray-900">
                        {pharmacist?.full_name || "Pharmacist"}
                      </h2>
                      {pharmacist?.license_number && (
                        <p className="text-sm text-gray-700">
                          License: {pharmacist.license_number}
                        </p>
                      )}
                      {pharmacist?.rating > 0 && (
                        <div className="flex items-center mt-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < Math.round(pharmacist.rating)
                                  ? "text-yellow-400 fill-current"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                          <span className="ml-1 text-sm text-gray-700">
                            ({pharmacist?.rating?.toFixed(1)})
                          </span>
                        </div>
                      )}
                    </div>
                    <Button onClick={handleViewProfile} variant="outline" size="sm" className="flex-shrink-0">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View Profile
                    </Button>
                  </div>
                </div>

                <div className="bg-white p-5 space-y-4">
                  {pharmacist?.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-gray-500" />
                      <p className="text-gray-700">{pharmacist.email}</p>
                    </div>
                  )}
                  {pharmacist?.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5 text-gray-500" />
                      <p className="text-gray-700">{pharmacist.phone}</p>
                    </div>
                  )}
                  {pharmacist?.city && pharmacist?.province && (
                    <div className="flex items-center gap-3">
                      <MapPin className="w-5 h-5 text-gray-500" />
                      <p className="text-gray-700">
                        {pharmacist.city}, {pharmacist.province}
                      </p>
                    </div>
                  )}
                </div>

                {pharmacist?.bio && (
                  <div className="p-5 bg-gray-50 border-t border-gray-100">
                    <p className="text-sm text-gray-600">{pharmacist.bio}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payroll Tab */}
          <TabsContent value="payroll" className="space-y-4 mt-4">
            {payrollLoading ? (
              <Card className="border border-gray-200 shadow-sm">
                <CardContent className="p-12 text-center">
                  <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-600 text-sm">Loading payroll information...</p>
                </CardContent>
              </Card>
            ) : (
              <>
                <Card className="border border-blue-200 shadow-sm bg-gradient-to-br from-blue-50 to-white">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Calculator className="w-5 h-5 text-blue-600" />
                      <h2 className="text-lg font-bold text-gray-900">Generate Payroll Invoice</h2>
                    </div>

                    <div className="flex items-start gap-2 mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div className="text-xs text-blue-900">
                        <p className="font-semibold mb-1">Shift Payment Details</p>
                        <p>
                          Rate: ${shift.hourly_rate}/hr × {shift.total_hours} hours = ${shift.total_pay?.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Button
                        onClick={() => generateInvoiceNoDeductionsMutation.mutate()}
                        disabled={generateInvoiceNoDeductionsMutation.isPending || !pharmacist || !shift?.total_pay}
                        className="w-full bg-green-600 hover:bg-green-700 h-12"
                      >
                        {generateInvoiceNoDeductionsMutation.isPending ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <FileText className="w-4 h-4 mr-2" />
                            Generate Invoice (No Deductions)
                          </>
                        )}
                      </Button>

                      <Button
                        onClick={() => generateInvoiceWithDeductionsMutation.mutate()}
                        disabled={generateInvoiceWithDeductionsMutation.isPending || !pharmacist || !shift?.total_pay}
                        className="w-full bg-blue-600 hover:bg-blue-700 h-12"
                      >
                        {generateInvoiceWithDeductionsMutation.isPending ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Calculator className="w-4 h-4 mr-2" />
                            Generate Invoice (With Deductions)
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border border-gray-200 shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Receipt className="w-5 h-5 text-gray-700" />
                      <h2 className="text-lg font-bold text-gray-900">Generated Invoices</h2>
                      {invoices.length > 0 && (
                        <Badge variant="outline" className="ml-auto">
                          {invoices.length} invoice{invoices.length !== 1 ? 's' : ''}
                        </Badge>
                      )}
                    </div>

                    {invoices.length === 0 ? (
                      <div className="text-center py-8">
                        <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-sm text-gray-600 mb-2">No invoices generated yet</p>
                        <p className="text-xs text-gray-500">
                          Use the buttons above to generate an invoice
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {invoices.map((invoice) => (
                          <div
                            key={invoice.id}
                            className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                  <Receipt className="w-4 h-4 text-gray-600" />
                                  <span className="font-semibold text-gray-900">
                                    Invoice #{invoice.id.slice(0, 8)}
                                  </span>
                                  {invoice.sent_to_pharmacist && (
                                    <Badge className="bg-green-100 text-green-700 border-green-300">
                                      <Send className="w-3 h-3 mr-1" />
                                      Sent
                                    </Badge>
                                  )}
                                  {invoice.include_deductions ? (
                                    <Badge className="bg-amber-100 text-amber-800 border-amber-300">
                                      <Calculator className="w-3 h-3 mr-1" />
                                      With Deductions
                                    </Badge>
                                  ) : (
                                    <Badge className="bg-blue-100 text-blue-700 border-blue-300">
                                      No Deductions
                                    </Badge>
                                  )}
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                  <div>
                                    <p className="text-xs text-gray-500 mb-0.5">Date</p>
                                    <p className="font-medium text-gray-900">
                                      {format(new Date(invoice.created_date), "MMM d, yyyy")}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-500 mb-0.5">Gross Amount</p>
                                    <p className="font-medium text-gray-900">${invoice.gross_amount.toFixed(2)}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-500 mb-0.5">Total Deductions</p>
                                    <p className="font-medium text-red-600">
                                      {invoice.include_deductions 
                                        ? `-$${(invoice.gross_amount - invoice.net_amount).toFixed(2)}`
                                        : "$0.00"}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-500 mb-0.5">Net Amount</p>
                                    <p className="font-bold text-blue-600">${invoice.net_amount.toFixed(2)}</p>
                                  </div>
                                </div>
                              </div>

                              <div className="flex flex-col gap-2 flex-shrink-0">
                                <a
                                  href={invoice.pdf_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                                >
                                  <Download className="w-4 h-4" />
                                  View PDF
                                </a>
                                
                                {!invoice.sent_to_pharmacist && (
                                  <Button
                                    onClick={() => handleSendInvoice(invoice.id)}
                                    disabled={sendInvoiceMutation.isPending}
                                    size="sm"
                                    variant="outline"
                                    className="border-green-200 text-green-700 hover:bg-green-50"
                                  >
                                    <Send className="w-4 h-4 mr-1" />
                                    Send
                                  </Button>
                                )}
                              </div>
                            </div>

                            {invoice.include_deductions && invoice.deductions && (
                              <div className="mt-3 pt-3 border-t border-gray-200">
                                <p className="text-xs text-gray-600 mb-2 font-medium">Deductions Applied:</p>
                                <div className="flex flex-wrap gap-2 text-xs">
                                  <span className="px-2 py-1 bg-white rounded border border-gray-200">
                                    CPP: ${invoice.deductions.cpp.toFixed(2)}
                                  </span>
                                  <span className="px-2 py-1 bg-white rounded border border-gray-200">
                                    EI: ${invoice.deductions.ei.toFixed(2)}
                                  </span>
                                  <span className="px-2 py-1 bg-white rounded border border-gray-200">
                                    Federal: ${invoice.deductions.federal_tax.toFixed(2)}
                                  </span>
                                  <span className="px-2 py-1 bg-white rounded border border-gray-200">
                                    Ontario: ${invoice.deductions.ontario_tax.toFixed(2)}
                                  </span>
                                  <span className="px-2 py-1 bg-amber-50 rounded border border-amber-300 font-semibold">
                                    Total: ${(invoice.deductions.cpp + invoice.deductions.ei + invoice.deductions.federal_tax + invoice.deductions.ontario_tax).toFixed(2)}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {payrollData && !payrollData.is_public && (
                  <Card className="border border-gray-200 shadow-sm">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <DollarSign className="w-5 h-5 text-gray-700" />
                        <h2 className="text-lg font-bold text-gray-900">Pharmacist Payment Details</h2>
                      </div>

                      <div className="space-y-3">
                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                              {React.createElement(getMethodIcon(payrollData.method), {
                                className: "w-6 h-6 text-blue-600"
                              })}
                            </div>
                            <div>
                              <p className="text-xs text-gray-600 mb-0.5">Payment Method</p>
                              <p className="font-semibold text-gray-900">{payrollData.method}</p>
                            </div>
                          </div>
                        </div>

                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <p className="text-xs text-gray-600 mb-1">Legal Name</p>
                          <p className="font-semibold text-gray-900">
                            {payrollData.legal_first_name} {payrollData.legal_last_name}
                          </p>
                        </div>

                        {payrollData.method === "Direct Deposit" && (
                          <>
                            {payrollData.bank_name && (
                              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <p className="text-xs text-gray-600 mb-1">Bank Name</p>
                                    <p className="font-semibold text-gray-900">
                                      {showPaymentDetails.bank_name ? payrollData.bank_name : maskValue(payrollData.bank_name, 3)}
                                    </p>
                                  </div>
                                  <button
                                    onClick={() => toggleFieldVisibility('bank_name')}
                                    className="ml-2 p-2 hover:bg-gray-200 rounded-lg transition-colors"
                                  >
                                    {showPaymentDetails.bank_name ? (
                                      <EyeOff className="w-4 h-4 text-gray-600" />
                                    ) : (
                                      <Eye className="w-4 h-4 text-gray-600" />
                                    )}
                                  </button>
                                </div>
                              </div>
                            )}

                            {payrollData.institution_number && (
                              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <p className="text-xs text-gray-600 mb-1">Institution Number</p>
                                    <p className="font-mono font-semibold text-gray-900">
                                      {showPaymentDetails.institution_number ? payrollData.institution_number : maskValue(payrollData.institution_number, 0)}
                                    </p>
                                  </div>
                                  <button
                                    onClick={() => toggleFieldVisibility('institution_number')}
                                    className="ml-2 p-2 hover:bg-gray-200 rounded-lg transition-colors"
                                  >
                                    {showPaymentDetails.institution_number ? (
                                      <EyeOff className="w-4 h-4 text-gray-600" />
                                    ) : (
                                      <Eye className="w-4 h-4 text-gray-600" />
                                    )}
                                  </button>
                                </div>
                              </div>
                            )}

                            {payrollData.transit_number && (
                              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <p className="text-xs text-gray-600 mb-1">Transit Number</p>
                                    <p className="font-mono font-semibold text-gray-900">
                                      {showPaymentDetails.transit_number ? payrollData.transit_number : maskValue(payrollData.transit_number, 0)}
                                    </p>
                                  </div>
                                  <button
                                    onClick={() => toggleFieldVisibility('transit_number')}
                                    className="ml-2 p-2 hover:bg-gray-200 rounded-lg transition-colors"
                                  >
                                    {showPaymentDetails.transit_number ? (
                                      <EyeOff className="w-4 h-4 text-gray-600" />
                                    ) : (
                                      <Eye className="w-4 h-4 text-gray-600" />
                                    )}
                                  </button>
                                </div>
                              </div>
                            )}

                            {payrollData.account_number && (
                              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <p className="text-xs text-gray-600 mb-1">Account Number</p>
                                    <p className="font-mono font-semibold text-gray-900">
                                      {showPaymentDetails.account_number ? payrollData.account_number : maskValue(payrollData.account_number)}
                                    </p>
                                  </div>
                                  <button
                                    onClick={() => toggleFieldVisibility('account_number')}
                                    className="ml-2 p-2 hover:bg-gray-200 rounded-lg transition-colors"
                                  >
                                    {showPaymentDetails.account_number ? (
                                      <EyeOff className="w-4 h-4 text-gray-600" />
                                    ) : (
                                      <Eye className="w-4 h-4 text-gray-600" />
                                    )}
                                  </button>
                                </div>
                              </div>
                            )}
                          </>
                        )}

                        {payrollData.method === "Bank E-Transfer" && (
                          <>
                            {payrollData.etransfer_email && (
                              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <p className="text-xs text-gray-600 mb-1">E-Transfer Email</p>
                                    <p className="font-semibold text-gray-900 break-all">
                                      {showPaymentDetails.etransfer_email ? payrollData.etransfer_email : maskValue(payrollData.etransfer_email, 5)}
                                    </p>
                                  </div>
                                  <button
                                    onClick={() => toggleFieldVisibility('etransfer_email')}
                                    className="ml-2 p-2 hover:bg-gray-200 rounded-lg transition-colors flex-shrink-0"
                                  >
                                    {showPaymentDetails.etransfer_email ? (
                                      <EyeOff className="w-4 h-4 text-gray-600" />
                                    ) : (
                                      <Eye className="w-4 h-4 text-gray-600" />
                                    )}
                                  </button>
                                </div>
                              </div>
                            )}

                            {payrollData.bank_name && (
                              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <p className="text-xs text-gray-600 mb-1">Bank Name</p>
                                    <p className="font-semibold text-gray-900">
                                      {showPaymentDetails.bank_name ? payrollData.bank_name : maskValue(payrollData.bank_name, 3)}
                                    </p>
                                  </div>
                                  <button
                                    onClick={() => toggleFieldVisibility('bank_name')}
                                    className="ml-2 p-2 hover:bg-gray-200 rounded-lg transition-colors"
                                  >
                                    {showPaymentDetails.bank_name ? (
                                      <EyeOff className="w-4 h-4 text-gray-600" />
                                    ) : (
                                      <Eye className="w-4 h-4 text-gray-600" />
                                    )}
                                  </button>
                                </div>
                              </div>
                            )}

                            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                              <p className="text-xs text-gray-600 mb-2">Auto-Deposit</p>
                              <Badge className={payrollData.auto_deposit_enabled ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}>
                                {payrollData.auto_deposit_enabled ? (
                                  <><CheckCircle className="w-3 h-3 mr-1" /> Enabled</>
                                ) : (
                                  "Disabled - Security Q&A Required"
                                )}
                              </Badge>
                            </div>
                          </>
                        )}

                        {payrollData.method === "Cheque" && payrollData.bank_name && (
                          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <p className="text-xs text-gray-600 mb-1">Bank Name (for deposit)</p>
                                <p className="font-semibold text-gray-900">
                                  {showPaymentDetails.bank_name ? payrollData.bank_name : maskValue(payrollData.bank_name, 3)}
                                </p>
                              </div>
                              <button
                                onClick={() => toggleFieldVisibility('bank_name')}
                                className="ml-2 p-2 hover:bg-gray-200 rounded-lg transition-colors"
                              >
                                {showPaymentDetails.bank_name ? (
                                  <EyeOff className="w-4 h-4 text-gray-600" />
                                ) : (
                                  <Eye className="w-4 h-4 text-gray-600" />
                                )}
                              </button>
                            </div>
                          </div>
                        )}

                        <div className="flex items-start gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
                          <Lock className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                          <p className="text-xs text-green-900">
                            Payment details are encrypted and secured. Click the eye icon to reveal sensitive information.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Cancel Shift Modal */}
      <EmployerCancelShiftModal
        shift={shift}
        open={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirmCancel={handleCancelShift}
        isCancelling={cancelShiftMutation.isPending}
      />
    </div>
  );
}

export default function FilledShiftDetails() {
  return (
    <EmployerOnly>
      <FilledShiftDetailsContent />
    </EmployerOnly>
  );
}