import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Download, Loader2, CheckCircle2, Users } from "lucide-react";
import { AdminOnly } from "../components/auth/RouteProtection";

function ExportUsersContent() {
  const [isExporting, setIsExporting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    setSuccess(false);
    
    try {
      const response = await base44.functions.invoke('exportUsers', {}, { responseType: 'blob' });
      
      // Create blob from response data
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      
      // Create download link
      const a = document.createElement('a');
      a.href = url;
      a.download = `users_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      a.remove();
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed: ' + (error.message || 'Unknown error'));
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 p-6">
      <div className="max-w-xl mx-auto">
        <Card className="border-zinc-200">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-zinc-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-zinc-700" />
              </div>
              <div>
                <CardTitle>Export Users</CardTitle>
                <CardDescription>Download all user data as a CSV file</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleExport} 
              disabled={isExporting}
              className="w-full h-12 text-base"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : success ? (
                <>
                  <CheckCircle2 className="w-5 h-5 mr-2 text-green-500" />
                  Downloaded!
                </>
              ) : (
                <>
                  <Download className="w-5 h-5 mr-2" />
                  Export All Users to CSV
                </>
              )}
            </Button>
            
            <p className="text-xs text-zinc-500 mt-4 text-center">
              Exports all user data including email, name, role, and custom fields.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function ExportUsers() {
  return (
    <AdminOnly>
      <ExportUsersContent />
    </AdminOnly>
  );
}