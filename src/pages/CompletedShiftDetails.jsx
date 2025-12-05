
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
  Star,
  CheckCircle,
  ExternalLink,
  Shield,
  Award,
  Briefcase,
  MessageSquare,
  Send,
  Receipt,
  Eye,
  EyeOff,
  Info,
  Download,
  FileText,
  Calculator,
  Lock,
  Banknote
} from "lucide-react";
import { format } from "date-fns";
import { formatTime12Hour } from "../components/utils/timeUtils";
import { EmployerOnly } from "../components/auth/RouteProtection";
import ProfileAvatar from "../components/shared/ProfileAvatar";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

function CompletedShiftDetailsContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("shift");
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    professionalism: 5,
    punctuality: 5,
    communication: 5,
    wouldHireAgain: true,
    reviewText: ""
  });
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
    queryKey: ['completedShift', shiftId],
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

  const { data: existingReview, refetch: refetchReview } = useQuery({
    queryKey: ['shiftReview', shiftId, user?.id],
    queryFn: async () => {
      const reviews = await base44.entities.Review.filter({
        shift_id: shiftId,
        employer_id: user?.id
      });
      return reviews[0];
    },
    enabled: !!shiftId && !!user
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
      toast({
        variant: "destructive",
        title: "Generation Failed",
        description: error?.response?.data?.error || "Failed to generate invoice",
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
      toast({
        variant: "destructive",
        title: "Generation Failed",
        description: error?.response?.data?.error || "Failed to generate invoice with deductions",
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

  const submitReviewMutation = useMutation({
    mutationFn: async (reviewData) => {
      const response = await base44.functions.invoke('submitPharmacistReview', reviewData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shiftReview'] });
      queryClient.invalidateQueries({ queryKey: ['completedShift'] });
      setShowReviewDialog(false);
      setReviewForm({
        rating: 5,
        professionalism: 5,
        punctuality: 5,
        communication: 5,
        wouldHireAgain: true,
        reviewText: ""
      });
      toast({
        title: "✓ Review Submitted",
        description: "Your review has been posted successfully",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error?.response?.data?.error || "Failed to submit review",
      });
    }
  });

  const handleSubmitReview = () => {
    if (!pharmacist) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Pharmacist information not available",
      });
      return;
    }

    submitReviewMutation.mutate({
      pharmacistId: pharmacist.id,
      shiftId: shiftId,
      rating: reviewForm.rating,
      professionalism: reviewForm.professionalism,
      punctuality: reviewForm.punctuality,
      communication: reviewForm.communication,
      wouldHireAgain: reviewForm.wouldHireAgain,
      reviewText: reviewForm.reviewText
    });
  };

  const handleSendInvoice = (invoiceId) => {
    if (window.confirm('Send this invoice to the pharmacist via email?')) {
      sendInvoiceMutation.mutate(invoiceId);
    }
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
              <h1 className="text-base font-semibold text-gray-900">Completed Shift</h1>
              <p className="text-xs text-gray-600">{shift.pharmacy_name}</p>
            </div>
            <Badge className="bg-blue-100 text-blue-700 border-blue-300">
              <CheckCircle className="w-3 h-3 mr-1" />
              Completed
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-4 space-y-4">
        
        {/* Review Prompt Card */}
        {!existingReview && pharmacist && (
          <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-lg">
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <Star className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">Rate This Pharmacist</h3>
                  <p className="text-sm text-gray-700 mb-3">
                    How was your experience with {pharmacist.full_name}? Your feedback helps build a stronger community.
                  </p>
                  <Button
                    onClick={() => setShowReviewDialog(true)}
                    className="bg-blue-600 hover:bg-blue-700 h-10"
                  >
                    <Star className="w-4 h-4 mr-2" />
                    Post Review
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Existing Review Card */}
        {existingReview && (
          <Card className="border-2 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Your Review</h3>
                  <div className="flex items-center gap-2 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-5 h-5 ${
                          i < existingReview.rating
                            ? "text-yellow-400 fill-current"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                    <span className="ml-2 text-sm font-semibold text-gray-700">
                      {existingReview.rating.toFixed(1)} / 5.0
                    </span>
                  </div>
                  {existingReview.review_text && (
                    <p className="text-sm text-gray-700 italic">"{existingReview.review_text}"</p>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    Submitted on {format(new Date(existingReview.created_date), "MMM d, yyyy")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
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
                      <p className="text-xs text-gray-500 mb-1 font-medium uppercase tracking-wide">Total Paid</p>
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

                  {shift.completed_at && (
                    <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                      <p className="text-xs text-green-800 font-medium">
                        ✓ Completed on {format(new Date(shift.completed_at), "MMM d, yyyy 'at' h:mm a")}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pharmacist Tab */}
          <TabsContent value="pharmacist" className="space-y-4 mt-4">
            {pharmacist ? (
              <>
                <Card className="border border-gray-200 shadow-sm overflow-hidden">
                  <CardContent className="p-0">
                    {/* Header with Avatar */}
                    <div className="bg-gradient-to-r from-teal-50 to-cyan-50 p-4 sm:p-5">
                      <div className="flex items-center gap-3 sm:gap-4">
                        <ProfileAvatar
                          user={{
                            email: pharmacist.email,
                            avatar_url: pharmacist.avatar_url,
                            full_name: pharmacist.full_name
                          }}
                          size="lg"
                          editable={false}
                          className="border-2 border-white shadow-md flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-1 truncate">
                            {pharmacist.full_name || "Pharmacist"}
                          </h2>
                          {pharmacist.license_number && (
                            <div className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-700 mb-1">
                              <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-teal-600 flex-shrink-0" />
                              <span className="truncate">License #{pharmacist.license_number}</span>
                            </div>
                          )}
                          {pharmacist.rating > 0 && (
                            <div className="flex items-center gap-1 mt-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${
                                    i < Math.round(pharmacist.rating)
                                      ? "text-yellow-400 fill-current"
                                      : "text-gray-300"
                                  }`}
                                />
                              ))}
                              <span className="ml-1 text-xs sm:text-sm text-gray-700 font-medium">
                                {pharmacist.rating.toFixed(1)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Contact Actions */}
                    <div className="p-4 sm:p-5 bg-white border-b border-gray-100">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                        {pharmacist.email && (
                          <a
                            href={`mailto:${pharmacist.email}`}
                            className="flex items-center justify-center gap-2 px-4 py-3 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg transition-colors group"
                          >
                            <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-teal-600 group-hover:text-teal-700" />
                            <span className="text-sm sm:text-base font-medium text-teal-700 group-hover:text-teal-800">
                              Email
                            </span>
                          </a>
                        )}

                        {pharmacist.phone_number && (
                          <a
                            href={`tel:${pharmacist.phone_number}`}
                            className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors group"
                          >
                            <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 group-hover:text-blue-700" />
                            <span className="text-sm sm:text-base font-medium text-blue-700 group-hover:text-blue-800">
                              Call
                            </span>
                          </a>
                        )}

                        <Button
                          onClick={handleViewProfile}
                          variant="outline"
                          className="h-auto py-3 border-gray-300 hover:bg-gray-50 hover:border-gray-400"
                        >
                          <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                          <span className="text-sm sm:text-base font-medium">Profile</span>
                        </Button>
                      </div>
                    </div>

                    {/* Contact Info Details */}
                    <div className="p-4 sm:p-5 bg-gray-50">
                      <h3 className="text-sm font-semibold text-gray-900 mb-3">Contact Information</h3>
                      <div className="space-y-2.5">
                        {pharmacist.email && (
                          <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200">
                            <div className="w-9 h-9 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-teal-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-gray-500 mb-0.5">Email Address</p>
                              <p className="text-sm sm:text-base text-gray-900 break-all">{pharmacist.email}</p>
                            </div>
                          </div>
                        )}

                        {pharmacist.phone_number && (
                          <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200">
                            <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-gray-500 mb-0.5">Phone Number</p>
                              <p className="text-sm sm:text-base text-gray-900">{pharmacist.phone_number}</p>
                            </div>
                          </div>
                        )}

                        {pharmacist.city && pharmacist.province && (
                          <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200">
                            <div className="w-9 h-9 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-gray-500 mb-0.5">Location</p>
                              <p className="text-sm sm:text-base text-gray-900">
                                {pharmacist.city}, {pharmacist.province}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bio Section */}
                    {pharmacist.bio && (
                      <div className="p-4 sm:p-5 bg-white border-t border-gray-100">
                        <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                          <User className="w-4 h-4 text-teal-600" />
                          About
                        </h3>
                        <p className="text-sm text-gray-700 leading-relaxed">{pharmacist.bio}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="border border-gray-200 shadow-sm">
                <CardContent className="p-8 text-center">
                  <User className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-600">Pharmacist information not available</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Payroll Tab - NEW */}
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
                {/* Payroll Controls */}
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

                {/* Invoices List */}
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

                {/* Payment Method Info */}
                {payrollData && !payrollData.is_public && (
                  <Card className="border border-gray-200 shadow-sm">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <DollarSign className="w-5 h-5 text-gray-700" />
                        <h2 className="text-lg font-bold text-gray-900">Pharmacist Payment Details</h2>
                      </div>

                      <div className="space-y-3">
                        {/* Payment Method */}
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

                        {/* Legal Name */}
                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <p className="text-xs text-gray-600 mb-1">Legal Name</p>
                          <p className="font-semibold text-gray-900">
                            {payrollData.legal_first_name} {payrollData.legal_last_name}
                          </p>
                        </div>

                        {/* Direct Deposit Details */}
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

                        {/* E-Transfer Details */}
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

                        {/* Cheque Details */}
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

                        {/* Security Notice */}
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

      {/* Review Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">Rate {pharmacist?.full_name}</DialogTitle>
            <DialogDescription>
              Share your experience to help build trust in our community
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Overall Rating */}
            <div>
              <Label className="text-base font-semibold mb-3 block">Overall Rating *</Label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-10 h-10 ${
                        star <= reviewForm.rating
                          ? "text-yellow-400 fill-current"
                          : "text-gray-300"
                      }`}
                    />
                  </button>
                ))}
                <span className="ml-2 text-lg font-bold text-gray-900">
                  {reviewForm.rating}.0
                </span>
              </div>
            </div>

            {/* Detailed Ratings */}
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-gray-900">Detailed Ratings</h4>
              
              {/* Professionalism */}
              <div>
                <Label className="text-sm mb-2 block">Professionalism</Label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewForm({ ...reviewForm, professionalism: star })}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= reviewForm.professionalism
                            ? "text-yellow-400 fill-current"
                            : "text-gray-300"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Punctuality */}
              <div>
                <Label className="text-sm mb-2 block">Punctuality</Label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewForm({ ...reviewForm, punctuality: star })}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= reviewForm.punctuality
                            ? "text-yellow-400 fill-current"
                            : "text-gray-300"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Communication */}
              <div>
                <Label className="text-sm mb-2 block">Communication</Label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewForm({ ...reviewForm, communication: star })}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= reviewForm.communication
                            ? "text-yellow-400 fill-current"
                            : "text-gray-300"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Would Hire Again */}
            <div>
              <Label className="text-base font-semibold mb-3 block">Would you hire this pharmacist again?</Label>
              <RadioGroup
                value={reviewForm.wouldHireAgain.toString()}
                onValueChange={(val) => setReviewForm({ ...reviewForm, wouldHireAgain: val === "true" })}
              >
                <div className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <RadioGroupItem value="true" id="yes" />
                  <Label htmlFor="yes" className="flex-1 cursor-pointer">
                    Yes, definitely!
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <RadioGroupItem value="false" id="no" />
                  <Label htmlFor="no" className="flex-1 cursor-pointer">
                    No
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Review Text */}
            <div>
              <Label htmlFor="reviewText" className="text-base font-semibold mb-2 block">
                Written Review (Optional)
              </Label>
              <Textarea
                id="reviewText"
                placeholder="Share more details about your experience..."
                value={reviewForm.reviewText}
                onChange={(e) => setReviewForm({ ...reviewForm, reviewText: e.target.value })}
                rows={4}
                className="resize-none"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowReviewDialog(false)}
              disabled={submitReviewMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitReview}
              disabled={submitReviewMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {submitReviewMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Submit Review
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function CompletedShiftDetails() {
  return (
    <EmployerOnly>
      <CompletedShiftDetailsContent />
    </EmployerOnly>
  );
}
