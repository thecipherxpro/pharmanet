import React from "react";
import { MapPin, Phone, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function EmployerDrawerPharmacy({ pharmacy }) {
  if (!pharmacy) return null;

  const handleDirections = () => {
    const query = `${pharmacy.address}, ${pharmacy.city}, ${pharmacy.province}`;
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`, '_blank');
  };

  return (
    <Card className="border-0 shadow-sm ring-1 ring-gray-100">
      <CardContent className="p-0">
        {/* Map Placeholder / Header */}
        <div className="bg-gray-100 h-24 relative flex items-center justify-center border-b border-gray-100">
          <MapPin className="w-8 h-8 text-gray-300" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/5" />
        </div>
        
        <div className="p-4">
          <h3 className="font-bold text-gray-900 text-base mb-1">{pharmacy.pharmacy_name}</h3>
          <p className="text-sm text-gray-500 mb-4 flex items-start gap-1.5">
            <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
            {pharmacy.address}, {pharmacy.city}, {pharmacy.province} {pharmacy.postal_code}
          </p>

          <div className="grid grid-cols-2 gap-3">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleDirections}
              className="w-full h-9 gap-2 text-blue-600 border-blue-100 hover:bg-blue-50"
            >
              <Navigation className="w-3.5 h-3.5" />
              Directions
            </Button>
            {pharmacy.phone && (
              <Button 
                variant="outline"
                size="sm"
                asChild
                className="w-full h-9 gap-2 text-green-600 border-green-100 hover:bg-green-50"
              >
                <a href={`tel:${pharmacy.phone}`}>
                  <Phone className="w-3.5 h-3.5" />
                  Call
                </a>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}