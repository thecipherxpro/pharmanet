import React from "react";
import { Skeleton, SkeletonCard } from "../Skeleton";

export default function TableSkeleton({ rows = 8 }) {
  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white px-3 py-3 border-b border-gray-100 sticky top-0 z-40">
        <div className="flex items-center justify-between mb-3">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="flex-1 h-10 rounded-xl" />
          <Skeleton className="w-10 h-10 rounded-xl" />
        </div>
      </div>

      <div className="px-3 pt-4">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonCard key={i} className="p-3">
              <Skeleton className="h-3 w-16 mb-2" />
              <Skeleton className="h-6 w-12 mb-1" />
              <Skeleton className="h-3 w-20" />
            </SkeletonCard>
          ))}
        </div>

        {/* Table */}
        <SkeletonCard className="p-4">
          {/* Table Header */}
          <div className="grid grid-cols-4 gap-4 pb-3 border-b border-gray-200 mb-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-4 w-20" />
            ))}
          </div>

          {/* Table Rows */}
          <div className="space-y-3">
            {Array.from({ length: rows }).map((_, i) => (
              <div key={i} className="grid grid-cols-4 gap-4 items-center">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-8 w-20 rounded-lg" />
              </div>
            ))}
          </div>
        </SkeletonCard>
      </div>
    </div>
  );
}