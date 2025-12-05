import React from "react";
import { Card, CardContent } from "@/components/ui/card";

export default function EmployerCardSkeleton() {
  return (
    <Card className="border-0 shadow-sm bg-white rounded-2xl overflow-hidden ring-1 ring-gray-200">
      <CardContent className="p-4 animate-pulse">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-12 h-12 bg-gray-200 rounded-xl flex-shrink-0"></div>
          <div className="flex-1 min-w-0">
            <div className="h-5 bg-gray-200 rounded w-2/3 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>

        <div className="h-12 bg-gray-100 rounded-lg mb-3"></div>

        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="bg-gray-50 rounded-lg p-2 h-14"></div>
          <div className="bg-gray-50 rounded-lg p-2 h-14"></div>
          <div className="bg-gray-50 rounded-lg p-2 h-14"></div>
        </div>

        <div className="h-8 bg-gray-200 rounded"></div>
      </CardContent>
    </Card>
  );
}