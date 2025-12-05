import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminOnly } from "../components/auth/RouteProtection";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  GitBranch,
  Plus,
  Rocket,
  RotateCcw,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Archive,
  Tag,
  User,
  Calendar,
  FileText,
  ChevronRight,
  ArrowUpCircle,
  History,
  Shield,
  Loader2,
  Eye,
  Trash2
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "@/components/ui/use-toast";

function AdminVersionControlContent() {
  const queryClient = useQueryClient();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showPushDialog, setShowPushDialog] = useState(false);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [newVersion, setNewVersion] = useState({
    version_number: "",
    version_name: "",
    description: "",
    release_notes: "",
    version_type: "patch",
    features_added: [],
    bugs_fixed: [],
    breaking_changes: [],
    tags: []
  });
  const [featureInput, setFeatureInput] = useState("");
  const [bugInput, setBugInput] = useState("");
  const [breakingInput, setBreakingInput] = useState("");

  // Fetch versions
  const { data: versions = [], isLoading } = useQuery({
    queryKey: ['appVersions'],
    queryFn: () => base44.entities.AppVersion.list('-created_date', 50),
  });

  // Fetch current user
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  // Create version mutation
  const createVersionMutation = useMutation({
    mutationFn: async (versionData) => {
      // Get entity counts snapshot
      const [shifts, users, pharmacies, applications] = await Promise.all([
        base44.entities.Shift.filter({}, '-created_date', 1),
        base44.entities.User.list('-created_date', 1),
        base44.entities.Pharmacy.filter({}, '-created_date', 1),
        base44.entities.ShiftApplication.filter({}, '-created_date', 1),
      ]);

      return base44.entities.AppVersion.create({
        ...versionData,
        status: "draft",
        is_current: false,
        entity_counts: {
          shifts: shifts.length > 0 ? "available" : "0",
          users: users.length > 0 ? "available" : "0",
          pharmacies: pharmacies.length > 0 ? "available" : "0",
          applications: applications.length > 0 ? "available" : "0",
        },
        config_snapshot: {
          created_at: new Date().toISOString(),
          created_by: user?.email
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appVersions'] });
      setShowCreateDialog(false);
      resetNewVersion();
      toast({ title: "Version Created", description: "New version draft has been created." });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  // Push to production mutation
  const pushVersionMutation = useMutation({
    mutationFn: async (version) => {
      // First, unset is_current from all versions
      const currentVersions = versions.filter(v => v.is_current);
      for (const cv of currentVersions) {
        await base44.entities.AppVersion.update(cv.id, { 
          is_current: false,
          status: "archived"
        });
      }
      
      // Then set this version as current
      return base44.entities.AppVersion.update(version.id, {
        is_current: true,
        status: "production",
        pushed_at: new Date().toISOString(),
        pushed_by: user?.email
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appVersions'] });
      setShowPushDialog(false);
      setSelectedVersion(null);
      toast({ title: "Version Pushed", description: "Version is now in production." });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  // Restore version mutation
  const restoreVersionMutation = useMutation({
    mutationFn: async (version) => {
      // Get current production version
      const currentVersion = versions.find(v => v.is_current);
      
      if (currentVersion) {
        await base44.entities.AppVersion.update(currentVersion.id, {
          is_current: false,
          status: "rolled_back",
          rolled_back_at: new Date().toISOString(),
          rolled_back_by: user?.email,
          rolled_back_to: version.id
        });
      }

      // Restore selected version
      return base44.entities.AppVersion.update(version.id, {
        is_current: true,
        status: "production",
        pushed_at: new Date().toISOString(),
        pushed_by: user?.email
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appVersions'] });
      setShowRestoreDialog(false);
      setSelectedVersion(null);
      toast({ title: "Version Restored", description: "Previous version has been restored." });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  // Delete version mutation
  const deleteVersionMutation = useMutation({
    mutationFn: (versionId) => base44.entities.AppVersion.delete(versionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appVersions'] });
      toast({ title: "Version Deleted" });
    }
  });

  const resetNewVersion = () => {
    setNewVersion({
      version_number: "",
      version_name: "",
      description: "",
      release_notes: "",
      version_type: "patch",
      features_added: [],
      bugs_fixed: [],
      breaking_changes: [],
      tags: []
    });
    setFeatureInput("");
    setBugInput("");
    setBreakingInput("");
  };

  const getNextVersion = (type) => {
    const currentVersion = versions.find(v => v.is_current);
    if (!currentVersion) return "1.0.0";
    
    const parts = currentVersion.version_number.split('.').map(Number);
    switch (type) {
      case "major": return `${parts[0] + 1}.0.0`;
      case "minor": return `${parts[0]}.${parts[1] + 1}.0`;
      case "patch": return `${parts[0]}.${parts[1]}.${parts[2] + 1}`;
      case "hotfix": return `${parts[0]}.${parts[1]}.${parts[2] + 1}`;
      default: return `${parts[0]}.${parts[1]}.${parts[2] + 1}`;
    }
  };

  const getStatusBadge = (status, isCurrent) => {
    if (isCurrent) {
      return <Badge className="bg-green-500 text-white">Production</Badge>;
    }
    switch (status) {
      case "draft": return <Badge variant="outline" className="border-blue-500 text-blue-600">Draft</Badge>;
      case "staging": return <Badge className="bg-yellow-500 text-white">Staging</Badge>;
      case "archived": return <Badge variant="outline" className="border-gray-400 text-gray-500">Archived</Badge>;
      case "rolled_back": return <Badge variant="outline" className="border-orange-500 text-orange-600">Rolled Back</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getVersionTypeBadge = (type) => {
    switch (type) {
      case "major": return <Badge className="bg-purple-500 text-white">Major</Badge>;
      case "minor": return <Badge className="bg-blue-500 text-white">Minor</Badge>;
      case "patch": return <Badge className="bg-teal-500 text-white">Patch</Badge>;
      case "hotfix": return <Badge className="bg-red-500 text-white">Hotfix</Badge>;
      default: return <Badge variant="outline">{type}</Badge>;
    }
  };

  const currentVersion = versions.find(v => v.is_current);

  const addItem = (type) => {
    if (type === 'feature' && featureInput.trim()) {
      setNewVersion(prev => ({ ...prev, features_added: [...prev.features_added, featureInput.trim()] }));
      setFeatureInput("");
    } else if (type === 'bug' && bugInput.trim()) {
      setNewVersion(prev => ({ ...prev, bugs_fixed: [...prev.bugs_fixed, bugInput.trim()] }));
      setBugInput("");
    } else if (type === 'breaking' && breakingInput.trim()) {
      setNewVersion(prev => ({ ...prev, breaking_changes: [...prev.breaking_changes, breakingInput.trim()] }));
      setBreakingInput("");
    }
  };

  const removeItem = (type, index) => {
    if (type === 'feature') {
      setNewVersion(prev => ({ ...prev, features_added: prev.features_added.filter((_, i) => i !== index) }));
    } else if (type === 'bug') {
      setNewVersion(prev => ({ ...prev, bugs_fixed: prev.bugs_fixed.filter((_, i) => i !== index) }));
    } else if (type === 'breaking') {
      setNewVersion(prev => ({ ...prev, breaking_changes: prev.breaking_changes.filter((_, i) => i !== index) }));
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-8">
      {/* ============ DESKTOP HEADER ============ */}
      <div className="hidden md:block bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                <GitBranch className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Version Control</h1>
                <p className="text-sm text-gray-500">Manage app versions, releases, and rollbacks</p>
              </div>
            </div>
            <Button onClick={() => setShowCreateDialog(true)} className="bg-indigo-600 hover:bg-indigo-700">
              <Plus className="w-4 h-4 mr-2" />
              Create Version
            </Button>
          </div>
        </div>
      </div>

      {/* ============ MOBILE HEADER ============ */}
      <div className="md:hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-700 text-white p-4 pb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <GitBranch className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Version Control</h1>
              <p className="text-xs text-white/70">{versions.length} versions</p>
            </div>
          </div>
        </div>
        <Button 
          onClick={() => setShowCreateDialog(true)} 
          className="w-full bg-white text-indigo-700 hover:bg-white/90 font-semibold"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create New Version
        </Button>
      </div>

      {/* ============ DESKTOP CONTENT ============ */}
      <div className="hidden md:block max-w-7xl mx-auto px-6 py-6">
        {/* Current Version Card */}
        {currentVersion && (
          <Card className="mb-6 border-2 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-green-500 rounded-xl flex items-center justify-center">
                    <CheckCircle2 className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-xl font-bold text-gray-900">v{currentVersion.version_number}</h2>
                      <Badge className="bg-green-500 text-white">Current Production</Badge>
                      {getVersionTypeBadge(currentVersion.version_type)}
                    </div>
                    <p className="text-gray-600">{currentVersion.version_name}</p>
                    {currentVersion.pushed_at && (
                      <p className="text-sm text-gray-500 mt-1">
                        Pushed {format(new Date(currentVersion.pushed_at), "MMM d, yyyy 'at' h:mm a")} by {currentVersion.pushed_by}
                      </p>
                    )}
                  </div>
                </div>
                <Button variant="outline" onClick={() => { setSelectedVersion(currentVersion); setShowDetailsDialog(true); }}>
                  <Eye className="w-4 h-4 mr-2" />
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <Tag className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{versions.length}</p>
                  <p className="text-sm text-gray-500">Total Versions</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{versions.filter(v => v.status === 'draft').length}</p>
                  <p className="text-sm text-gray-500">Draft Versions</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <History className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{versions.filter(v => v.status === 'rolled_back').length}</p>
                  <p className="text-sm text-gray-500">Rollbacks</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Archive className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{versions.filter(v => v.status === 'archived').length}</p>
                  <p className="text-sm text-gray-500">Archived</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Version History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              Version History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {versions.length === 0 ? (
              <div className="text-center py-12">
                <GitBranch className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No versions created yet</p>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Version
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {versions.map((version, index) => (
                  <div 
                    key={version.id} 
                    className={`p-4 rounded-xl border transition-all hover:shadow-md ${
                      version.is_current ? 'border-green-200 bg-green-50/50' : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          version.is_current ? 'bg-green-500' : 'bg-gray-200'
                        }`}>
                          {version.is_current ? (
                            <CheckCircle2 className="w-5 h-5 text-white" />
                          ) : (
                            <Tag className="w-5 h-5 text-gray-600" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-900">v{version.version_number}</span>
                            {getStatusBadge(version.status, version.is_current)}
                            {getVersionTypeBadge(version.version_type)}
                          </div>
                          <p className="text-sm text-gray-600">{version.version_name}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            Created {format(new Date(version.created_date), "MMM d, yyyy")}
                            {version.pushed_at && ` • Pushed ${format(new Date(version.pushed_at), "MMM d, yyyy")}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => { setSelectedVersion(version); setShowDetailsDialog(true); }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {!version.is_current && version.status === 'draft' && (
                          <Button 
                            size="sm"
                            className="bg-indigo-600 hover:bg-indigo-700"
                            onClick={() => { setSelectedVersion(version); setShowPushDialog(true); }}
                          >
                            <Rocket className="w-4 h-4 mr-1" />
                            Push
                          </Button>
                        )}
                        {!version.is_current && (version.status === 'archived' || version.status === 'rolled_back') && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => { setSelectedVersion(version); setShowRestoreDialog(true); }}
                          >
                            <RotateCcw className="w-4 h-4 mr-1" />
                            Restore
                          </Button>
                        )}
                        {!version.is_current && version.status === 'draft' && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => deleteVersionMutation.mutate(version.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                    {version.description && (
                      <p className="text-sm text-gray-500 mt-2 pl-14">{version.description}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ============ MOBILE CONTENT ============ */}
      <div className="md:hidden px-4 py-4">
        {/* Current Version Card - Mobile */}
        {currentVersion && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-4 mb-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-lg font-bold text-gray-900">v{currentVersion.version_number}</span>
                  <Badge className="bg-green-500 text-white text-[10px]">Production</Badge>
                </div>
                <p className="text-sm text-gray-600 truncate">{currentVersion.version_name}</p>
              </div>
            </div>
            {currentVersion.pushed_at && (
              <p className="text-xs text-gray-500 mb-3">
                Pushed {format(new Date(currentVersion.pushed_at), "MMM d, yyyy")} by {currentVersion.pushed_by}
              </p>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={() => { setSelectedVersion(currentVersion); setShowDetailsDialog(true); }}
            >
              <Eye className="w-4 h-4 mr-2" />
              View Details
            </Button>
          </div>
        )}

        {/* Stats Grid - Mobile */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-white rounded-xl p-3 border border-gray-200">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                <Tag className="w-4 h-4 text-indigo-600" />
              </div>
              <span className="text-xl font-bold text-gray-900">{versions.length}</span>
            </div>
            <p className="text-xs text-gray-500">Total Versions</p>
          </div>
          <div className="bg-white rounded-xl p-3 border border-gray-200">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="w-4 h-4 text-blue-600" />
              </div>
              <span className="text-xl font-bold text-gray-900">{versions.filter(v => v.status === 'draft').length}</span>
            </div>
            <p className="text-xs text-gray-500">Drafts</p>
          </div>
          <div className="bg-white rounded-xl p-3 border border-gray-200">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                <History className="w-4 h-4 text-orange-600" />
              </div>
              <span className="text-xl font-bold text-gray-900">{versions.filter(v => v.status === 'rolled_back').length}</span>
            </div>
            <p className="text-xs text-gray-500">Rollbacks</p>
          </div>
          <div className="bg-white rounded-xl p-3 border border-gray-200">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                <Archive className="w-4 h-4 text-gray-600" />
              </div>
              <span className="text-xl font-bold text-gray-900">{versions.filter(v => v.status === 'archived').length}</span>
            </div>
            <p className="text-xs text-gray-500">Archived</p>
          </div>
        </div>

        {/* Version History - Mobile */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
            <History className="w-4 h-4 text-gray-600" />
            <h3 className="font-semibold text-gray-900">Version History</h3>
          </div>
          
          {versions.length === 0 ? (
            <div className="p-8 text-center">
              <GitBranch className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm mb-3">No versions yet</p>
              <Button size="sm" onClick={() => setShowCreateDialog(true)}>
                <Plus className="w-4 h-4 mr-1" />
                Create First
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {versions.map((version) => (
                <div 
                  key={version.id} 
                  className={`p-4 ${version.is_current ? 'bg-green-50/50' : ''}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        version.is_current ? 'bg-green-500' : 'bg-gray-200'
                      }`}>
                        {version.is_current ? (
                          <CheckCircle2 className="w-4 h-4 text-white" />
                        ) : (
                          <Tag className="w-4 h-4 text-gray-600" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold text-gray-900 text-sm">v{version.version_number}</span>
                          {getVersionTypeBadge(version.version_type)}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{version.version_name}</p>
                      </div>
                    </div>
                    {getStatusBadge(version.status, version.is_current)}
                  </div>
                  
                  <p className="text-xs text-gray-400 mb-3">
                    Created {format(new Date(version.created_date), "MMM d, yyyy")}
                  </p>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 h-8 text-xs"
                      onClick={() => { setSelectedVersion(version); setShowDetailsDialog(true); }}
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      Details
                    </Button>
                    {!version.is_current && version.status === 'draft' && (
                      <Button 
                        size="sm"
                        className="flex-1 h-8 text-xs bg-indigo-600 hover:bg-indigo-700"
                        onClick={() => { setSelectedVersion(version); setShowPushDialog(true); }}
                      >
                        <Rocket className="w-3 h-3 mr-1" />
                        Push
                      </Button>
                    )}
                    {!version.is_current && (version.status === 'archived' || version.status === 'rolled_back') && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="flex-1 h-8 text-xs"
                        onClick={() => { setSelectedVersion(version); setShowRestoreDialog(true); }}
                      >
                        <RotateCcw className="w-3 h-3 mr-1" />
                        Restore
                      </Button>
                    )}
                    {!version.is_current && version.status === 'draft' && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => deleteVersionMutation.mutate(version.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Version Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto sm:max-w-lg md:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Create New Version
            </DialogTitle>
            <DialogDescription>
              Create a new version to track changes and releases.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Version Type</label>
                <Select 
                  value={newVersion.version_type} 
                  onValueChange={(value) => {
                    setNewVersion(prev => ({ 
                      ...prev, 
                      version_type: value,
                      version_number: getNextVersion(value)
                    }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="major">Major (Breaking)</SelectItem>
                    <SelectItem value="minor">Minor (Features)</SelectItem>
                    <SelectItem value="patch">Patch (Bug fixes)</SelectItem>
                    <SelectItem value="hotfix">Hotfix (Critical)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Version Number</label>
                <Input 
                  value={newVersion.version_number || getNextVersion(newVersion.version_type)}
                  onChange={(e) => setNewVersion(prev => ({ ...prev, version_number: e.target.value }))}
                  placeholder="1.0.0"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Version Name</label>
              <Input 
                value={newVersion.version_name}
                onChange={(e) => setNewVersion(prev => ({ ...prev, version_name: e.target.value }))}
                placeholder="e.g., Autumn Release, Bug Fix Bundle"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Description</label>
              <Textarea 
                value={newVersion.description}
                onChange={(e) => setNewVersion(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of this version..."
                rows={2}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Release Notes</label>
              <Textarea 
                value={newVersion.release_notes}
                onChange={(e) => setNewVersion(prev => ({ ...prev, release_notes: e.target.value }))}
                placeholder="Detailed release notes..."
                rows={3}
              />
            </div>

            {/* Features Added */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Features Added</label>
              <div className="flex gap-2 mb-2">
                <Input 
                  value={featureInput}
                  onChange={(e) => setFeatureInput(e.target.value)}
                  placeholder="Add a feature..."
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addItem('feature'))}
                />
                <Button type="button" variant="outline" onClick={() => addItem('feature')}>Add</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {newVersion.features_added.map((feature, i) => (
                  <Badge key={i} variant="outline" className="flex items-center gap-1">
                    {feature}
                    <button onClick={() => removeItem('feature', i)} className="ml-1 hover:text-red-500">×</button>
                  </Badge>
                ))}
              </div>
            </div>

            {/* Bugs Fixed */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Bugs Fixed</label>
              <div className="flex gap-2 mb-2">
                <Input 
                  value={bugInput}
                  onChange={(e) => setBugInput(e.target.value)}
                  placeholder="Add a bug fix..."
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addItem('bug'))}
                />
                <Button type="button" variant="outline" onClick={() => addItem('bug')}>Add</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {newVersion.bugs_fixed.map((bug, i) => (
                  <Badge key={i} variant="outline" className="border-red-200 text-red-600 flex items-center gap-1">
                    {bug}
                    <button onClick={() => removeItem('bug', i)} className="ml-1 hover:text-red-500">×</button>
                  </Badge>
                ))}
              </div>
            </div>

            {/* Breaking Changes */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Breaking Changes</label>
              <div className="flex gap-2 mb-2">
                <Input 
                  value={breakingInput}
                  onChange={(e) => setBreakingInput(e.target.value)}
                  placeholder="Add a breaking change..."
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addItem('breaking'))}
                />
                <Button type="button" variant="outline" onClick={() => addItem('breaking')}>Add</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {newVersion.breaking_changes.map((change, i) => (
                  <Badge key={i} variant="outline" className="border-orange-200 text-orange-600 flex items-center gap-1">
                    {change}
                    <button onClick={() => removeItem('breaking', i)} className="ml-1 hover:text-red-500">×</button>
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => { setShowCreateDialog(false); resetNewVersion(); }} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button 
              onClick={() => createVersionMutation.mutate({
                ...newVersion,
                version_number: newVersion.version_number || getNextVersion(newVersion.version_type)
              })}
              disabled={!newVersion.version_name || createVersionMutation.isPending}
              className="bg-indigo-600 hover:bg-indigo-700 w-full sm:w-auto"
            >
              {createVersionMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              Create Version
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Push to Production Dialog */}
      <Dialog open={showPushDialog} onOpenChange={setShowPushDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Rocket className="w-5 h-5 text-indigo-600" />
              Push to Production
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to push this version to production?
            </DialogDescription>
          </DialogHeader>

          {selectedVersion && (
            <div className="bg-indigo-50 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-500 rounded-lg flex items-center justify-center">
                  <ArrowUpCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">v{selectedVersion.version_number}</p>
                  <p className="text-sm text-gray-600">{selectedVersion.version_name}</p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-yellow-800">
              This will make this version the current production version. The previous production version will be archived.
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPushDialog(false)}>Cancel</Button>
            <Button 
              onClick={() => pushVersionMutation.mutate(selectedVersion)}
              disabled={pushVersionMutation.isPending}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {pushVersionMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Rocket className="w-4 h-4 mr-2" />
              )}
              Push to Production
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Restore Version Dialog */}
      <Dialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-orange-600" />
              Restore Version
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to restore this previous version?
            </DialogDescription>
          </DialogHeader>

          {selectedVersion && (
            <div className="bg-orange-50 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                  <History className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">v{selectedVersion.version_number}</p>
                  <p className="text-sm text-gray-600">{selectedVersion.version_name}</p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">
              This will roll back to a previous version. The current production version will be marked as rolled back.
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRestoreDialog(false)}>Cancel</Button>
            <Button 
              onClick={() => restoreVersionMutation.mutate(selectedVersion)}
              disabled={restoreVersionMutation.isPending}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {restoreVersionMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RotateCcw className="w-4 h-4 mr-2" />
              )}
              Restore Version
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Version Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl sm:max-w-lg md:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Version Details
            </DialogTitle>
          </DialogHeader>

          {selectedVersion && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  selectedVersion.is_current ? 'bg-green-500' : 'bg-gray-200'
                }`}>
                  {selectedVersion.is_current ? (
                    <CheckCircle2 className="w-6 h-6 text-white" />
                  ) : (
                    <Tag className="w-6 h-6 text-gray-600" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold">v{selectedVersion.version_number}</h3>
                    {getStatusBadge(selectedVersion.status, selectedVersion.is_current)}
                    {getVersionTypeBadge(selectedVersion.version_type)}
                  </div>
                  <p className="text-gray-600">{selectedVersion.version_name}</p>
                </div>
              </div>

              {selectedVersion.description && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Description</h4>
                  <p className="text-gray-700">{selectedVersion.description}</p>
                </div>
              )}

              {selectedVersion.release_notes && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Release Notes</h4>
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedVersion.release_notes}</p>
                </div>
              )}

              {selectedVersion.features_added?.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Features Added</h4>
                  <ul className="space-y-1">
                    {selectedVersion.features_added.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <Plus className="w-3 h-3 text-green-500" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedVersion.bugs_fixed?.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Bugs Fixed</h4>
                  <ul className="space-y-1">
                    {selectedVersion.bugs_fixed.map((bug, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="w-3 h-3 text-red-500" />
                        {bug}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedVersion.breaking_changes?.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Breaking Changes</h4>
                  <ul className="space-y-1">
                    {selectedVersion.breaking_changes.map((change, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-orange-700">
                        <AlertTriangle className="w-3 h-3" />
                        {change}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <p className="text-xs text-gray-400">Created</p>
                  <p className="text-sm text-gray-700">{format(new Date(selectedVersion.created_date), "MMM d, yyyy 'at' h:mm a")}</p>
                </div>
                {selectedVersion.pushed_at && (
                  <div>
                    <p className="text-xs text-gray-400">Pushed by</p>
                    <p className="text-sm text-gray-700">{selectedVersion.pushed_by}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function AdminVersionControl() {
  return (
    <AdminOnly>
      <AdminVersionControlContent />
    </AdminOnly>
  );
}