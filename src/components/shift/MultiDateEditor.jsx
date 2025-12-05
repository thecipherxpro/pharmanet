import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, DollarSign, Trash2, Plus } from "lucide-react";
import { format } from "date-fns";
import TimePicker from "../ui/time-picker";

export default function MultiDateEditor({ dates, onChange, baseHourlyRate }) {
  const handleDateChange = (index, field, value) => {
    const updated = [...dates];
    updated[index] = { ...updated[index], [field]: value };
    
    // Recalculate total hours and pay if time changed
    if (field === 'start_time' || field === 'end_time') {
      const start = field === 'start_time' ? value : updated[index].start_time;
      const end = field === 'end_time' ? value : updated[index].end_time;
      
      if (start && end) {
        const [startHours, startMinutes] = start.split(':').map(Number);
        const [endHours, endMinutes] = end.split(':').map(Number);
        const totalMinutes = (endHours * 60 + endMinutes) - (startHours * 60 + startMinutes);
        const hours = totalMinutes / 60;
        
        updated[index].total_hours = hours;
        updated[index].total_pay = hours * (updated[index].hourly_rate || baseHourlyRate);
      }
    }
    
    onChange(updated);
  };

  const handleRemoveDate = (index) => {
    const updated = dates.filter((_, i) => i !== index);
    onChange(updated);
  };

  const handleAddDate = () => {
    const newDate = {
      date: "",
      start_time: "09:00",
      end_time: "17:00",
      status: "open",
      hourly_rate: baseHourlyRate,
      total_hours: 8,
      total_pay: 8 * baseHourlyRate
    };
    onChange([...dates, newDate]);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'filled': return 'bg-green-100 text-green-700 border-green-200';
      case 'completed': return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'cancelled': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="space-y-3">
      {dates.map((date, index) => (
        <Card key={index} className="border-gray-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <Badge className={`${getStatusColor(date.status)} border font-semibold text-xs`}>
                  {date.status}
                </Badge>
                <span className="text-xs font-medium text-gray-600">
                  Date {index + 1}
                </span>
              </div>
              {dates.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveDate(index)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>

            <div className="space-y-3">
              {/* Date */}
              <div>
                <Label className="text-xs text-gray-600 mb-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Date
                </Label>
                <Input
                  type="date"
                  value={date.date}
                  onChange={(e) => handleDateChange(index, 'date', e.target.value)}
                  className="h-10"
                  min={format(new Date(), 'yyyy-MM-dd')}
                />
              </div>

              {/* Times */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-gray-600 mb-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Start
                  </Label>
                  <TimePicker
                    value={date.start_time}
                    onChange={(val) => handleDateChange(index, 'start_time', val)}
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-600 mb-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    End
                  </Label>
                  <TimePicker
                    value={date.end_time}
                    onChange={(val) => handleDateChange(index, 'end_time', val)}
                  />
                </div>
              </div>

              {/* Rate & Pay */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-gray-600 mb-1 flex items-center gap-1">
                    <DollarSign className="w-3 h-3" />
                    Rate/hr
                  </Label>
                  <Input
                    type="number"
                    step="0.50"
                    value={date.hourly_rate || baseHourlyRate}
                    onChange={(e) => handleDateChange(index, 'hourly_rate', parseFloat(e.target.value))}
                    className="h-10"
                  />
                </div>
                <div className="bg-gray-50 rounded-lg p-2 border border-gray-200">
                  <p className="text-xs text-gray-600 mb-0.5">Total Pay</p>
                  <p className="text-lg font-bold text-gray-900">
                    ${(date.total_pay || 0).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      <Button
        onClick={handleAddDate}
        variant="outline"
        className="w-full h-11 border-dashed border-2 border-gray-300 hover:border-teal-400 hover:bg-teal-50"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Another Date
      </Button>
    </div>
  );
}