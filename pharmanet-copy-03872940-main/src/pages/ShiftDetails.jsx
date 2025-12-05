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
  Send,
  CheckCircle,
  Info,
  Map as MapIcon,
  Layers
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { formatTime12Hour, parseLocalDate } from "../components/utils/timeUtils";
import { getScheduleFromShift } from "../components/utils/shiftUtils";
import ApplicationDialog from "../components/shift/ApplicationDialog";
import { PharmacistOnly } from "../components/auth/RouteProtection";
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function ShiftDetailsContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [showApplicationDialog, setShowApplicationDialog] = useState(false);
  const [pharmacyCoords, setPharmacyCoords] = useState(null);
  const [loadingMap, setLoadingMap] = useState(false);

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

  const { data: myApplication, refetch: refetchApplication, isLoading: applicationLoading } = useQuery({
    queryKey: ['myApplication', shiftId, user?.email],
    queryFn: () => base44.entities.ShiftApplication.filter({
      shift_id: shiftId,
      pharmacist_email: user?.email
    }),
    enabled: !!shiftId && !!user,
    initialData: []
  });

  // Redirect if not accepted
  useEffect(() => {
    if (!shiftLoading && !applicationLoading && shift && myApplication) {
      const status = myApplication[0]?.status;
      if (status !== 'accepted') {
        navigate(createPageUrl("BrowseShifts") + `?openShift=${shiftId}`, { replace: true });
      }
    }
  }, [shiftLoading, applicationLoading, shift, myApplication, shiftId, navigate]);

  const { data: applications } = useQuery({
    queryKey: ['shiftApplications', shiftId],
    queryFn: () => base44.entities.ShiftApplication.filter({
      shift_id: shiftId
    }),
    enabled: !!shiftId,
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

  const handleApply = () => {
    setShowApplicationDialog(true);
  };

  const handleCloseDialog = () => {
    setShowApplicationDialog(false);
    refetchApplication();
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

  if (!shift) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Shift Not Found</h2>
            <Button onClick={() => navigate(createPageUrl("BrowseShifts"))}>
              Browse Shifts
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const hasApplied = myApplication && myApplication.length > 0;
  const applicationStatus = hasApplied ? myApplication[0].status : null;
  const isAccepted = applicationStatus === 'accepted';
  const isPending = applicationStatus === 'pending';
  const isRejected = applicationStatus === 'rejected';
  const applicationsCount = applications.length;

  // Use unified schedule utilities
  const schedule = React.useMemo(() => getScheduleFromShift(shift), [shift]);
  
  const isMultiDate = schedule.length > 1;
  const [selectedDateIndex, setSelectedDateIndex] = React.useState(0);
  const currentDate = schedule[selectedDateIndex] || schedule[0] || {
    date: '',
    start_time: '09:00',
    end_time: '17:00'
  };

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
            {shift.status === 'open' ? (
              <Badge className="bg-green-100 text-green-700 border-green-300">Open</Badge>
            ) : shift.status === 'filled' ? (
              <Badge className="bg-blue-100 text-blue-700 border-blue-300">Filled</Badge>
            ) : (
              <Badge className="bg-gray-100 text-gray-700 border-gray-300">
                {shift.status}
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-4 space-y-4">
        
        {/* Application Status Banner */}
        {hasApplied && (
          <Card className={`border-2 ${
            isAccepted ? 'bg-green-50 border-green-300' :
            isPending ? 'bg-blue-50 border-blue-300' :
            'bg-red-50 border-red-300'
          }`}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                {isAccepted && <CheckCircle className="w-6 h-6 text-green-600" />}
                {isPending && <Clock className="w-6 h-6 text-blue-600" />}
                {isRejected && <Info className="w-6 h-6 text-red-600" />}
                <div className="flex-1">
                  <p className={`font-bold text-sm ${
                    isAccepted ? 'text-green-900' :
                    isPending ? 'text-blue-900' :
                    'text-red-900'
                  }`}>
                    {isAccepted && 'Application Accepted! 🎉'}
                    {isPending && 'Application Under Review'}
                    {isRejected && 'Application Not Selected'}
                  </p>
                  <p className={`text-xs ${
                    isAccepted ? 'text-green-700' :
                    isPending ? 'text-blue-700' :
                    'text-red-700'
                  }`}>
                    {isAccepted && 'You\'ve been selected for this shift. Contact the pharmacy for details.'}
                    {isPending && 'The employer is reviewing your application'}
                    {isRejected && 'Unfortunately, you were not selected for this shift'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Shift Info Card */}
        <Card className="border border-gray-200 shadow-sm overflow-hidden">
          <CardContent className="p-0">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-5 border-b border-blue-200">
              {/* Multi-Date Badge */}
              {isMultiDate && (
                <Badge className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white border-0 text-sm shadow-md px-3 py-1 mb-3">
                  <Layers className="w-4 h-4 mr-1.5" />
                  Multi-Date Posting • {schedule.length} Dates Available
                </Badge>
              )}

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
                    <span className="text-2xl font-bold text-gray-900">${shift.hourly_rate || 50}</span>
                    <span className="text-sm text-gray-600">/hr</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 mb-1">{isMultiDate ? 'Total (All Dates)' : 'Total Pay'}</p>
                  <p className="text-xl font-bold text-emerald-600">${shift.total_pay || 0}</p>
                </div>
              </div>
            </div>

            {/* Date & Time */}
            <div className="p-5 bg-gray-50">
              {/* Date Selector for Multi-Date */}
              {isMultiDate && (
                <div className="mb-4">
                  <Label className="text-sm font-semibold text-gray-700 mb-2 block">Select Date</Label>
                  <div className="space-y-2">
                    {schedule.map((dateInfo, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedDateIndex(idx)}
                        className={`w-full flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
                          selectedDateIndex === idx
                            ? 'border-teal-500 bg-teal-50'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-600" />
                          <span className="font-semibold text-sm text-gray-900">
                            {dateInfo.date ? format(parseLocalDate(dateInfo.date), "EEE, MMM d, yyyy") : 'Date not set'}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {dateInfo.start_time} - {dateInfo.end_time}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    <p className="text-xs text-gray-500 font-medium uppercase">Date</p>
                  </div>
                  <p className="font-bold text-gray-900 text-base">
                    {format(parseLocalDate(currentDate.date), "EEEE")}
                  </p>
                  <p className="text-sm text-gray-600">
                    {format(parseLocalDate(currentDate.date), "MMM d, yyyy")}
                  </p>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-5 h-5 text-blue-600" />
                    <p className="text-xs text-gray-500 font-medium uppercase">Time</p>
                  </div>
                  <p className="font-bold text-gray-900 text-sm">
                    {formatTime12Hour(currentDate.start_time)}
                  </p>
                  <p className="font-bold text-gray-900 text-sm">
                    {formatTime12Hour(currentDate.end_time)}
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
                    Call
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
                    {pharmacy.email}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Employer Info & Messaging Card */}
        {employer && (
          <Card className="border border-gray-200 shadow-sm">
            <CardContent className="p-5 space-y-4">
              <div>
                <h3 className="font-bold text-base mb-4 flex items-center gap-2 text-gray-900">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  Employer Information
                </h3>

                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-6 h-6 text-white" />
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
              </div>


            </CardContent>
          </Card>
        )}

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

        {/* Competition Info */}
        {shift.status === 'open' && applicationsCount > 0 && (
          <div className="bg-amber-50 rounded-xl p-4 border-2 border-amber-200">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-gray-900 text-sm mb-1">
                  {applicationsCount} {applicationsCount === 1 ? 'Pharmacist has' : 'Pharmacists have'} Applied
                </p>
                <p className="text-sm text-gray-700">
                  This shift is competitive. Apply early to increase your chances!
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Fixed Apply Button - Above Bottom Navigation */}
      {shift.status === 'open' && !hasApplied && (
        <div className="fixed bottom-16 left-0 right-0 bg-white border-t-2 border-gray-200 shadow-2xl z-50 safe-bottom">
          <div className="max-w-4xl mx-auto px-4 py-3">
            <Button
              onClick={handleApply}
              className="w-full h-12 bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white font-semibold text-sm"
            >
              <Send className="w-4 h-4 mr-2" />
              Apply for This Shift
            </Button>
          </div>
        </div>
      )}

      {/* Application Dialog */}
      <ApplicationDialog
        shift={shift}
        open={showApplicationDialog}
        onClose={handleCloseDialog}
        userEmail={user?.email}
      />
    </div>
  );
}

export default function ShiftDetails() {
  return (
    <PharmacistOnly>
      <ShiftDetailsContent />
    </PharmacistOnly>
  );
}