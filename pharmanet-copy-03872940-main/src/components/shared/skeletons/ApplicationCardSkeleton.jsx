import React from "react";
import { Card, CardContent } from "@/components/ui/card";

export default function ApplicationCardSkeleton() {
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-4 animate-pulse">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-12 h-12 bg-gray-200 rounded-xl flex-shrink-0"></div>
          <div className="flex-1 min-w-0">
            <div className="h-5 bg-gray-200 rounded w-2/3 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
          <div className="h-6 w-16 bg-gray-200 rounded-full"></div>
        </div>
        
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="h-12 bg-gray-100 rounded-lg"></div>
          <div className="h-12 bg-gray-100 rounded-lg"></div>
        </div>
        
        <div className="h-10 bg-gray-200 rounded w-full"></div>
      </CardContent>
    </Card>
  );
}