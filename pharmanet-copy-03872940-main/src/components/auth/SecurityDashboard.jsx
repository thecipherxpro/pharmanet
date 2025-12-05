import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  User,
  Eye
} from "lucide-react";
import { securityLogger } from "./SecurityLogger";
import { getUserAccessiblePages, SECURITY_MATRIX } from "./SecurityMatrix";
import { base44 } from "@/api/base44Client";

/**
 * SECURITY DASHBOARD
 * Admin-only component to monitor security events and user access
 */
export default function SecurityDashboard() {
  const [user, setUser] = useState(null);
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({
    totalAccess: 0,
    deniedAccess: 0,
    uniqueUsers: new Set()
  });

  useEffect(() => {
    loadUser();
    loadLogs();
    
    // Refresh logs every 30 seconds
    const interval = setInterval(loadLogs, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadUser = async () => {
    const userData = await base44.auth.me();
    setUser(userData);
  };

  const loadLogs = () => {
    const recentLogs = securityLogger.getRecentLogs(50);
    setLogs(recentLogs);

    // Calculate stats
    const granted = recentLogs.filter(l => l.eventType === 'ACCESS_GRANTED').length;
    const denied = recentLogs.filter(l => l.eventType === 'ACCESS_DENIED').length;
    const users = new Set(recentLogs.map(l => l.userId).filter(Boolean));

    setStats({
      totalAccess: granted,
      deniedAccess: denied,
      uniqueUsers: users
    });
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="p-8 text-center">
        <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Admin Access Required</h2>
        <p className="text-gray-600">This dashboard is only accessible to administrators.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Security Dashboard</h1>
          <p className="text-gray-600 mt-1">Monitor access control and security events</p>
        </div>
        <button
          onClick={loadLogs}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Access Granted</p>
                <p className="text-3xl font-bold text-green-600">{stats.totalAccess}</p>
              </div>
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Access Denied</p>
                <p className="text-3xl font-bold text-red-600">{stats.deniedAccess}</p>
              </div>
              <AlertTriangle className="w-12 h-12 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Active Users</p>
                <p className="text-3xl font-bold text-blue-600">{stats.uniqueUsers.size}</p>
              </div>
              <User className="w-12 h-12 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Security Events */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Recent Security Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {logs.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No security events logged yet</p>
            ) : (
              logs.map((log, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    {log.eventType === 'ACCESS_GRANTED' ? (
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {log.pageName || 'Unknown Page'}
                      </p>
                      <p className="text-sm text-gray-600 truncate">
                        {log.userEmail || 'Anonymous'} - {log.reason}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="whitespace-nowrap">
                      {log.userType || 'N/A'}
                    </Badge>
                    <span className="text-xs text-gray-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Access Matrix */}
      <Card>
        <CardHeader>
          <CardTitle>Access Control Matrix</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-semibold">Page</th>
                  <th className="text-left p-3 font-semibold">Category</th>
                  <th className="text-left p-3 font-semibold">Allowed Types</th>
                  <th className="text-left p-3 font-semibold">Auth Required</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(SECURITY_MATRIX).map(([pageName, config]) => (
                  <tr key={pageName} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-medium">{pageName}</td>
                    <td className="p-3">
                      <Badge variant="outline">{config.category}</Badge>
                    </td>
                    <td className="p-3">
                      {config.allowedUserTypes.length === 0 ? (
                        <span className="text-gray-500">All</span>
                      ) : (
                        <div className="flex gap-1">
                          {config.allowedUserTypes.map(type => (
                            <Badge key={type} variant="secondary" className="text-xs">
                              {type}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="p-3">
                      {config.requireAuth ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}