import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Users,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Mail,
  Calendar,
  Trash2,
  Phone,
  MapPin,
  Award,
  User,
  ChevronRight
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { AdminOnly } from "../components/auth/RouteProtection";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

// Email Template Generator
const generateEmailHTML = (content) => {
  const logoUrl = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fc5eaf1b32d1359be8744a/86aaf53ec_6852a121a_android-launchericon-512-512.png';

  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Pharmanet Communication</title>
  <link href="https://fonts.googleapis.com/css2?family=Roboto+Condensed:wght@300;400;600;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { margin: 0; padding: 0; font-family: 'Roboto Condensed', Arial, sans-serif; background-color: #f5f5f5; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
    table { border-collapse: collapse; width: 100%; }
    img { border: 0; display: block; outline: none; text-decoration: none; }
    
    .email-wrapper { width: 100%; background-color: #f5f5f5; padding: 16px 0; }
    .email-container { max-width: 600px; width: 100%; margin: 0 auto; background: #ffffff; border: 1px solid #e0e0e0; }
    
    /* Header - Light Blue Bar */
    .email-header { background: #d3f3fbff; padding: 16px 24px; }
    .email-header-content { display: flex; justify-content: space-between; align-items: center; width: 100%; }
    .email-header-text { text-align: left; }
    .email-header-title { font-family: 'Roboto Condensed', Arial, sans-serif; font-size: 20px; font-weight: 700; color: #010101ff; letter-spacing: 0.5px; margin: 0; }
    .email-header-logo { text-align: right; }
    .email-header-logo-img { width: 40px; height: 40px; }
    
    /* Body */
    .email-body { padding: 28px 24px; background: #ffffff; }
    .text-block { font-family: 'Roboto Condensed', Arial, sans-serif; color: #333333; font-size: 14px; line-height: 1.6; margin: 14px 0; }
    .text-block p { margin: 12px 0; }
    .text-block h1, .text-block h2, .text-block h3 { font-family: 'Roboto Condensed', Arial, sans-serif; color: #1a1a1a; margin: 18px 0 10px; font-size: 18px; }
    .text-block a { color: #1a1a1a; text-decoration: underline; }

    /* Footer - Clean Professional */
    .email-footer { background: #E8EEF2; padding: 32px 24px 24px; text-align: center; color: #333333; }
    .footer-brand { font-family: 'Roboto Condensed', Arial, sans-serif; font-size: 18px; font-weight: 700; color: #333333; letter-spacing: 0.5px; margin-bottom: 8px; text-transform: uppercase; }
    .footer-text { font-family: 'Roboto Condensed', Arial, sans-serif; color: #666666; font-size: 13px; line-height: 1.3; margin: 5px 0; }
    .footer-contact { font-family: 'Roboto Condensed', Arial, sans-serif; font-size: 13px; color: #333333; margin: 12px 0; }
    .footer-label { font-weight: 600; color: #333333; }
    .footer-link { color: #4A90B8; text-decoration: none; }
    .footer-link:hover { text-decoration: underline; }
    .footer-secured { font-family: 'Roboto Condensed', Arial, sans-serif; font-size: 12px; color: #666666; margin: 16px 0 8px; }
    .footer-unsubscribe { font-family: 'Roboto Condensed', Arial, sans-serif; font-size: 12px; margin-top: 12px; }
    .footer-unsubscribe a { color: #4A90B8; text-decoration: underline; }
    
    /* Mobile Responsive */
    @media only screen and (max-width: 600px) {
      .email-wrapper { padding: 8px 0 !important; }
      .email-header { padding: 12px 16px !important; }
      .email-header-text { text-align: left !important; vertical-align: middle !important; }
      .email-header-logo { text-align: right !important; vertical-align: middle !important; width: 50px !important; }
      .email-header-logo-img { width: 36px !important; height: 36px !important; display: block !important; }
      .email-header-title { font-size: 18px !important; }
      .email-body { padding: 20px 16px !important; }
      .text-block { font-size: 13px !important; line-height: 1.5 !important; }
      .text-block h1, .text-block h2, .text-block h3 { font-size: 16px !important; }
      .email-footer { padding: 24px 16px 20px !important; }
      .footer-brand { font-size: 16px !important; }
      .footer-text { font-size: 12px !important; }
      .footer-contact { font-size: 12px !important; }
    }
  </style>
  </head>
  <body>
  <table role="presentation" class="email-wrapper" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center">
        <table role="presentation" class="email-container" cellpadding="0" cellspacing="0">
          <!-- Header -->
          <tr>
            <td class="email-header">
              <div class="email-header-content">
                <div class="email-header-text">
                  <h1 class="email-header-title">Pharmanet</h1>
                </div>
                <div class="email-header-logo">
                  <img src="${logoUrl}" alt="Pharmanet Logo" class="email-header-logo-img">
                </div>
              </div>
            </td>
          </tr>
          
          <!-- Body -->
          <tr>
            <td class="email-body">
              <div class="text-block">
                ${content}
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td class="email-footer">
              <div class="footer-brand">PHARMANET INC</div>
              <p class="footer-text">
                You're receiving this email because you've signed up for the Pharmanet Platform.
              </p>
              <p class="footer-contact">
                <span class="footer-label">Contact Us:</span> <a href="mailto:info@pharmanet.ca" class="footer-link">info@pharmanet.ca</a>
              </p>
              <p class="footer-contact">
                <span class="footer-label">Website:</span> <a href="https://pharmanet.ca" class="footer-link">Pharmanet.ca</a>
              </p>
              <p class="footer-secured">
                Secured By: CipherX Solutions
              </p>
              <p class="footer-unsubscribe">
                <a href="#" class="footer-link">Unsubscribe</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
  </body>
  </html>
  `;
};

function AdminUsersContent() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { 
    data: users = [], 
    isLoading
  } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: async () => {
      const result = await base44.entities.User.list('-created_date', 500);
      return Array.isArray(result) ? result : [];
    },
  });

  // Safe users array
  const safeUsers = Array.isArray(users) ? users : [];

  const updateUserMutation = useMutation({
    mutationFn: ({ userId, updates }) => 
      base44.entities.User.update(userId, updates),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['adminUsers']);
      setSelectedUser(prev => ({ ...prev, ...variables.updates }));
      toast({
        title: "User Updated",
        description: "Changes saved successfully",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error?.message || "Could not update user",
      });
    }
  });

  const deleteUserMutation = useMutation({
    mutationFn: (userId) => base44.entities.User.delete(userId),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminUsers']);
      toast({
        title: "User Deleted",
        description: "User removed from system",
      });
      setShowDetails(false);
    }
  });

  const sendEmailMutation = useMutation({
    mutationFn: async (data) => {
      const response = await base44.functions.invoke("sendBrevoEmail", data);
      if (response.status !== 200) throw new Error("Failed to send email");
      return response.data;
    },
    onSuccess: () => {
      toast({
        title: "Email Sent",
        description: `Email sent to ${selectedUser.email}`,
      });
      setShowEmailDialog(false);
      setEmailSubject("");
      setEmailBody("");
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to send email",
        description: error.message,
      });
    }
  });

  const filteredUsers = safeUsers.filter(user => {
    if (!user) return false;
    
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      (user.full_name || '').toLowerCase().includes(searchLower) ||
      (user.email || '').toLowerCase().includes(searchLower);
    
    const matchesTab = 
      activeTab === "all" ||
      (activeTab === "employers" && user.user_type === "employer") ||
      (activeTab === "pharmacists" && user.user_type === "pharmacist") ||
      (activeTab === "admins" && user.role === "admin");

    return matchesSearch && matchesTab;
  });

  const stats = {
    all: safeUsers.length,
    employers: safeUsers.filter(u => u?.user_type === "employer").length,
    pharmacists: safeUsers.filter(u => u?.user_type === "pharmacist").length,
  };

  return (
    <div className="min-h-screen bg-zinc-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-zinc-200 px-6 py-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 bg-zinc-100 rounded-lg flex items-center justify-center">
            <Users className="w-5 h-5 text-zinc-900" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-zinc-900">User Management</h1>
            <p className="text-xs text-zinc-500">
              {stats.all} total users • {stats.employers} employers • {stats.pharmacists} pharmacists
            </p>
          </div>
        </div>
      </div>

      <div className="px-6 max-w-[1600px] mx-auto mt-6">
        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search users..."
              className="pl-9 bg-white border-zinc-200"
            />
          </div>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
            <TabsList className="bg-zinc-100 border border-zinc-200 p-1 h-10 w-full sm:w-auto">
              <TabsTrigger value="all" className="text-xs px-3">All</TabsTrigger>
              <TabsTrigger value="employers" className="text-xs px-3">Employers</TabsTrigger>
              <TabsTrigger value="pharmacists" className="text-xs px-3">Pharmacists</TabsTrigger>
              <TabsTrigger value="admins" className="text-xs px-3">Admins</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Users Grid (2 Columns on mobile) */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-32 bg-zinc-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-zinc-200 rounded-xl">
            <Users className="w-12 h-12 text-zinc-300 mx-auto mb-2" />
            <p className="text-zinc-500 font-medium">No users found</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-6">
            <AnimatePresence>
              {filteredUsers.map((user, i) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => {
                    setSelectedUser(user);
                    setShowDetails(true);
                  }}
                >
                  <div className="bg-white border border-zinc-200 rounded-xl p-4 hover:border-zinc-400 hover:shadow-sm transition-all cursor-pointer h-full flex flex-col">
                    <div className="flex justify-between items-start mb-3">
                      <div className="w-10 h-10 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-600 font-bold text-sm overflow-hidden">
                         {user.avatar_url ? (
                           <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                         ) : (
                           user.full_name?.[0]?.toUpperCase() || <User className="w-5 h-5" />
                         )}
                      </div>
                      {user.role === "admin" ? (
                        <Badge variant="outline" className="bg-black text-white border-black text-[10px] h-5 px-1.5">Admin</Badge>
                      ) : user.user_type === "employer" ? (
                        <Badge variant="outline" className="bg-zinc-100 text-zinc-700 border-zinc-200 text-[10px] h-5 px-1.5">Emp</Badge>
                      ) : user.user_type === "pharmacist" ? (
                        <Badge variant="outline" className="bg-white text-zinc-600 border-zinc-300 text-[10px] h-5 px-1.5">Pharm</Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] h-5 px-1.5">New</Badge>
                      )}
                    </div>
                    
                    <div className="mt-auto">
                      <h3 className="font-semibold text-zinc-900 text-sm truncate">{user.full_name || "No Name"}</h3>
                      <p className="text-xs text-zinc-500 truncate">{user.email}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          </>
        )}
      </div>

      {/* User Details Drawer */}
      <Sheet open={showDetails} onOpenChange={setShowDetails}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto p-0">
          {selectedUser && (
            <>
              <SheetHeader className="border-b border-zinc-100 p-4 sticky top-0 bg-white z-10">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-500 font-bold text-sm overflow-hidden flex-shrink-0">
                    {selectedUser.avatar_url ? (
                      <img src={selectedUser.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      selectedUser.full_name?.[0]?.toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <SheetTitle className="text-lg font-bold truncate">{selectedUser.full_name}</SheetTitle>
                    <p className="text-xs text-zinc-500 truncate">{selectedUser.email}</p>
                    <div className="flex gap-1.5 mt-1.5">
                      <Badge variant="secondary" className="bg-zinc-100 text-zinc-700 text-[10px] h-5">
                        {selectedUser.user_type || "Unassigned"}
                      </Badge>
                      {selectedUser.role === 'admin' && (
                        <Badge className="bg-black text-white text-[10px] h-5">Admin</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </SheetHeader>

              <div className="space-y-4 p-4">
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Details</h4>
                  
                  <div className="space-y-4">
                    {/* User Type Radio Group */}
                    <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-100">
                      <p className="text-xs font-semibold text-zinc-700 mb-3">User Type</p>
                      <RadioGroup 
                        value={selectedUser.user_type || "unassigned"}
                        onValueChange={(val) => {
                          const newType = val === "unassigned" ? null : val;
                          updateUserMutation.mutate({ userId: selectedUser.id, updates: { user_type: newType }});
                        }}
                        className="space-y-2"
                      >
                        <div className="flex items-center space-x-3 p-2 rounded-md hover:bg-white transition-colors">
                          <RadioGroupItem value="unassigned" id="type-unassigned" />
                          <Label htmlFor="type-unassigned" className="text-sm cursor-pointer flex-1">Unassigned</Label>
                        </div>
                        <div className="flex items-center space-x-3 p-2 rounded-md hover:bg-white transition-colors">
                          <RadioGroupItem value="employer" id="type-employer" />
                          <Label htmlFor="type-employer" className="text-sm cursor-pointer flex-1">Employer</Label>
                        </div>
                        <div className="flex items-center space-x-3 p-2 rounded-md hover:bg-white transition-colors">
                          <RadioGroupItem value="pharmacist" id="type-pharmacist" />
                          <Label htmlFor="type-pharmacist" className="text-sm cursor-pointer flex-1">Pharmacist</Label>
                        </div>
                        <div className="flex items-center space-x-3 p-2 rounded-md hover:bg-white transition-colors">
                          <RadioGroupItem value="admin" id="type-admin" />
                          <Label htmlFor="type-admin" className="text-sm cursor-pointer flex-1">Admin</Label>
                        </div>
                      </RadioGroup>
                    </div>
                    
                    {/* User Role Radio Group */}
                    <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-100">
                      <p className="text-xs font-semibold text-zinc-700 mb-3">User Role</p>
                      <RadioGroup 
                        value={selectedUser.role || "user"}
                        onValueChange={(val) => {
                          updateUserMutation.mutate({ userId: selectedUser.id, updates: { role: val }});
                        }}
                        className="space-y-2"
                      >
                        <div className="flex items-center space-x-3 p-2 rounded-md hover:bg-white transition-colors">
                          <RadioGroupItem value="user" id="role-user" />
                          <Label htmlFor="role-user" className="text-sm cursor-pointer flex-1">User</Label>
                        </div>
                        <div className="flex items-center space-x-3 p-2 rounded-md hover:bg-white transition-colors">
                          <RadioGroupItem value="admin" id="role-admin" />
                          <Label htmlFor="role-admin" className="text-sm cursor-pointer flex-1">Admin</Label>
                        </div>
                      </RadioGroup>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="p-2.5 bg-zinc-50 rounded-lg border border-zinc-100">
                        <p className="text-xs text-zinc-500 mb-1">Joined</p>
                        <p className="text-sm font-medium">{selectedUser.created_date ? format(new Date(selectedUser.created_date), 'MMM d, yyyy') : '-'}</p>
                      </div>
                      <div className="p-2.5 bg-zinc-50 rounded-lg border border-zinc-100">
                        <p className="text-xs text-zinc-500 mb-1">Phone</p>
                        <p className="text-sm font-medium truncate">{selectedUser.phone || '-'}</p>
                      </div>
                    </div>
                    
                    {selectedUser.license_number && (
                       <div className="p-2.5 bg-zinc-50 rounded-lg border border-zinc-100">
                        <p className="text-xs text-zinc-500 mb-1">License</p>
                        <p className="text-sm font-medium">{selectedUser.license_number}</p>
                      </div>
                    )}
                    
                     {selectedUser.company_name && (
                       <div className="p-2.5 bg-zinc-50 rounded-lg border border-zinc-100">
                        <p className="text-xs text-zinc-500 mb-1">Company</p>
                        <p className="text-sm font-medium">{selectedUser.company_name}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2 pt-3 border-t border-zinc-100">
                  <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Actions</h4>

                  <Button 
                    variant="outline" 
                    size="sm"
                    className="w-full justify-start h-9 mb-2"
                    onClick={() => setShowEmailDialog(true)}
                  >
                    <Mail className="w-3.5 h-3.5 mr-2" /> Send Email
                  </Button>
                  
                  {selectedUser.role !== "admin" ? (
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="w-full justify-start h-9"
                      onClick={() => {
                        if(confirm('Promote to Admin?')) {
                           updateUserMutation.mutate({ userId: selectedUser.id, updates: { role: 'admin' }});
                        }
                      }}
                    >
                      <ShieldCheck className="w-3.5 h-3.5 mr-2" /> Promote to Admin
                    </Button>
                  ) : (
                    <Button 
                      variant="outline"
                      size="sm"
                      className="w-full justify-start h-9"
                      onClick={() => {
                        if(confirm('Remove Admin access?')) {
                           updateUserMutation.mutate({ userId: selectedUser.id, updates: { role: 'user' }});
                        }
                      }}
                    >
                      <ShieldAlert className="w-3.5 h-3.5 mr-2" /> Remove Admin Access
                    </Button>
                  )}

                  <Button 
                    variant="destructive" 
                    size="sm"
                    className="w-full justify-start bg-red-50 text-red-600 hover:bg-red-100 border-red-100 h-9"
                    onClick={() => {
                      if(confirm('Delete user permanently?')) {
                        deleteUserMutation.mutate(selectedUser.id);
                      }
                    }}
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete User
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Send Email Dialog */}
      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Send Email to {selectedUser?.full_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                placeholder="Email subject"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <textarea
                id="message"
                className="flex min-h-[150px] w-full rounded-md border border-zinc-200 bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-900 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                placeholder="Type your message here..."
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEmailDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                const formattedBody = `<p>${emailBody.replace(/\n/g, '<br>')}</p>`;
                const fullHtml = generateEmailHTML(formattedBody);
                
                sendEmailMutation.mutate({
                  to: selectedUser.email,
                  subject: emailSubject,
                  html_body: fullHtml
                });
              }}
              disabled={!emailSubject || !emailBody || sendEmailMutation.isPending}
            >
              {sendEmailMutation.isPending ? "Sending..." : "Send Email"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function AdminUsers() {
  return (
    <AdminOnly>
      <AdminUsersContent />
    </AdminOnly>
  );
}