import React from "react";
import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";
import { createPageUrl } from "@/utils";
import { formatTime12Hour, safeFormat } from "../utils/timeUtils";
import { getScheduleFromShift } from "../utils/shiftUtils";

/**
 * WhatsApp Share Button
 * Generates a WhatsApp sharing link for a shift pointing to the PublicShift page
 */
export default function WhatsAppShareButton({ shift, className }) {
  if (!shift) return null;

  const handleShare = (e) => {
    e?.stopPropagation();
    
    const schedule = getScheduleFromShift(shift);
    
    // Construct the Public URL
    const publicUrl = `https://shifts.pharmanet.ca/PublicShift?id=${shift.id}`;
    
    let scheduleText = "Shift Dates :";
    if (schedule.length > 0) {
      scheduleText += schedule.map(s => {
        const d = safeFormat(s.date, "EEE, MMM d", 'TBD');
        const t = s.start_time && s.end_time 
          ? `${formatTime12Hour(s.start_time)} - ${formatTime12Hour(s.end_time)}`
          : 'Time TBD';
        return `\n\n→ ${d}\n[${t}]`;
      }).join("");
    } else {
       scheduleText += "\nDate TBD";
    }
    
    const message = `🏥 *Shift Available*\n\n📍 ${shift.pharmacy_name}\n🏙️ ${shift.pharmacy_city}\n\n📋 *${shift.title || 'Shift Details'}*\n📝 ${shift.description || 'No description provided'}\n\n${scheduleText}\n\nTo View Hourly Rates, More Details & Apply, Click Here --> ${publicUrl}`;
    
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <button
      onClick={handleShare}
      className={`h-8 w-8 rounded-lg bg-green-500 hover:bg-green-600 flex items-center justify-center transition-colors ${className}`}
      title="Share on WhatsApp"
    >
      <Share2 className="w-3.5 h-3.5 text-white" />
    </button>
  );
}