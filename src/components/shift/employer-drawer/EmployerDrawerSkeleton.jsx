import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function EmployerDrawerSkeleton() {
  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header Skeleton */}
      <div className="px-4 py-3 border-b border-gray-200 flex items-center gap-3">
        <Skeleton className="w-9 h-9 rounded-full" />
        <div className="flex-1">
          <Skeleton className="h-5 w-32 mb-1.5" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton className="w-8 h-8 rounded-full" />
      </div>

      <div className="p-4 space-y-4 flex-1">
        {/* Stats Skeleton */}
        <Skeleton className="h-32 w-full rounded-xl" />
        
        {/* Shift Info Skeleton */}
        <div className="space-y-4">
          <Skeleton className="h-24 w-full rounded-xl" />
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-16 rounded-xl" />
            <Skeleton className="h-16 rounded-xl" />
          </div>
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      </div>

      {/* Footer Skeleton */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex gap-3">
          <Skeleton className="h-12 flex-1 rounded-xl" />
          <Skeleton className="h-12 flex-1 rounded-xl" />
        </div>
      </div>
    </div>
  );
}