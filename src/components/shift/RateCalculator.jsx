import React, { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Clock } from "lucide-react";

export const RateCalculator = {
  calculateRate: (daysAhead) => {
    let rate;
    let urgency;

    if (daysAhead === 0) {
      rate = 90;
      urgency = "emergency";
    } else if (daysAhead === 1) {
      rate = 65;
      urgency = "very_urgent";
    } else if (daysAhead === 2) {
      rate = 60;
      urgency = "urgent";
    } else if (daysAhead <= 4) {
      rate = 60 - ((daysAhead - 2) / 2);
      urgency = "short_notice";
    } else if (daysAhead <= 10) {
      rate = 59 - ((daysAhead - 5) / 5) * 3;
      urgency = "moderate";
    } else if (daysAhead <= 14) {
      rate = 55 - ((daysAhead - 11) / 3);
      urgency = "reasonable";
    } else {
      rate = 50;
      urgency = "planned";
    }

    return { rate: Math.round(rate * 100) / 100, urgency };
  },

  getUrgencyConfig: (urgency) => {
    const configs = {
      emergency: { label: "Emergency", color: "bg-red-50 text-red-700 border-red-200" },
      very_urgent: { label: "Very Urgent", color: "bg-orange-50 text-orange-700 border-orange-200" },
      urgent: { label: "Urgent", color: "bg-amber-50 text-amber-700 border-amber-200" },
      short_notice: { label: "Short Notice", color: "bg-yellow-50 text-yellow-700 border-yellow-200" },
      moderate: { label: "Moderate", color: "bg-blue-50 text-blue-700 border-blue-200" },
      reasonable: { label: "Reasonable", color: "bg-green-50 text-green-700 border-green-200" },
      planned: { label: "Well Planned", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    };
    return configs[urgency] || configs.moderate;
  }
};

export default function RateDisplay({ shiftDate, startTime, endTime }) {
  const { rate, urgency, totalHours, totalPay } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Safe date parsing - handle YYYY-MM-DD as local date
    let shift;
    if (typeof shiftDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(shiftDate)) {
      const [year, month, day] = shiftDate.split('-').map(Number);
      shift = new Date(year, month - 1, day);
    } else if (shiftDate instanceof Date) {
      shift = shiftDate;
    } else {
      shift = new Date(); // Fallback to today
    }
    
    // Validate date
    if (isNaN(shift.getTime())) {
      shift = new Date();
    }
    
    const daysAhead = Math.ceil((shift - today) / (1000 * 60 * 60 * 24));

    const { rate, urgency } = RateCalculator.calculateRate(daysAhead);

    const [startHour, startMin] = (startTime || '09:00').split(':').map(Number);
    const [endHour, endMin] = (endTime || '17:00').split(':').map(Number);
    const totalHours = (endHour + endMin / 60) - (startHour + startMin / 60);
    const totalPay = rate * totalHours;

    return { rate, urgency, totalHours, totalPay };
  }, [shiftDate, startTime, endTime]);

  const config = RateCalculator.getUrgencyConfig(urgency);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div>
          <p className="text-xs text-gray-600 mb-1 font-medium">Calculated Rate</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900">
              ${rate.toFixed(2)}
            </span>
            <span className="text-sm text-gray-600">/hr</span>
          </div>
        </div>

        <Badge variant="outline" className={`${config.color} border font-medium`}>
          {config.label}
        </Badge>
      </div>

      {totalHours > 0 && (
        <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="w-4 h-4" />
            <span className="font-medium">{totalHours.toFixed(1)} hours</span>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-gray-600" />
            <span className="font-semibold text-gray-900">
              ${totalPay.toFixed(2)} total
            </span>
          </div>
        </div>
      )}
    </div>
  );
}