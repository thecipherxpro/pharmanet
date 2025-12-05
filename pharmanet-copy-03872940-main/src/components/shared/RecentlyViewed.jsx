import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, DollarSign, Building2, Calendar } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function RecentlyViewed({ items, type, onItemClick }) {
  const navigate = useNavigate();

  if (!items || items.length === 0) return null;

  const handleClick = (item) => {
    if (onItemClick) {
      onItemClick(item);
      return;
    }

    if (type === 'shift') {
      navigate(createPageUrl("BrowseShifts") + `?openShift=${item.id}`);
    } else if (type === 'pharmacist') {
      navigate(createPageUrl("PublicProfile") + `?id=${item.id}`);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
          <Clock className="w-4 h-4 text-gray-500" />
          Recently Viewed
        </h3>
        <p className="text-xs text-gray-500">{items.length} item{items.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="space-y-2">
        {items.slice(0, 5).map((item) => (
          <Card
            key={item.id}
            onClick={() => handleClick(item)}
            className="cursor-pointer hover:shadow-md transition-all border-gray-200"
          >
            <CardContent className="p-3">
              {type === 'shift' ? (
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Building2 className="w-4 h-4 text-teal-600 flex-shrink-0" />
                      <p className="font-semibold text-sm text-gray-900 truncate">
                        {item.pharmacy_name}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{(() => {
                          try {
                            const d = new Date(item.shift_date);
                            if (isNaN(d.getTime())) return "N/A";
                            return format(d, "MMM d");
                          } catch (e) {
                            return "N/A";
                          }
                        })()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        <span>{item.pharmacy_city}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <Badge variant="outline" className="text-xs font-semibold">
                      ${item.hourly_rate}/hr
                    </Badge>
                    <p className="text-[10px] text-gray-500 mt-1">
                      {formatDistanceToNow(new Date(item.viewedAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center text-white font-bold text-sm">
                      {item.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'P'}
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-gray-900">
                        {item.full_name}
                      </p>
                      <p className="text-xs text-gray-600">
                        {item.years_experience}+ years exp
                      </p>
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-500">
                    {formatDistanceToNow(new Date(item.viewedAt), { addSuffix: true })}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}