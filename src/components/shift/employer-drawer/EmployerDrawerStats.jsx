import React from "react";
import { Users, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function EmployerDrawerStats({ applications = [], onViewApplications }) {
  const pendingCount = applications.filter(a => a.status === 'pending').length;
  const acceptedCount = applications.filter(a => a.status === 'accepted').length;

  return (
    <Card className="border border-blue-100 bg-blue-50/50 shadow-none">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <Users className="w-4 h-4 text-blue-600" />
            </div>
            <span className="font-semibold text-sm text-gray-900">Applications</span>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={onViewApplications}
            className="h-8 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-100"
          >
            View All
            <ExternalLink className="w-3 h-3 ml-1.5" />
          </Button>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-xl p-3 text-center border border-blue-100 shadow-sm">
            <p className="text-2xl font-bold text-blue-600 leading-none mb-1">{pendingCount}</p>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Pending</p>
          </div>
          <div className="bg-white rounded-xl p-3 text-center border border-green-100 shadow-sm">
            <p className="text-2xl font-bold text-green-600 leading-none mb-1">{acceptedCount}</p>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Accepted</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}