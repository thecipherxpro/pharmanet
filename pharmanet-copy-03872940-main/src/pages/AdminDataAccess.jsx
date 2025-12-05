import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Shield,
  Search,
  Eye,
  Lock,
  CheckCircle,
  XCircle,
  Database,
  User,
  Calendar,
  Filter,
  TrendingUp,
  AlertTriangle,
  FileText,
  Activity
} from "lucide-react";
import { AdminOnly } from "../components/auth/RouteProtection";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

function AdminDataAccessContent() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [resourceFilter, setResourceFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");
  const [selectedAccess, setSelectedAccess] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  const { data: accessLogs = [], isLoading } = useQuery({
    queryKey: ['dataAccessControl'],
    queryFn: () => base44.entities.DataAccessControl.list('-timestamp', 500),
  });

  const { data: users = [] } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: () => base44.entities.User.list(),
  });

  // Calculate statistics
  const stats = {
    totalAccess: accessLogs.length,
    granted: accessLogs.filter(l => l.granted).length,
    denied: accessLogs.filter(l => !l.granted).length,
    uniqueUsers: [...new Set(accessLogs.map(l => l.user_id))].length,
    
    // By resource type
    shiftAccess: accessLogs.filter(l => l.resource_type === 'Shift').length,
    applicationAccess: accessLogs.filter(l => l.resource_type === 'ShiftApplication').length,
    userAccess: accessLogs.filter(l => l.resource_type === 'User').length,
    pharmacyAccess: accessLogs.filter(l => l.resource_type === 'Pharmacy').length,
    
    // By action
    reads: accessLogs.filter(l => l.action === 'read').length,
    creates: accessLogs.filter(l => l.action === 'create').length,
    updates: accessLogs.filter(l => l.action === 'update').length,
    deletes: accessLogs.filter(l => l.action === 'delete').length,
  };

  // Filter logs
  const filteredLogs = accessLogs.filter(log => {
    const matchesSearch = 
      log.user_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.resource_type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.resource_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.reason?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesTab = 
      activeTab === "all" ||
      (activeTab === "granted" && log.granted) ||
      (activeTab === "denied" && !log.granted);

    const matchesResource = 
      resourceFilter === "all" || 
      log.resource_type === resourceFilter;

    const matchesAction = 
      actionFilter === "all" || 
      log.action === actionFilter;

    return matchesSearch && matchesTab && matchesResource && matchesAction;
  });

  const resourceTypes = [...new Set(accessLogs.map(l => l.resource_type).filter(Boolean))];
  const actions = [...new Set(accessLogs.map(l => l.action).filter(Boolean))];

  const getStatusBadge = (granted) => {
    return granted ? (
      <Badge className="bg-green-100 text-green-700 border-0">
        <CheckCircle className="w-3 h-3 mr-1" />
        Granted
      </Badge>
    ) : (
      <Badge className="bg-red-100 text-red-700 border-0">
        <XCircle className="w-3 h-3 mr-1" />
        Denied
      </Badge>
    );
  };

  const getActionIcon = (action) => {
    switch(action) {
      case 'read': return <Eye className="w-4 h-4 text-blue-600" />;
      case 'create': return <FileText className="w-4 h-4 text-green-600" />;
      case 'update': return <Activity className="w-4 h-4 text-amber-600" />;
      case 'delete': return <XCircle className="w-4 h-4 text-red-600" />;
      default: return <Database className="w-4 h-4 text-gray-600" />;
    }
  };

  const getUserInfo = (userId) => {
    const user = users.find(u => u.id === userId);
    return user || { full_name: 'Unknown User', email: userId };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-24">
      {/* Header */}
      <div className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white pb-24 pt-6 px-4 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl -mr-32 -mt-32 animate-pulse" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full blur-3xl -ml-24 -mb-24 animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <Shield className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-3xl font-black">Data Access Control</h1>
              <p className="text-indigo-100 text-sm">Monitor & audit data access patterns</p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
              <p className="text-2xl font-bold">{stats.granted}</p>
              <p className="text-xs text-indigo-100">Granted</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
              <p className="text-2xl font-bold">{stats.denied}</p>
              <p className="text-xs text-indigo-100">Denied</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
              <p className="text-2xl font-bold">{stats.uniqueUsers}</p>
              <p className="text-xs text-indigo-100">Unique Users</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
              <p className="text-2xl font-bold">{stats.totalAccess}</p>
              <p className="text-xs text-indigo-100">Total</p>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Stats Cards */}
      <div className="px-4 -mt-16 relative z-20 mb-4">
        <Card className="shadow-2xl border-0 mb-4">
          <CardContent className="p-4">
            <h3 className="font-bold text-gray-900 mb-3 text-sm">Access by Resource Type</h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                <p className="text-xs text-gray-600 mb-1">Shifts</p>
                <p className="text-xl font-bold text-blue-600">{stats.shiftAccess}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                <p className="text-xs text-gray-600 mb-1">Applications</p>
                <p className="text-xl font-bold text-green-600">{stats.applicationAccess}</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                <p className="text-xs text-gray-600 mb-1">Users</p>
                <p className="text-xl font-bold text-purple-600">{stats.userAccess}</p>
              </div>
              <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                <p className="text-xs text-gray-600 mb-1">Pharmacies</p>
                <p className="text-xl font-bold text-amber-600">{stats.pharmacyAccess}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xl border-0">
          <CardContent className="p-4">
            <h3 className="font-bold text-gray-900 mb-3 text-sm">Access by Action Type</h3>
            <div className="grid grid-cols-4 gap-2">
              <div className="text-center">
                <Eye className="w-6 h-6 text-blue-600 mx-auto mb-1" />
                <p className="text-lg font-bold text-gray-900">{stats.reads}</p>
                <p className="text-xs text-gray-600">Read</p>
              </div>
              <div className="text-center">
                <FileText className="w-6 h-6 text-green-600 mx-auto mb-1" />
                <p className="text-lg font-bold text-gray-900">{stats.creates}</p>
                <p className="text-xs text-gray-600">Create</p>
              </div>
              <div className="text-center">
                <Activity className="w-6 h-6 text-amber-600 mx-auto mb-1" />
                <p className="text-lg font-bold text-gray-900">{stats.updates}</p>
                <p className="text-xs text-gray-600">Update</p>
              </div>
              <div className="text-center">
                <XCircle className="w-6 h-6 text-red-600 mx-auto mb-1" />
                <p className="text-lg font-bold text-gray-900">{stats.deletes}</p>
                <p className="text-xs text-gray-600">Delete</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="px-4 mb-4">
        <Card className="shadow-lg border-0">
          <CardContent className="p-4 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Search by user, resource, or reason..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 bg-gray-50 border-0"
              />
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="w-full bg-gray-100 p-1 h-auto grid grid-cols-3 gap-1">
                <TabsTrigger value="all" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg py-2 text-xs">
                  All ({stats.totalAccess})
                </TabsTrigger>
                <TabsTrigger value="granted" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg py-2 text-xs">
                  Granted ({stats.granted})
                </TabsTrigger>
                <TabsTrigger value="denied" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg py-2 text-xs">
                  Denied ({stats.denied})
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="grid grid-cols-2 gap-3">
              <Select value={resourceFilter} onValueChange={setResourceFilter}>
                <SelectTrigger className="h-10 border-gray-200 text-sm">
                  <Database className="w-4 h-4 mr-2 text-gray-500" />
                  <SelectValue placeholder="Resource" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Resources</SelectItem>
                  {resourceTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="h-10 border-gray-200 text-sm">
                  <Activity className="w-4 h-4 mr-2 text-gray-500" />
                  <SelectValue placeholder="Action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  {actions.map(action => (
                    <SelectItem key={action} value={action}>{action}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Access Logs List */}
      <div className="px-4 space-y-3">
        {isLoading ? (
          Array(5).fill(0).map((_, i) => (
            <div key={i} className="h-32 bg-white rounded-2xl animate-pulse" />
          ))
        ) : filteredLogs.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="font-bold text-gray-900 text-lg mb-2">No access logs found</h3>
              <p className="text-gray-600 text-sm">Try adjusting your search or filters</p>
            </CardContent>
          </Card>
        ) : (
          <AnimatePresence>
            {filteredLogs.map((log, index) => {
              const userInfo = getUserInfo(log.user_id);
              
              return (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card 
                    className="hover:shadow-lg transition-all active:scale-[0.98] cursor-pointer border-l-4"
                    style={{ borderLeftColor: log.granted ? '#10b981' : '#ef4444' }}
                    onClick={() => {
                      setSelectedAccess(log);
                      setShowDetails(true);
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3 flex-1">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                            log.granted ? 'bg-green-100' : 'bg-red-100'
                          }`}>
                            {getActionIcon(log.action)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-bold text-gray-900 text-sm truncate">
                                {log.action?.toUpperCase()} {log.resource_type}
                              </h3>
                              {getStatusBadge(log.granted)}
                            </div>
                            <p className="text-sm text-gray-600 truncate">{userInfo.full_name}</p>
                            <p className="text-xs text-gray-500 truncate">{userInfo.email}</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-3 mb-3">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <p className="text-gray-500 mb-1">Resource ID</p>
                            <p className="font-mono font-semibold text-gray-900 truncate">
                              {log.resource_id || 'N/A'}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500 mb-1">Timestamp</p>
                            <p className="font-semibold text-gray-900">
                              {log.timestamp ? format(new Date(log.timestamp), 'MMM d, HH:mm') : 'N/A'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {log.reason && (
                        <div className={`p-2 rounded-lg text-xs ${
                          log.granted 
                            ? 'bg-green-50 text-green-800 border border-green-200' 
                            : 'bg-red-50 text-red-800 border border-red-200'
                        }`}>
                          <p className="font-semibold">{log.reason}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {/* Details Sheet */}
      <Sheet open={showDetails} onOpenChange={setShowDetails}>
        <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl">
          {selectedAccess && (
            <>
              <SheetHeader className="mb-6">
                <div className="flex items-start gap-4">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                    selectedAccess.granted ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    {getActionIcon(selectedAccess.action)}
                  </div>
                  <div className="flex-1">
                    <SheetTitle className="text-2xl">
                      {selectedAccess.action?.toUpperCase()} Access
                    </SheetTitle>
                    {getStatusBadge(selectedAccess.granted)}
                  </div>
                </div>
              </SheetHeader>

              <div className="space-y-4 overflow-y-auto pb-24">
                {/* User Info */}
                <Card className="bg-gray-50 border-0">
                  <CardContent className="p-4 space-y-3">
                    <h4 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
                      <User className="w-4 h-4" />
                      User Information
                    </h4>
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs text-gray-600">User ID</p>
                        <p className="text-sm font-mono font-medium text-gray-900">{selectedAccess.user_id}</p>
                      </div>
                      {getUserInfo(selectedAccess.user_id).full_name && (
                        <div>
                          <p className="text-xs text-gray-600">Name</p>
                          <p className="text-sm font-medium text-gray-900">
                            {getUserInfo(selectedAccess.user_id).full_name}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Resource Info */}
                <Card className="bg-gray-50 border-0">
                  <CardContent className="p-4 space-y-3">
                    <h4 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
                      <Database className="w-4 h-4" />
                      Resource Information
                    </h4>
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs text-gray-600">Resource Type</p>
                        <p className="text-sm font-semibold text-gray-900">{selectedAccess.resource_type}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Resource ID</p>
                        <p className="text-sm font-mono font-medium text-gray-900">{selectedAccess.resource_id || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Action</p>
                        <Badge variant="outline" className="mt-1">
                          {selectedAccess.action}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Access Decision */}
                <Card className={`border-2 ${
                  selectedAccess.granted 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}>
                  <CardContent className="p-4">
                    <h4 className="font-semibold text-gray-900 text-sm mb-3 flex items-center gap-2">
                      {selectedAccess.granted ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-600" />
                      )}
                      Access Decision
                    </h4>
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs text-gray-600">Status</p>
                        <p className={`text-sm font-bold ${
                          selectedAccess.granted ? 'text-green-900' : 'text-red-900'
                        }`}>
                          {selectedAccess.granted ? 'GRANTED' : 'DENIED'}
                        </p>
                      </div>
                      {selectedAccess.reason && (
                        <div>
                          <p className="text-xs text-gray-600">Reason</p>
                          <p className={`text-sm font-medium ${
                            selectedAccess.granted ? 'text-green-900' : 'text-red-900'
                          }`}>
                            {selectedAccess.reason}
                          </p>
                        </div>
                      )}
                      <div>
                        <p className="text-xs text-gray-600">Timestamp</p>
                        <p className="text-sm font-medium text-gray-900">
                          {selectedAccess.timestamp 
                            ? format(new Date(selectedAccess.timestamp), 'MMMM d, yyyy \'at\' h:mm:ss a') 
                            : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

export default function AdminDataAccess() {
  return (
    <AdminOnly>
      <AdminDataAccessContent />
    </AdminOnly>
  );
}