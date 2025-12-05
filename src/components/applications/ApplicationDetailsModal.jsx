import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  User,
  Calendar,
  Clock,
  DollarSign,
  CheckCircle,
  XCircle,
  Mail,
  Phone,
  MapPin,
  Award,
  Briefcase,
  Monitor,
  Shield,
  ExternalLink,
  Star,
  ChevronDown,
  ChevronUp,
  Layers,
  ArrowLeft,
  MessageSquare
} from "lucide-react";
import { format } from "date-fns";
import { formatTime12Hour } from "../utils/timeUtils";
import PayrollPreview from "../payroll/PayrollPreview";

export default function ApplicationDetailsModal({
  open,
  onClose,
  selectedApp,
  shift,
  profile,
  expandedSections,
  onToggleSection,
  onViewFullProfile,
  onAccept,
  onReject,
  isAccepting,
  isRejecting,
  getInitials
}) {
  if (!selectedApp) return null;


  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-lg p-0 overflow-hidden flex flex-col">
        {/* Modern Header with Back Button */}
        <div className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white px-3 py-3 sticky top-0 z-10 shadow-lg">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-lg bg-white/20 hover:bg-white/30 backdrop-blur flex items-center justify-center transition-colors active:scale-95"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-bold truncate leading-tight">Application Details</h2>
              <p className="text-xs opacity-90 truncate mt-0.5">
                {selectedApp.pharmacist_name}
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 bg-gray-50">
          {/* Pharmacist Profile Card */}
          <Card className="border-0 shadow-sm bg-white rounded-xl ring-1 ring-gray-100">
            <CardContent className="p-3">
              <div className="flex items-start gap-2.5 mb-2.5">
                <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0 ring-2 ring-white shadow-md">
                  {profile?.avatar_url ? (
                    <img 
                      src={profile.avatar_url} 
                      alt={selectedApp.pharmacist_name} 
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    getInitials(selectedApp.pharmacist_name)
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-1.5">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-sm text-gray-900 leading-tight">{selectedApp.pharmacist_name}</h3>
                      <p className="text-[10px] text-gray-600 truncate">{selectedApp.pharmacist_email}</p>
                    </div>
                    {profile?.rating > 0 && (
                      <div className="flex items-center gap-0.5 bg-amber-50 rounded-lg px-1.5 py-0.5 border border-amber-200 ml-2">
                        <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                        <span className="font-bold text-[10px]">{profile.rating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-0.5">
                    {profile?.license_number && (
                      <div className="flex items-center gap-1">
                        <Award className="w-3 h-3 text-teal-600 flex-shrink-0" />
                        <span className="text-[10px] font-medium text-gray-700">License: {profile.license_number}</span>
                      </div>
                    )}
                    {profile?.years_experience && (
                      <div className="flex items-center gap-1">
                        <Briefcase className="w-3 h-3 text-teal-600 flex-shrink-0" />
                        <span className="text-[10px] font-medium text-gray-700">{profile.years_experience} years exp.</span>
                      </div>
                    )}
                    {profile?.completed_shifts > 0 && (
                      <div className="flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 text-green-600 flex-shrink-0" />
                        <span className="text-[10px] font-medium text-gray-700">{profile.completed_shifts} shifts</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 border-teal-300 hover:bg-teal-50 h-8 text-[10px] font-semibold"
                  onClick={() => onViewFullProfile(selectedApp.pharmacist_email)}
                  disabled={!profile}
                >
                  <User className="w-3 h-3 mr-1" />
                  View Profile
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Professional Info Section */}
          {profile && (
            <Card className="border-0 shadow-sm bg-white rounded-xl">
              <CardContent className="p-0">
                <button
                  onClick={() => onToggleSection('professional')}
                  className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors rounded-t-xl"
                >
                  <div className="flex items-center gap-1.5">
                    <Briefcase className="w-4 h-4 text-teal-600" />
                    <h4 className="font-bold text-xs">Professional Info</h4>
                  </div>
                  {expandedSections.professional ? (
                    <ChevronUp className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  )}
                </button>
                
                {expandedSections.professional && (
                  <div className="px-3 pb-3 space-y-2">
                    {/* Contact & Skills Info */}
                    {profile.phone && (
                      <div className="flex items-start gap-1.5 p-2 bg-gray-50 rounded-lg">
                        <Phone className="w-3 h-3 text-gray-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-[9px] text-gray-500 font-medium mb-0.5">Phone</p>
                          <a href={`tel:${profile.phone}`} className="text-[10px] font-medium text-teal-600 hover:underline">
                            {profile.phone}
                          </a>
                        </div>
                      </div>
                    )}

                    {profile.software_experience?.length > 0 && (
                      <div className="mt-2">
                        <div className="flex items-center gap-1 mb-1.5">
                          <Monitor className="w-3 h-3 text-teal-600" />
                          <p className="text-[10px] font-bold text-gray-900">Software</p>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {profile.software_experience.map((software, idx) => (
                            <Badge key={idx} variant="outline" className="bg-teal-50 text-teal-700 border-teal-200 text-[9px] px-1.5 py-0.5">
                              {software}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {profile.bio && (
                      <div className="mt-2 p-2.5 bg-gray-50 rounded-lg">
                        <p className="text-[9px] text-gray-500 font-medium mb-1">Bio</p>
                        <p className="text-[10px] text-gray-700 leading-relaxed">{profile.bio}</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Shift Details Section */}
          {shift && (
            <Card className="border-0 shadow-sm bg-white rounded-xl">
              <CardContent className="p-0">
                <button
                  onClick={() => onToggleSection('shift')}
                  className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors rounded-t-xl"
                >
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-teal-600" />
                    <h4 className="font-bold text-xs">Shift Details</h4>
                    {shift.is_multi_date && shift.shift_dates?.length > 1 && (
                      <Badge className="bg-teal-600 text-white text-[9px] px-1.5 py-0.5 h-4">
                        {shift.shift_dates.length} Dates
                      </Badge>
                    )}
                  </div>
                  {expandedSections.shift ? (
                    <ChevronUp className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  )}
                </button>
                
                {expandedSections.shift && (
                  <div className="px-3 pb-3">
                    {shift.is_multi_date && shift.shift_dates?.length > 1 ? (
                      // Multi-date display
                      <div className="space-y-1.5">
                        {shift.shift_dates.map((dateInfo, idx) => (
                          <div key={idx} className="bg-teal-50 rounded-lg p-2 space-y-1">
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] text-gray-600 font-medium">Date {idx + 1}:</span>
                              <span className="font-medium text-gray-900 text-[10px]">{format(new Date(dateInfo.date), "MMM d, yyyy")}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] text-gray-600">Time:</span>
                              <span className="font-medium text-gray-900 text-[10px]">{formatTime12Hour(dateInfo.start_time)} - {formatTime12Hour(dateInfo.end_time)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] text-gray-600">Pay:</span>
                              <span className="font-bold text-green-600 text-[10px]">${dateInfo.total_pay}</span>
                            </div>
                          </div>
                        ))}
                        <div className="bg-gradient-to-r from-teal-600 to-cyan-600 rounded-lg p-2.5 mt-2">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] text-white font-semibold">Total All Dates:</span>
                            <span className="font-bold text-white text-base">${shift.total_pay}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      // Single date display
                      <div className="bg-teal-50 rounded-lg p-2.5 space-y-1.5">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] text-gray-600">Date:</span>
                          <span className="font-medium text-gray-900 text-[10px]">{format(new Date(shift.shift_date), "MMM d, yyyy")}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] text-gray-600">Time:</span>
                          <span className="font-medium text-gray-900 text-[10px]">{formatTime12Hour(shift.start_time)} - {formatTime12Hour(shift.end_time)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] text-gray-600">Duration:</span>
                          <span className="font-medium text-gray-900 text-[10px]">{shift.total_hours} hours</span>
                        </div>
                        <div className="flex justify-between items-center pt-1.5 border-t border-teal-200">
                          <span className="text-[10px] text-gray-600">Rate:</span>
                          <span className="font-bold text-green-600 text-xs">${shift.hourly_rate}/hr</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] text-gray-600">Total:</span>
                          <span className="font-bold text-green-600 text-sm">${shift.total_pay}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Payroll Preview Section */}
          <Card className="border-0 shadow-sm bg-white rounded-xl">
            <CardContent className="p-0">
              <button
                onClick={() => onToggleSection('payroll')}
                className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors rounded-t-xl"
              >
                <div className="flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-green-600" />
                  <h4 className="font-bold text-xs">Payroll Info</h4>
                </div>
                {expandedSections.payroll ? (
                  <ChevronUp className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </button>
              
              {expandedSections.payroll && (
                <div className="px-3 pb-3">
                  <PayrollPreview 
                    pharmacistId={profile?.id} 
                    shiftId={selectedApp.shift_id}
                    isAccepted={selectedApp.status === 'accepted'}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Application Message */}
          {selectedApp.cover_letter && (
            <Card className="border-0 shadow-sm bg-white rounded-xl">
              <CardContent className="p-0">
                <button
                  onClick={() => onToggleSection('message')}
                  className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors rounded-t-xl"
                >
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-4 h-4 text-teal-600" />
                    <h4 className="font-bold text-xs">Application Message</h4>
                  </div>
                  {expandedSections.message ? (
                    <ChevronUp className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  )}
                </button>
                
                {expandedSections.message && (
                  <div className="px-3 pb-3">
                    <div className="bg-gray-50 rounded-lg p-2.5">
                      <p className="text-[10px] text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {selectedApp.cover_letter}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Action Footer */}
        {selectedApp.status === "pending" && (
          <div className="border-t border-gray-200 p-3 bg-white shadow-lg sticky bottom-0">
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={onReject}
                disabled={isRejecting}
                className="flex-1 h-11 border-2 border-red-200 text-red-700 hover:bg-red-50 font-bold text-sm active:scale-[0.98] transition-transform"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Reject
              </Button>
              <Button
                onClick={onAccept}
                disabled={isAccepting}
                className="flex-1 h-11 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold text-sm shadow-md active:scale-[0.98] transition-transform"
              >
                {isAccepting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Accept Application
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}