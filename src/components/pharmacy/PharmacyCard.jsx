import React from 'react';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  User,
  Edit,
  Trash2,
  Monitor,
  CheckCircle,
  XCircle,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

function formatTime12Hour(time24) {
  if (!time24) return "";
  const [hours, minutes] = time24.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const hours12 = hours % 12 || 12;
  return `${hours12}:${minutes.toString().padStart(2, "0")} ${period}`;
}

const PharmacyCard = ({ pharmacy, onEdit, onDelete }) => {
  const isActive = pharmacy.is_active !== false;
  
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header with Status */}
      <div className={`p-4 ${isActive ? 'bg-blue-50' : 'bg-gray-100'}`}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${isActive ? 'bg-blue-600' : 'bg-gray-400'}`}>
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-gray-900 text-base truncate">{pharmacy.pharmacy_name}</h3>
              <p className="text-sm text-gray-600 truncate">{pharmacy.city}, {pharmacy.province}</p>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 flex-shrink-0 ml-2
            ${isActive ? 'bg-emerald-500 text-white' : 'bg-gray-300 text-gray-600'}`}>
            {isActive ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
            {isActive ? 'Active' : 'Inactive'}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Address */}
        <div className="flex items-start gap-2">
          <MapPin className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-900 break-words">{pharmacy.address}</p>
            <p className="text-xs text-gray-500">{pharmacy.postal_code}</p>
          </div>
        </div>

        {/* Phone */}
        {pharmacy.phone && (
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <p className="text-sm text-gray-600 break-all">{pharmacy.phone}</p>
          </div>
        )}

        {/* Email */}
        {pharmacy.email && (
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <p className="text-sm text-gray-600 truncate">{pharmacy.email}</p>
          </div>
        )}

        {/* Manager */}
        {pharmacy.manager_name && (
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <p className="text-sm text-gray-600">
              <span className="font-semibold">{pharmacy.manager_name}</span>
            </p>
          </div>
        )}

        {/* Software */}
        {pharmacy.software && (
          <div className="flex items-center gap-2">
            <Monitor className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <p className="text-sm text-gray-600">{pharmacy.software}</p>
          </div>
        )}

        {/* Business Hours Summary */}
        {pharmacy.business_hours && pharmacy.business_hours.length === 7 && (
          <div className="pt-2 border-t border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span className="text-xs font-semibold text-gray-700">Business Hours</span>
              <Badge variant="outline" className="text-[10px] bg-emerald-50 border-emerald-300 text-emerald-700 ml-auto">
                Configured
              </Badge>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {pharmacy.business_hours.map((day) => (
                <div 
                  key={day.day}
                  className={`text-center py-1 rounded text-[10px] font-medium ${
                    day.is_open 
                      ? 'bg-emerald-100 text-emerald-700' 
                      : 'bg-gray-100 text-gray-400'
                  }`}
                  title={day.is_open ? `${formatTime12Hour(day.open_time)} - ${formatTime12Hour(day.close_time)}` : 'Closed'}
                >
                  {day.day.slice(0, 2).toUpperCase()}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No Hours Set */}
        {(!pharmacy.business_hours || pharmacy.business_hours.length !== 7) && (
          <div className="pt-2 border-t border-gray-100">
            <div className="flex items-center gap-2 text-amber-600">
              <Clock className="w-4 h-4 flex-shrink-0" />
              <span className="text-xs">No business hours configured</span>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="p-3 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row gap-2">
        <button
          onClick={() => onEdit(pharmacy)}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          <Edit className="w-4 h-4" />
          Edit
        </button>
        <button
          onClick={() => onDelete(pharmacy)}
          className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          <Trash2 className="w-4 h-4" />
          Delete
        </button>
      </div>
    </div>
  );
};

export default PharmacyCard;