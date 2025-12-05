import React from "react";
import { Card, CardContent } from "@/components/ui/card";

export default function ShiftCardSkeleton() {
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-4 animate-pulse">
        <div className="flex justify-between items-start mb-3 gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-4 h-4 bg-gray-200 rounded"></div>
              <div className="h-5 bg-gray-200 rounded w-3/4"></div>
            </div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
          <div className="h-6 w-20 bg-gray-200 rounded-full"></div>
        </div>
        
        <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-2/3 mb-3"></div>
        
        <div className="flex gap-2 mb-3">
          <div className="h-8 bg-gray-200 rounded w-24"></div>
          <div className="h-8 bg-gray-200 rounded w-24"></div>
        </div>
        
        <div className="h-10 bg-gray-200 rounded w-full"></div>
      </CardContent>
    </Card>
  );
}