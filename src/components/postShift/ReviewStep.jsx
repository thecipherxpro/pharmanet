import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Calendar, Clock, DollarSign, FileText, CheckCircle2, Shield } from "lucide-react";
import { format } from "date-fns";
import { formatTime12Hour } from "../utils/timeUtils";

const RateCalculator = {
  calculateRate: (daysAhead) => {
    let rate, urgency;
    if (daysAhead === 0) { rate = 90; urgency = "emergency"; }
    else if (daysAhead === 1) { rate = 65; urgency = "very_urgent"; }
    else if (daysAhead === 2) { rate = 60; urgency = "urgent"; }
    else if (daysAhead <= 4) { rate = 60 - ((daysAhead - 2) / 2); urgency = "short_notice"; }
    else if (daysAhead <= 10) { rate = 59 - ((daysAhead - 5) / 5) * 3; urgency = "moderate"; }
    else if (daysAhead <= 14) { rate = 55 - ((daysAhead - 11) / 3); urgency = "reasonable"; }
    else { rate = 50; urgency = "planned"; }
    return { rate: Math.round(rate * 100) / 100, urgency };
  }
};

export default function ReviewStep({ formData }) {
  const schedule = formData?.schedule || [];

  const getDynamicMinRate = (dateString) => {
    if (!dateString) return 50;
    const [year, month, day] = dateString.split('-').map(Number);
    const shiftDate = new Date(year, month - 1, day);
    shiftDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const daysAhead = Math.ceil((shiftDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return RateCalculator.calculateRate(daysAhead).rate;
  };

  const calculateTotalPay = () => {
    let total = 0;
    schedule.forEach(item => {
      if (!item.date) return;
      const dynamicMin = getDynamicMinRate(item.date);
      const rate = item.is_manual_rate && item.hourly_rate >= dynamicMin ? item.hourly_rate : dynamicMin;
      const [startH, startM] = (item.start_time || "09:00").split(':').map(Number);
      const [endH, endM] = (item.end_time || "17:00").split(':').map(Number);
      const hours = (endH + endM / 60) - (startH + startM / 60);
      total += rate * hours;
    });
    return total;
  };

  const shiftTypeLabels = { temporary: "Temporary", permanent: "Permanent", shift_relief: "Shift Relief", urgent: "Urgent" };

  return (
    <div className="space-y-4">
      <div className="mb-4 sm:mb-6">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">Review & Confirm</h2>
        <p className="text-sm text-gray-600">Double-check everything looks good</p>
      </div>

      {formData.pharmacy && (
        <Card className="border-2 border-gray-200">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center gap-2 sm:gap-3 mb-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center"><Building2 className="w-4 h-4 text-blue-600" /></div>
              <h3 className="font-bold text-gray-900 text-sm sm:text-base">Pharmacy</h3>
            </div>
            <div className="pl-0 sm:pl-10 min-w-0">
              <p className="font-semibold text-gray-900 text-sm sm:text-base break-words">{formData.pharmacy.pharmacy_name}</p>
              <p className="text-xs sm:text-sm text-gray-600 mt-1 break-words">{formData.pharmacy.address}, {formData.pharmacy.city}</p>
              {formData.pharmacy.software && <Badge variant="outline" className="mt-2 text-[10px] sm:text-xs inline-block">{formData.pharmacy.software}</Badge>}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-2 border-gray-200">
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-center gap-2 sm:gap-3 mb-3">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center"><FileText className="w-4 h-4 text-purple-600" /></div>
            <h3 className="font-bold text-gray-900 text-sm sm:text-base">Shift Information</h3>
          </div>
          <div className="pl-0 sm:pl-10 space-y-3 min-w-0">
            <div><p className="text-[10px] sm:text-xs text-gray-500 font-medium uppercase tracking-wide">Title</p><p className="font-semibold text-gray-900 text-sm sm:text-base mt-0.5 break-words">{formData.title}</p></div>
            <div><p className="text-[10px] sm:text-xs text-gray-500 font-medium uppercase tracking-wide">Description</p><p className="text-xs sm:text-sm text-gray-700 mt-0.5 leading-relaxed break-words">{formData.description}</p></div>
            <div><p className="text-[10px] sm:text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Type</p><Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-300 text-xs">{shiftTypeLabels[formData.shiftType]}</Badge></div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-2 border-gray-200">
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-center gap-2 sm:gap-3 mb-3">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center"><Calendar className="w-4 h-4 text-green-600" /></div>
            <h3 className="font-bold text-gray-900 text-sm sm:text-base">Schedule ({schedule.length} shift{schedule.length > 1 ? 's' : ''})</h3>
          </div>
          <div className="pl-0 sm:pl-10 space-y-2 sm:space-y-3">
            {schedule.map((item, index) => {
              if (!item.date) return null;
              const [year, month, day] = item.date.split('-').map(Number);
              const shiftDate = new Date(year, month - 1, day);
              const dynamicMin = getDynamicMinRate(item.date);
              const rate = item.is_manual_rate && item.hourly_rate >= dynamicMin ? item.hourly_rate : dynamicMin;
              const [startH, startM] = (item.start_time || "09:00").split(':').map(Number);
              const [endH, endM] = (item.end_time || "17:00").split(':').map(Number);
              const hours = (endH + endM / 60) - (startH + startM / 60);

              return (
                <div key={index} className={`flex items-center justify-between p-3 sm:p-4 rounded-lg border ${item.is_manual_rate ? 'bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200' : 'bg-gradient-to-r from-gray-50 to-green-50 border-gray-200'}`}>
                  <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center border border-gray-200 flex-shrink-0"><Clock className="w-3.5 h-3.5 text-gray-600" /></div>
                    <div className="min-w-0">
                      <p className="font-bold text-sm sm:text-base text-gray-900">{format(shiftDate, "MMM d, yyyy")}</p>
                      <p className="text-[10px] sm:text-xs text-gray-600">{formatTime12Hour(item.start_time)} - {formatTime12Hour(item.end_time)} <span className="text-gray-400">·</span> {hours.toFixed(1)}h</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`font-bold text-sm sm:text-base ${item.is_manual_rate ? 'text-purple-700' : 'text-green-700'}`}>${rate.toFixed(2)}/hr</p>
                    <p className="text-[10px] sm:text-xs text-gray-600">${(rate * hours).toFixed(2)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {Object.values(formData.shiftIncludes).some(v => v) && (
        <Card className="border-2 border-gray-200">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center gap-2 sm:gap-3 mb-3">
              <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center"><CheckCircle2 className="w-4 h-4 text-teal-600" /></div>
              <h3 className="font-bold text-gray-900 text-sm sm:text-base">Shift Includes</h3>
            </div>
            <div className="pl-0 sm:pl-10 flex flex-wrap gap-1.5 sm:gap-2">
              {formData.shiftIncludes.assistant_on_site && <Badge variant="outline" className="text-xs bg-teal-50 border-teal-300 text-teal-700">Assistant On Site</Badge>}
              {formData.shiftIncludes.vaccination_injections && <Badge variant="outline" className="text-xs bg-teal-50 border-teal-300 text-teal-700">Vaccinations</Badge>}
              {formData.shiftIncludes.addiction_dispensing && <Badge variant="outline" className="text-xs bg-teal-50 border-teal-300 text-teal-700">Addiction Meds</Badge>}
              {formData.shiftIncludes.methadone_suboxone && <Badge variant="outline" className="text-xs bg-teal-50 border-teal-300 text-teal-700">Methadone/Suboxone</Badge>}
            </div>
          </CardContent>
        </Card>
      )}

      {(formData.requirements.years_experience > 0 || formData.requirements.software_experience?.length > 0) && (
        <Card className="border-2 border-gray-200">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center gap-2 sm:gap-3 mb-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center"><Shield className="w-4 h-4 text-blue-600" /></div>
              <h3 className="font-bold text-gray-900 text-sm sm:text-base">Requirements</h3>
            </div>
            <div className="pl-0 sm:pl-10 space-y-2">
              {formData.requirements.years_experience > 0 && <p className="text-xs sm:text-sm font-medium text-gray-700">Minimum {formData.requirements.years_experience} year{formData.requirements.years_experience > 1 ? 's' : ''} experience</p>}
              {formData.requirements.software_experience?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-2">
                  {formData.requirements.software_experience.map(software => <Badge key={software} variant="outline" className="text-xs bg-blue-50 border-blue-300 text-blue-700">{software}</Badge>)}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-2 shadow-lg bg-gradient-to-br from-teal-50 to-cyan-50 border-teal-600">
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center bg-teal-600"><DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-white" /></div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm sm:text-base">Total Payout</h3>
                <p className="text-xs text-gray-600">{schedule.length} shift{schedule.length > 1 ? 's' : ''}</p>
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-teal-700">${calculateTotalPay().toFixed(2)}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}