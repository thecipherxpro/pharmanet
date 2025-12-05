import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  Clock, 
  XCircle, 
  Trash2,
  Plus,
  Download,
  AlertCircle
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";

const certificationTypes = [
  "Professional License",
  "Specialty Certification", 
  "Training Certificate",
  "Continuing Education",
  "Other"
];

export default function CertificationUpload({ certifications, userId, isOwnProfile }) {
  const [showDialog, setShowDialog] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    certification_name: "",
    certification_type: "",
    issuing_organization: "",
    issue_date: "",
    expiry_date: "",
    notes: "",
    document: null
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createCertMutation = useMutation({
    mutationFn: (data) => base44.entities.Certification.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certifications'] });
      setShowDialog(false);
      resetForm();
      toast({
        title: "✓ Certification Added",
        description: "Your certification has been uploaded successfully",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: error.message || "Failed to upload certification",
      });
    }
  });

  const deleteCertMutation = useMutation({
    mutationFn: (id) => base44.entities.Certification.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certifications'] });
      toast({
        title: "✓ Certification Deleted",
        description: "Certification removed successfully",
      });
    }
  });

  const resetForm = () => {
    setFormData({
      certification_name: "",
      certification_type: "",
      issuing_organization: "",
      issue_date: "",
      expiry_date: "",
      notes: "",
      document: null
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          variant: "destructive",
          title: "File Too Large",
          description: "Maximum file size is 10MB",
        });
        return;
      }
      setFormData({ ...formData, document: file });
    }
  };

  const handleSubmit = async () => {
    if (!formData.certification_name || !formData.certification_type || !formData.issuing_organization) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please fill in all required fields",
      });
      return;
    }

    setUploading(true);
    try {
      let document_url = "";
      
      if (formData.document) {
        const { data: uploadResult } = await base44.functions.invoke('uploadCertificationDocument', {
          file: formData.document
        });
        document_url = uploadResult.file_url;
      }

      await createCertMutation.mutateAsync({
        user_id: userId,
        certification_name: formData.certification_name,
        certification_type: formData.certification_type,
        issuing_organization: formData.issuing_organization,
        issue_date: formData.issue_date,
        expiry_date: formData.expiry_date,
        document_url: document_url,
        notes: formData.notes,
        status: "pending"
      });

    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to upload certification",
      });
    }
    setUploading(false);
  };

  const getStatusBadge = (status) => {
    const config = {
      pending: { bg: "bg-yellow-100", text: "text-yellow-700", border: "border-yellow-300", icon: Clock, label: "Pending" },
      verified: { bg: "bg-green-100", text: "text-green-700", border: "border-green-300", icon: CheckCircle, label: "Verified" },
      expired: { bg: "bg-red-100", text: "text-red-700", border: "border-red-300", icon: XCircle, label: "Expired" },
      rejected: { bg: "bg-gray-100", text: "text-gray-700", border: "border-gray-300", icon: AlertCircle, label: "Rejected" }
    };
    
    const { bg, text, border, icon: Icon, label } = config[status] || config.pending;
    
    return (
      <Badge variant="outline" className={`${bg} ${text} ${border}`}>
        <Icon className="w-3 h-3 mr-1" />
        {label}
      </Badge>
    );
  };

  return (
    <div className="space-y-3">
      {isOwnProfile && (
        <Button
          onClick={() => setShowDialog(true)}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Certification
        </Button>
      )}

      {certifications.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="p-8 text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-600">
              {isOwnProfile ? "No certifications added yet" : "No certifications available"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {certifications.map((cert) => (
            <Card key={cert.id} className="border border-gray-200 hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-gray-900">{cert.certification_name}</h4>
                      {getStatusBadge(cert.status)}
                    </div>
                    
                    <div className="space-y-1 text-sm">
                      <p className="text-gray-600">
                        <span className="font-medium">Type:</span> {cert.certification_type}
                      </p>
                      <p className="text-gray-600">
                        <span className="font-medium">Issued by:</span> {cert.issuing_organization}
                      </p>
                      
                      {cert.issue_date && (
                        <p className="text-gray-600">
                          <span className="font-medium">Issue Date:</span> {format(new Date(cert.issue_date), "MMM d, yyyy")}
                        </p>
                      )}
                      
                      {cert.expiry_date && (
                        <p className="text-gray-600">
                          <span className="font-medium">Expiry:</span> {format(new Date(cert.expiry_date), "MMM d, yyyy")}
                        </p>
                      )}
                      
                      {cert.notes && (
                        <p className="text-gray-600 text-xs mt-2 italic">{cert.notes}</p>
                      )}
                    </div>

                    {cert.document_url && (
                      <a
                        href={cert.document_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        <Download className="w-4 h-4" />
                        View Document
                      </a>
                    )}
                  </div>

                  {isOwnProfile && (
                    <button
                      onClick={() => {
                        if (window.confirm('Delete this certification?')) {
                          deleteCertMutation.mutate(cert.id);
                        }
                      }}
                      className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center transition-colors flex-shrink-0"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Certification Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Certification</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="cert_name" className="text-sm font-medium mb-2 block">
                Certification Name *
              </Label>
              <Input
                id="cert_name"
                placeholder="e.g., Advanced Cardiac Life Support (ACLS)"
                value={formData.certification_name}
                onChange={(e) => setFormData({ ...formData, certification_name: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="cert_type" className="text-sm font-medium mb-2 block">
                Type *
              </Label>
              <Select
                value={formData.certification_type}
                onValueChange={(value) => setFormData({ ...formData, certification_type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {certificationTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="org" className="text-sm font-medium mb-2 block">
                Issuing Organization *
              </Label>
              <Input
                id="org"
                placeholder="e.g., Ontario College of Pharmacists"
                value={formData.issuing_organization}
                onChange={(e) => setFormData({ ...formData, issuing_organization: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="issue_date" className="text-sm font-medium mb-2 block">
                  Issue Date
                </Label>
                <Input
                  id="issue_date"
                  type="date"
                  value={formData.issue_date}
                  onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="expiry_date" className="text-sm font-medium mb-2 block">
                  Expiry Date
                </Label>
                <Input
                  id="expiry_date"
                  type="date"
                  value={formData.expiry_date}
                  onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="notes" className="text-sm font-medium mb-2 block">
                Notes (Optional)
              </Label>
              <Textarea
                id="notes"
                placeholder="Additional information about this certification"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="document" className="text-sm font-medium mb-2 block">
                Upload Document (PDF, JPG, PNG - Max 10MB)
              </Label>
              <div className="mt-2">
                <label htmlFor="document" className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors">
                  <div className="text-center">
                    {formData.document ? (
                      <>
                        <FileText className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                        <p className="text-sm text-gray-900 font-medium">{formData.document.name}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {(formData.document.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">Click to upload document</p>
                        <p className="text-xs text-gray-500 mt-1">PDF, JPG, PNG up to 10MB</p>
                      </>
                    )}
                  </div>
                  <input
                    id="document"
                    type="file"
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileChange}
                  />
                </label>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowDialog(false);
                resetForm();
              }}
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={uploading || !formData.certification_name || !formData.certification_type || !formData.issuing_organization}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {uploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Add Certification
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}