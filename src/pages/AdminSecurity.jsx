import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Shield,
  AlertTriangle,
  Activity,
  Lock,
  Eye,
  Search,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle
} from "lucide-react";
import { AdminOnly } from "../components/auth/RouteProtection";
import { format } from "date-fns";

function AdminSecurityContent() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("recent");

  const { data: securityLogs = [], isLoading } = useQuery({
    queryKey: ['securityLogs'],
    queryFn: () => base44.entities.SecurityLog.list('-created_date', 100),
  });

  const { data: accessLogs = [] } = useQuery({
    queryKey: ['accessLogs'],
    queryFn: () => base44.entities.DataAccessControl.list('-timestamp', 100),
  });

  // Calculate security metrics
  const metrics = {
    totalEvents: securityLogs.length,
    criticalEvents: securityLogs.filter(l => l.severity === 'critical').length,
    highEvents: securityLogs.filter(l => l.severity === 'high').length,
    failedLogins: securityLogs.filter(l => l.event_type === 'failed_login').length,
    blockedAccess: securityLogs.filter(l => l.status === 'blocked').length,
    suspiciousActivity: securityLogs.filter(l => l.event_type === 'suspicious_activity').length
  };

  const filteredLogs = securityLogs.filter(log => {
    const searchLower = searchQuery.toLowerCase();
    return (
      log.user_email?.toLowerCase().includes(searchLower) ||
      log.event_type?.toLowerCase().includes(searchLower) ||
      log.details?.toLowerCase().includes(searchLower) ||
      log.ip_address?.toLowerCase().includes(searchLower)
    );
  });

  const recentLogs = filteredLogs.slice(0, 50);
  const criticalLogs = filteredLogs.filter(l => l.severity === 'critical' || l.severity === 'high');
  const failedAttempts = filteredLogs.filter(l => l.status === 'failure' || l.status === 'blocked');

  const displayLogs = activeTab === 'recent' ? recentLogs :
                     activeTab === 'critical' ? criticalLogs :
                     failedAttempts;

  const getSeverityColor = (severity) => {
    switch(severity) {
      case 'critical': return 'bg-red-100 text-red-700 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failure': return <XCircle className="w-4 h-4 text-red-600" />;
      case 'blocked': return <AlertCircle className="w-4 h-4 text-orange-600" />;
      default: return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-red-600 to-pink-600 text-white p-6 pb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Security Dashboard</h1>
            <p className="text-red-100 text-sm">Monitor system security events</p>
          </div>
        </div>

        {/* Security Metrics */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-4 h-4" />
              <p className="text-xs">Critical</p>
            </div>
            <p className="text-2xl font-bold">{metrics.criticalEvents}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Lock className="w-4 h-4" />
              <p className="text-xs">Blocked</p>
            </div>
            <p className="text-2xl font-bold">{metrics.blockedAccess}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Activity className="w-4 h-4" />
              <p className="text-xs">Events</p>
            </div>
            <p className="text-2xl font-bold">{metrics.totalEvents}</p>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="px-4 -mt-4 mb-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="Search security logs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12 bg-white shadow-lg"
          />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full bg-white shadow-lg grid grid-cols-3">
            <TabsTrigger value="recent">
              Recent ({recentLogs.length})
            </TabsTrigger>
            <TabsTrigger value="critical">
              Critical ({criticalLogs.length})
            </TabsTrigger>
            <TabsTrigger value="failed">
              Failed ({failedAttempts.length})
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Security Logs */}
      <div className="px-4 space-y-3">
        {isLoading ? (
          Array(5).fill(0).map((_, i) => (
            <div key={i} className="h-24 bg-white rounded-xl animate-pulse" />
          ))
        ) : displayLogs.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Shield className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">No security events found</h3>
              <p className="text-gray-600 text-sm">Try adjusting your search or filters</p>
            </CardContent>
          </Card>
        ) : (
          displayLogs.map((log) => (
            <Card key={log.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      {getStatusIcon(log.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-bold text-gray-900 text-sm">
                          {log.event_type?.replace('_', ' ').toUpperCase()}
                        </h3>
                        <Badge variant="outline" className={getSeverityColor(log.severity)}>
                          {log.severity}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 truncate">{log.user_email}</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                    {log.created_date ? format(new Date(log.created_date), 'MMM d, HH:mm') : ''}
                  </span>
                </div>

                {log.details && (
                  <div className="bg-gray-50 rounded-lg p-3 mb-3">
                    <p className="text-xs text-gray-700">{log.details}</p>
                  </div>
                )}

                <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                  {log.resource_type && (
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {log.resource_type}
                    </span>
                  )}
                  {log.action && (
                    <span className="px-2 py-1 bg-gray-100 rounded">
                      {log.action}
                    </span>
                  )}
                  {log.ip_address && (
                    <span className="px-2 py-1 bg-gray-100 rounded font-mono">
                      {log.ip_address}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Security Alerts */}
      {metrics.criticalEvents > 0 && (
        <div className="px-4 mt-4">
          <Card className="border-2 border-red-500 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-red-900 text-sm mb-1">Security Alert</h4>
                  <p className="text-xs text-red-800">
                    {metrics.criticalEvents} critical security event{metrics.criticalEvents !== 1 ? 's' : ''} detected. Review immediately.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default function AdminSecurity() {
  return (
    <AdminOnly>
      <AdminSecurityContent />
    </AdminOnly>
  );
}