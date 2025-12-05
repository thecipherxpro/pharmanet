import React from "react";
import DashboardSkeleton from "./skeletons/DashboardSkeleton";
import ProfileSkeleton from "./skeletons/ProfileSkeleton";
import ListSkeleton from "./skeletons/ListSkeleton";
import CardGridSkeleton from "./skeletons/CardGridSkeleton";
import TableSkeleton from "./skeletons/TableSkeleton";

export default function LoadingScreen({ type = "default" }) {
  if (type === "dashboard") {
    return <DashboardSkeleton />;
  }

  if (type === "profile") {
    return <ProfileSkeleton />;
  }

  if (type === "list") {
    return <ListSkeleton />;
  }

  if (type === "cards") {
    return <CardGridSkeleton />;
  }

  if (type === "table") {
    return <TableSkeleton />;
  }

  // Default minimal loader
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="relative w-16 h-16 mx-auto mb-4">
          <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <p className="text-sm text-gray-600 font-medium animate-pulse">Loading...</p>
      </div>
    </div>
  );
}