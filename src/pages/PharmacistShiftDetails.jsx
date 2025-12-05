import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Calendar,
  Clock,
  DollarSign,
  MapPin,
  Phone,
  Mail,
  Building2,
  Monitor,
  User,
  CheckCircle,
  Info,
  Map as MapIcon,
  Shield
} from "lucide-react";
import { format } from "date-fns";
import { formatTime12Hour } from "../components/utils/timeUtils";
import { PharmacistOnly } from "../components/auth/RouteProtection";
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import CancellationModal from "../components/shift/CancellationModal";
import { useToast } from "@/components/ui/use-toast";

// Fix for default marker icon in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function PharmacistShiftDetailsContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [user, setUser] = useState(null);
  const [pharmacyCoords, setPharmacyCoords] = useState(null);
  const [loadingMap, setLoadingMap] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

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
      const shifts = await base44.entities.Shift.filter({ id: shiftId });
      return shifts[0];
    },
    enabled: !!shiftId
  });

  const { data: pharmacy, isLoading: pharmacyLoading } = useQuery({
    queryKey: ['pharmacy', shift?.pharmacy_id],
    queryFn: async () => {
      if (!shift?.pharmacy_id) return null;
      const pharmacies = await base44.entities.Pharmacy.filter({ id: shift.pharmacy_id });
      return pharmacies[0];
    },
    enabled: !!shift?.pharmacy_id
  });

  const { data: myApplication } = useQuery({
    queryKey: ['myApplication', shiftId, user?.email],
    queryFn: () => base44.entities.ShiftApplication.filter({
      shift_id: shiftId,
      pharmacist_email: user?.email
    }),
    enabled: !!shiftId && !!user,
    initialData: []
  });

  const { data: employer } = useQuery({
    queryKey: ['employer', shift?.created_by],
    queryFn: async () => {
      if (!shift?.created_by) return null;
      const { data } = await base44.functions.invoke('getPharmacistPublicProfile', {
        pharmacistEmail: shift.created_by
      });
      return data;
    },
    enabled: !!shift?.created_by
  });

  // Geocode pharmacy address
  useEffect(() => {
    if (pharmacy && pharmacy.address && pharmacy.city) {
      geocodeAddress();
    }
  }, [pharmacy]);

  const geocodeAddress = async () => {
    if (!pharmacy) return;
    
    setLoadingMap(true);
    try {
      const fullAddress = `${pharmacy.address}, ${pharmacy.city}, ${pharmacy.province}, ${pharmacy.postal_code}`;
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullAddress)}`
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        setPharmacyCoords([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
      } else {
        // Fallback to Toronto center
        setPharmacyCoords([43.6532, -79.3832]);
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      setPharmacyCoords([43.6532, -79.3832]); // Fallback
    }
    setLoadingMap(false);
  };

  const handleCall = () => {
    if (pharmacy?.phone) {
      window.location.href = `tel:${pharmacy.phone}`;
    }
  };

  const handleEmail = () => {
    if (pharmacy?.email) {
      window.location.href = `mailto:${pharmacy.email}`;
    }
  };

  const handleDirections = () => {
    if (pharmacy) {
      const address = `${pharmacy.address}, ${pharmacy.city}, ${pharmacy.province}, ${pharmacy.postal_code}`;
      const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
      window.open(mapsUrl, '_blank');
    }
  };

  const hasAcceptedApp = myApplication && myApplication.length > 0 && myApplication[0].status === 'accepted';

  const cancelShiftMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('handleShiftCancellation', {
        shiftId: shiftId,
        cancelledAt: new Date().toISOString()
      });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['shift', shiftId]);
      queryClient.invalidateQueries(['myApplication', shiftId]);
      queryClient.invalidateQueries(['myApplications']);

      toast({
        title: data.cancellation.totalPenalty > 0 ? "Shift Cancelled" : "✓ Shift Cancelled",
        description: data.message,
        variant: data.cancellation.totalPenalty > 0 ? "destructive" : "default"
      });

      setShowCancelModal(false);
      
      // Navigate back after short delay
      setTimeout(() => {
        navigate(createPageUrl("MyApplications"));
      }, 2000);
    },
    onError: (error) => {
      const errorMsg = error?.response?.data?.error || error.message || "Failed to cancel shift";
      toast({
        variant: "destructive",
        title: "Cancellation Failed",
        description: errorMsg,
      });
      setShowCancelModal(false);
    }
  });

  const handleCancelShift = () => {
    setShowCancelModal(true);
  };

  const handleConfirmCancellation = () => {
    cancelShiftMutation.mutate();
  };

  if (shiftLoading || pharmacyLoading || !user) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="h-64 bg-white rounded-2xl animate-pulse" />
          <div className="h-96 bg-white rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (!shift || !hasAcceptedApp) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card>
          <CardContent className="p-8 text-center">
            <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-4">You don't have permission to view this shift.</p>
            <Button onClick={() => navigate(createPageUrl("PharmacistDashboard"))}>
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-[50px] z-40 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="w-9 h-9 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-gray-700" />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-base font-semibold text-gray-900 truncate">Shift Details</h1>
              <p className="text-xs text-gray-600 truncate">{shift.pharmacy_name}</p>
            </div>
            <Badge className="bg-green-100 text-green-700 border-green-300">
              <CheckCircle className="w-3 h-3 mr-1" />
              Confirmed
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-4 space-y-4">
        
        {/* Shift Info Card */}
        <Card className="border border-gray-200 shadow-sm overflow-hidden">
          <CardContent className="p-0">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-5 border-b border-blue-200">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                  <Building2 className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-bold text-gray-900 mb-1 truncate">
                    {shift.pharmacy_name}
                  </h2>
                  <div className="flex items-start gap-2 text-gray-700">
                    <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium">{shift.pharmacy_city}, {shift.pharmacy_province}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pay Rate */}
              <div className="bg-white rounded-lg p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Hourly Rate</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-gray-900">${shift.hourly_rate}</span>
                    <span className="text-sm text-gray-600">/hr</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 mb-1">Total Pay</p>
                  <p className="text-xl font-bold text-emerald-600">${shift.total_pay}</p>
                </div>
              </div>
            </div>

            {/* Date & Time */}
            <div className="p-5 bg-gray-50">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    <p className="text-xs text-gray-500 font-medium uppercase">Date</p>
                  </div>
                  <p className="font-bold text-gray-900 text-base">
                    {format(new Date(shift.shift_date), "EEEE")}
                  </p>
                  <p className="text-sm text-gray-600">
                    {format(new Date(shift.shift_date), "MMM d, yyyy")}
                  </p>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-5 h-5 text-blue-600" />
                    <p className="text-xs text-gray-500 font-medium uppercase">Time</p>
                  </div>
                  <p className="font-bold text-gray-900 text-sm">
                    {formatTime12Hour(shift.start_time)}
                  </p>
                  <p className="font-bold text-gray-900 text-sm">
                    {formatTime12Hour(shift.end_time)}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pharmacy Location Card with Map */}
        {pharmacy && (
          <Card className="border border-gray-200 shadow-sm overflow-hidden">
            <CardContent className="p-0">
              {/* Map with Fixed Z-Index */}
              <div className="relative h-64 bg-gray-100" style={{ zIndex: 1 }}>
                {loadingMap ? (
                  <div className="absolute inset-0 flex items-center justify-center z-10">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : pharmacyCoords ? (
                  <div className="h-full w-full" style={{ zIndex: 1 }}>
                    <MapContainer
                      center={pharmacyCoords}
                      zoom={15}
                      style={{ height: '100%', width: '100%', zIndex: 1 }}
                      scrollWheelZoom={false}
                      zoomControl={true}
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      <Marker position={pharmacyCoords}>
                        <Popup>
                          <div className="text-center">
                            <p className="font-bold text-sm">{pharmacy.pharmacy_name}</p>
                            <p className="text-xs text-gray-600">{pharmacy.address}</p>
                          </div>
                        </Popup>
                      </Marker>
                    </MapContainer>
                  </div>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <MapIcon className="w-12 h-12 text-gray-400" />
                  </div>
                )}
              </div>

              {/* Location Details */}
              <div className="p-5 relative z-10">
                <h3 className="font-bold text-base mb-4 flex items-center gap-2 text-gray-900">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  Pharmacy Location
                </h3>

                <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200">
                  <p className="font-semibold text-gray-900 mb-1">{pharmacy.address}</p>
                  <p className="text-sm text-gray-600">
                    {pharmacy.city}, {pharmacy.province} {pharmacy.postal_code}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={handleCall}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                  >
                    <Phone className="w-4 h-4" />
                    Call Pharmacy
                  </Button>
                  <Button
                    onClick={handleDirections}
                    variant="outline"
                    className="border-2 border-blue-600 text-blue-600 hover:bg-blue-50 gap-2"
                  >
                    <MapPin className="w-4 h-4" />
                    Directions
                  </Button>
                </div>

                {pharmacy.email && (
                  <Button
                    onClick={handleEmail}
                    variant="outline"
                    className="w-full mt-3 border-gray-300 hover:bg-gray-50 gap-2"
                  >
                    <Mail className="w-4 h-4" />
                    Email: {pharmacy.email}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Employer & Manager Card */}
        <Card className="border border-gray-200 shadow-sm">
          <CardContent className="p-5">
            <h3 className="font-bold text-base mb-4 flex items-center gap-2 text-gray-900">
              <Building2 className="w-5 h-5 text-blue-600" />
              Employer Information
            </h3>

            <div className="space-y-3">
              {employer && (
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-600 mb-1">Employer</p>
                      <p className="font-bold text-gray-900">{employer.full_name || employer.company_name || 'Employer'}</p>
                      {employer.email && (
                        <a href={`mailto:${employer.email}`} className="text-sm text-blue-600 hover:text-blue-700">
                          {employer.email}
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {pharmacy?.manager_name && (
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-6 h-6 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-600 mb-1">Pharmacy Manager</p>
                      <p className="font-bold text-gray-900">{pharmacy.manager_name}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Additional Info */}
        {shift.description && (
          <Card className="border border-gray-200 shadow-sm">
            <CardContent className="p-5">
              <h3 className="font-bold text-base mb-3 text-gray-900">Shift Description</h3>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-sm">
                {shift.description}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Shift Includes */}
        {shift.shift_includes && Object.values(shift.shift_includes).some(v => v) && (
          <Card className="border border-gray-200 shadow-sm">
            <CardContent className="p-5">
              <h3 className="font-bold text-base mb-4 text-gray-900">Shift Includes</h3>
              <div className="space-y-2">
                {shift.shift_includes.assistant_on_site && (
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <CheckCircle className="w-5 h-5 text-blue-600" />
                    <span className="font-medium text-gray-900 text-sm">Assistant / Technician On Site</span>
                  </div>
                )}
                {shift.shift_includes.vaccination_injections && (
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <CheckCircle className="w-5 h-5 text-blue-600" />
                    <span className="font-medium text-gray-900 text-sm">Vaccination / Injection Services</span>
                  </div>
                )}
                {shift.shift_includes.addiction_dispensing && (
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <CheckCircle className="w-5 h-5 text-blue-600" />
                    <span className="font-medium text-gray-900 text-sm">Addiction Medication Dispensing</span>
                  </div>
                )}
                {shift.shift_includes.methadone_suboxone && (
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <CheckCircle className="w-5 h-5 text-blue-600" />
                    <span className="font-medium text-gray-900 text-sm">Methadone / Suboxone Dispensing</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Important Notice */}
        <div className="bg-blue-50 rounded-xl p-4 border-2 border-blue-200">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-gray-900 text-sm mb-1">Important</p>
              <p className="text-sm text-gray-700">
                Please arrive 10-15 minutes early for your shift. Contact the pharmacy if you need to reschedule or have any questions.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Cancel Button - Above Bottom Navigation */}
      {hasAcceptedApp && shift.status === 'filled' && (
        <div className="fixed bottom-16 left-0 right-0 bg-white border-t-2 border-gray-200 shadow-2xl z-50 safe-bottom">
          <div className="max-w-4xl mx-auto px-4 py-3">
            <Button
              onClick={handleCancelShift}
              variant="destructive"
              className="w-full h-12 text-sm font-semibold"
            >
              Cancel This Shift
            </Button>
          </div>
        </div>
      )}

      {/* Cancellation Modal with High Z-Index */}
      <CancellationModal
        open={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        shift={shift}
        onConfirm={handleConfirmCancellation}
        loading={cancelShiftMutation.isPending}
      />
    </div>
  );
}

export default function PharmacistShiftDetails() {
  return (
    <PharmacistOnly>
      <PharmacistShiftDetailsContent />
    </PharmacistOnly>
  );
}