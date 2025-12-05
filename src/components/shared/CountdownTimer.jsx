import React, { useState, useEffect } from "react";
import { Timer } from "lucide-react";

export default function CountdownTimer({ targetDate, label = "Back online in:", primaryColor = "#000000" }) {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  function calculateTimeLeft() {
    const difference = new Date(targetDate) - new Date();
    
    if (difference <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
    }

    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60),
      expired: false
    };
  }

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  if (timeLeft.expired) {
    return (
      <div className="text-center py-6">
        <p className="text-lg font-semibold" style={{ color: primaryColor }}>
          Maintenance complete! Refreshing...
        </p>
      </div>
    );
  }

  return (
    <div className="text-center py-6">
      <div className="flex items-center justify-center gap-2 mb-4">
        <Timer className="w-5 h-5" style={{ color: primaryColor }} />
        <p className="text-sm font-medium opacity-70" style={{ color: primaryColor }}>
          {label}
        </p>
      </div>
      
      <div className="flex items-center justify-center gap-3">
        {timeLeft.days > 0 && (
          <div className="text-center">
            <div 
              className="text-4xl md:text-5xl font-bold mb-1"
              style={{ color: primaryColor }}
            >
              {String(timeLeft.days).padStart(2, '0')}
            </div>
            <p className="text-xs uppercase tracking-wide opacity-60" style={{ color: primaryColor }}>
              Days
            </p>
          </div>
        )}
        
        <div className="text-center">
          <div 
            className="text-4xl md:text-5xl font-bold mb-1"
            style={{ color: primaryColor }}
          >
            {String(timeLeft.hours).padStart(2, '0')}
          </div>
          <p className="text-xs uppercase tracking-wide opacity-60" style={{ color: primaryColor }}>
            Hours
          </p>
        </div>
        
        <div 
          className="text-3xl md:text-4xl font-bold opacity-50 -mt-6"
          style={{ color: primaryColor }}
        >
          :
        </div>
        
        <div className="text-center">
          <div 
            className="text-4xl md:text-5xl font-bold mb-1"
            style={{ color: primaryColor }}
          >
            {String(timeLeft.minutes).padStart(2, '0')}
          </div>
          <p className="text-xs uppercase tracking-wide opacity-60" style={{ color: primaryColor }}>
            Minutes
          </p>
        </div>
        
        <div 
          className="text-3xl md:text-4xl font-bold opacity-50 -mt-6"
          style={{ color: primaryColor }}
        >
          :
        </div>
        
        <div className="text-center">
          <div 
            className="text-4xl md:text-5xl font-bold mb-1"
            style={{ color: primaryColor }}
          >
            {String(timeLeft.seconds).padStart(2, '0')}
          </div>
          <p className="text-xs uppercase tracking-wide opacity-60" style={{ color: primaryColor }}>
            Seconds
          </p>
        </div>
      </div>
    </div>
  );
}