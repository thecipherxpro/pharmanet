import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, MapPin, Monitor, CheckCircle2, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

function formatTime12Hour(time24) {
  if (!time24) return "";
  const [hours, minutes] = time24.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const hours12 = hours % 12 || 12;
  return `${hours12}:${minutes.toString().padStart(2, "0")} ${period}`;
}

function getBusinessHoursSummary(businessHours) {
  if (!businessHours || businessHours.length !== 7) return null;
  
  const openDays = businessHours.filter(h => h.is_open);
  if (openDays.length === 0) return "Closed";
  
  // Check if all open days have same hours
  const firstOpen = openDays[0];
  const allSameHours = openDays.every(h => 
    h.open_time === firstOpen.open_time && h.close_time === firstOpen.close_time
  );
  
  if (allSameHours) {
    return `${formatTime12Hour(firstOpen.open_time)} - ${formatTime12Hour(firstOpen.close_time)}`;
  }
  
  return `${openDays.length} days/week`;
}

export default function SelectPharmacyStep({ formData, updateFormData, pharmacies }) {
  if (!pharmacies || pharmacies.length === 0) {
    return (
      <Card className="border-dashed border-2">
        <CardContent className="p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No Pharmacies Found
          </h3>
          <p className="text-gray-600 mb-6">
            Add a pharmacy location before posting shifts
          </p>
          <Link to={createPageUrl("Pharmacies")}>
            <button className="bg-gray-900 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors">
              Add Pharmacy
            </button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="mb-4 sm:mb-6">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">Select Pharmacy</h2>
        <p className="text-sm text-gray-600">Choose the location for your shift</p>
      </div>

      {pharmacies.map((pharmacy) => (
        <Card
          key={pharmacy.id}
          onClick={() => updateFormData('pharmacy', pharmacy)}
          className={`cursor-pointer transition-all active:scale-98 ${
            formData.pharmacy?.id === pharmacy.id
              ? 'border-2 border-teal-600 bg-teal-50 shadow-md'
              : 'border-2 border-gray-200 hover:border-teal-300 hover:shadow-md'
          }`}
        >
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
                formData.pharmacy?.id === pharmacy.id ? 'bg-teal-600 shadow-lg' : 'bg-gray-100'
              }`}>
                <Building2 className={`w-6 h-6 sm:w-7 sm:h-7 ${
                  formData.pharmacy?.id === pharmacy.id ? 'text-white' : 'text-gray-600'
                }`} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-bold text-gray-900 text-base sm:text-lg">
                    {pharmacy.pharmacy_name}
                  </h3>
                  {formData.pharmacy?.id === pharmacy.id && (
                    <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-teal-600 flex-shrink-0" />
                  )}
                </div>

                <div className="space-y-1.5 sm:space-y-2 min-w-0">
                  <div className="flex items-start gap-2 text-xs sm:text-sm text-gray-600">
                    <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0 mt-0.5" />
                    <span className="break-words">{pharmacy.address}, {pharmacy.city}</span>
                  </div>

                  {pharmacy.software && (
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                      <Monitor className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                      <span className="truncate">{pharmacy.software}</span>
                    </div>
                  )}

                  {/* Business Hours Summary */}
                  {pharmacy.business_hours && pharmacy.business_hours.length === 7 && (
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                      <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                      <span className="truncate">{getBusinessHoursSummary(pharmacy.business_hours)}</span>
                      <Badge variant="outline" className="text-[10px] bg-emerald-50 border-emerald-300 text-emerald-700 ml-1">
                        Hours Set
                      </Badge>
                    </div>
                  )}

                  {/* No Hours Set Warning */}
                  {(!pharmacy.business_hours || pharmacy.business_hours.length !== 7) && (
                    <div className="flex items-center gap-2 text-xs text-amber-600">
                      <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>No business hours set</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}