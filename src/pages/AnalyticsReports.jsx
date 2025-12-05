import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { EmployerOnly } from "../components/auth/RouteProtection"; // Changed import
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  TrendingUp, 
  DollarSign, 
  Calendar,
  Clock,
  BarChart3,
  PieChart
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  startOfMonth, 
  endOfMonth, 
  format,
  subMonths,
  eachMonthOfInterval
} from "date-fns";

function AnalyticsReportsContent() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const userData = await base44.auth.me();
    setUser(userData);
  };

  const { data: shifts, isLoading } = useQuery({
    queryKey: ['analyticsShifts', user?.email],
    queryFn: () => base44.entities.Shift.filter({ created_by: user?.email }, "-created_date"),
    enabled: !!user,
    initialData: [],
  });

  // Calculate metrics
  const totalShifts = shifts.length;
  const totalSpend = shifts.reduce((sum, s) => sum + (s.total_pay || 0), 0);
  const avgRate = shifts.length > 0 
    ? shifts.reduce((sum, s) => sum + (s.hourly_rate || 0), 0) / shifts.length 
    : 0;
  const totalHours = shifts.reduce((sum, s) => sum + (s.total_hours || 0), 0);

  // This month
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const thisMonthShifts = shifts.filter(s => {
    const date = new Date(s.shift_date);
    return date >= monthStart && date <= monthEnd;
  });
  const thisMonthSpend = thisMonthShifts.reduce((sum, s) => sum + (s.total_pay || 0), 0);

  // Last 6 months data
  const last6Months = eachMonthOfInterval({
    start: subMonths(now, 5),
    end: now
  });

  const monthlyData = last6Months.map(month => {
    const monthShifts = shifts.filter(s => {
      const date = new Date(s.shift_date);
      return date.getMonth() === month.getMonth() && 
             date.getFullYear() === month.getFullYear();
    });
    return {
      month: format(month, "MMM"),
      shifts: monthShifts.length,
      spend: monthShifts.reduce((sum, s) => sum + (s.total_pay || 0), 0)
    };
  });

  // Status breakdown
  const statusBreakdown = {
    open: shifts.filter(s => s.status === "open").length,
    filled: shifts.filter(s => s.status === "filled").length,
    completed: shifts.filter(s => s.status === "completed").length,
  };

  // Urgency breakdown
  const urgencyBreakdown = shifts.reduce((acc, shift) => {
    acc[shift.urgency_level] = (acc[shift.urgency_level] || 0) + 1;
    return acc;
  }, {});

  const urgencyLabels = {
    emergency: "🚨 Emergency",
    very_urgent: "⚡ Very Urgent",
    urgent: "🔥 Urgent",
    short_notice: "⏰ Short Notice",
    moderate: "📋 Moderate",
    reasonable: "✓ Reasonable",
    planned: "📅 Planned"
  };

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="pb-8 md:pb-0">
      {/* ============ DESKTOP LAYOUT ============ */}
      <div className="hidden md:block min-h-screen bg-gray-50">
        {/* Desktop Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6 py-5">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Analytics & Reports</h1>
              <p className="text-sm text-gray-500 mt-1">Track your shift management metrics</p>
            </div>
          </div>
        </div>

        {/* Desktop Content */}
        <div className="max-w-7xl mx-auto px-6 py-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <Card className="shadow-sm border-gray-200">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 font-medium mb-1">Total Shifts</p>
                    <p className="text-3xl font-bold text-gray-900">{totalShifts}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-gray-200">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 font-medium mb-1">Total Spend</p>
                    <p className="text-3xl font-bold text-green-600">${totalSpend.toFixed(0)}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-gray-200">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 font-medium mb-1">Avg Rate</p>
                    <p className="text-3xl font-bold text-purple-600">${avgRate.toFixed(0)}/hr</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-gray-200">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 font-medium mb-1">Total Hours</p>
                    <p className="text-3xl font-bold text-orange-600">{totalHours.toFixed(0)}h</p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                    <Clock className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Desktop Grid Layout */}
          <div className="grid grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* This Month */}
              <Card className="shadow-sm border-gray-200">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-blue-600" />
                    This Month
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 rounded-lg p-4 text-center">
                      <p className="text-sm text-gray-600 mb-1">Shifts</p>
                      <p className="text-3xl font-bold text-blue-600">{thisMonthShifts.length}</p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-4 text-center">
                      <p className="text-sm text-gray-600 mb-1">Spending</p>
                      <p className="text-3xl font-bold text-blue-600">${thisMonthSpend.toFixed(0)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Status Breakdown */}
              <Card className="shadow-sm border-gray-200">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-purple-600" />
                    Shift Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                      <span className="font-medium text-yellow-900">Open</span>
                      <span className="text-2xl font-bold text-yellow-700">{statusBreakdown.open}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <span className="font-medium text-blue-900">Filled</span>
                      <span className="text-2xl font-bold text-blue-700">{statusBreakdown.filled}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <span className="font-medium text-green-900">Completed</span>
                      <span className="text-2xl font-bold text-green-700">{statusBreakdown.completed}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Monthly Trend */}
              <Card className="shadow-sm border-gray-200">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    6-Month Trend
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {monthlyData.map((month, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <span className="text-sm font-medium w-12">{month.month}</span>
                        <div className="flex-1 mx-3">
                          <div className="h-8 bg-gray-100 rounded-lg overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-end pr-2 text-white text-xs font-medium"
                              style={{ width: `${Math.max(5, (month.spend / Math.max(...monthlyData.map(m => m.spend)) * 100))}%` }}
                            >
                              {month.shifts > 0 && `${month.shifts}`}
                            </div>
                          </div>
                        </div>
                        <span className="text-sm font-bold text-green-600 w-20 text-right">${month.spend.toFixed(0)}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Urgency Distribution */}
              <Card className="shadow-sm border-gray-200">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="w-5 h-5 text-orange-600" />
                    Urgency Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(urgencyBreakdown)
                      .sort((a, b) => b[1] - a[1])
                      .map(([level, count]) => (
                        <div key={level} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                          <span className="text-sm">{urgencyLabels[level] || level}</span>
                          <span className="font-bold text-gray-700">{count}</span>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* ============ MOBILE LAYOUT ============ */}
      <div className="md:hidden">
      {/* Header */}
      <div className="bg-gradient-to-br from-orange-600 to-red-600 text-white p-6 pb-8">
        <h1 className="text-2xl font-bold mb-2">Analytics & Reports</h1>
        <p className="text-orange-100">Track your shift management metrics</p>
      </div>

      <div className="px-4 space-y-4 -mt-4">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                <span className="text-sm text-gray-600">Total Shifts</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">{totalShifts}</p>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                <span className="text-sm text-gray-600">Total Spend</span>
              </div>
              <p className="text-3xl font-bold text-green-600">
                ${totalSpend.toFixed(0)}
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                <span className="text-sm text-gray-600">Avg Rate</span>
              </div>
              <p className="text-3xl font-bold text-purple-600">
                ${avgRate.toFixed(0)}/hr
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-orange-600" />
                <span className="text-sm text-gray-600">Total Hours</span>
              </div>
              <p className="text-3xl font-bold text-orange-600">
                {totalHours.toFixed(0)}h
              </p>
            </CardContent>
          </Card>
        </div>

        {/* This Month */}
        <Card className="shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Shifts</p>
                <p className="text-2xl font-bold text-blue-600">
                  {thisMonthShifts.length}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Spending</p>
                <p className="text-2xl font-bold text-blue-600">
                  ${thisMonthSpend.toFixed(0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Trend */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              6-Month Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {monthlyData.map((month, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <span className="text-sm font-medium w-12">{month.month}</span>
                  <div className="flex-1 mx-3">
                    <div className="h-8 bg-gray-100 rounded-lg overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-end pr-2 text-white text-xs font-medium"
                        style={{ 
                          width: `${Math.max(5, (month.spend / Math.max(...monthlyData.map(m => m.spend)) * 100))}%` 
                        }}
                      >
                        {month.shifts > 0 && `${month.shifts}`}
                      </div>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-green-600 w-20 text-right">
                    ${month.spend.toFixed(0)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Status Breakdown */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <PieChart className="w-5 h-5 text-purple-600" />
              Shift Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <span className="font-medium text-yellow-900">Open</span>
                <span className="text-2xl font-bold text-yellow-700">
                  {statusBreakdown.open}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <span className="font-medium text-blue-900">Filled</span>
                <span className="text-2xl font-bold text-blue-700">
                  {statusBreakdown.filled}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <span className="font-medium text-green-900">Completed</span>
                <span className="text-2xl font-bold text-green-700">
                  {statusBreakdown.completed}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Urgency Distribution */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-600" />
              Urgency Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(urgencyBreakdown)
                .sort((a, b) => b[1] - a[1])
                .map(([level, count]) => (
                  <div key={level} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <span className="text-sm">{urgencyLabels[level] || level}</span>
                    <span className="font-bold text-gray-700">{count}</span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
      </div>
    </div>
  );
}

export default function AnalyticsReports() {
  return (
    <EmployerOnly> {/* Replaced RoleProtection with EmployerOnly */}
      <AnalyticsReportsContent />
    </EmployerOnly>
  );
}