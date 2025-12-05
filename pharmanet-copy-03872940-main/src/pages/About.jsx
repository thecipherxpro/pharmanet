import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { 
  Info, 
  Shield, 
  Mail, 
  Phone, 
  Clock, 
  FileText,
  AlertCircle,
  CheckCircle2,
  ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function About() {
  const navigate = useNavigate();

  const { data: currentVersion } = useQuery({
    queryKey: ['currentAppVersion'],
    queryFn: async () => {
      const versions = await base44.entities.AppVersion.filter({ is_current: true });
      return versions[0] || null;
    },
    staleTime: 300000,
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-8">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 md:px-6 py-4 md:py-5">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="sm" 
              className="md:hidden -ml-2"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="w-10 h-10 md:w-12 md:h-12 bg-gray-900 rounded-xl flex items-center justify-center">
              <Info className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900">About</h1>
              <p className="text-xs md:text-sm text-gray-500">App info & support</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 md:px-6 py-6 space-y-6">
        {/* Section 1: About Version */}
        <Card className="border border-gray-200">
          <CardContent className="p-5 md:p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                <FileText className="w-5 h-5 text-gray-700" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">About This Version</h2>
            </div>

            {currentVersion ? (
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-500">Version</span>
                    <span className="font-bold text-gray-900">v{currentVersion.version_number}</span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-500">Release Name</span>
                    <span className="font-medium text-gray-700">{currentVersion.version_name}</span>
                  </div>
                  {currentVersion.pushed_at && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Released</span>
                      <span className="text-sm text-gray-700">
                        {new Date(currentVersion.pushed_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                  )}
                </div>

                {currentVersion.description && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Description</p>
                    <p className="text-gray-700">{currentVersion.description}</p>
                  </div>
                )}

                {currentVersion.features_added && currentVersion.features_added.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-500 mb-2">What's New</p>
                    <ul className="space-y-1.5">
                      {currentVersion.features_added.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                          <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {currentVersion.bugs_fixed && currentVersion.bugs_fixed.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Bug Fixes</p>
                    <ul className="space-y-1.5">
                      {currentVersion.bugs_fixed.map((fix, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                          <CheckCircle2 className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                          {fix}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <p className="text-gray-500 text-sm">Version information not available</p>
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-400 text-center">
                © {new Date().getFullYear()} Pharmanet. All rights reserved.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Dispute Resolution & Support */}
        <Card className="border border-gray-200">
          <CardContent className="p-5 md:p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                <Shield className="w-5 h-5 text-gray-700" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Dispute Resolution & Support</h2>
            </div>

            <div className="space-y-4">
              <p className="text-gray-600 text-sm leading-relaxed">
                We're committed to providing fair and transparent dispute resolution for all users. 
                If you encounter any issues with shifts, payments, or other platform-related matters, 
                our support team is here to help.
              </p>

              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-3">
                <h3 className="font-semibold text-gray-900 text-sm">How to Report a Dispute</h3>
                <ol className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center text-xs font-bold text-gray-700 flex-shrink-0">1</span>
                    Contact our support team via email or phone within 48 hours of the incident.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center text-xs font-bold text-gray-700 flex-shrink-0">2</span>
                    Provide relevant details including shift ID, dates, and a clear description.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center text-xs font-bold text-gray-700 flex-shrink-0">3</span>
                    Our team will review and respond within 2-3 business days.
                  </li>
                </ol>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-white border border-gray-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Mail className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Email Support</span>
                  </div>
                  <a 
                    href="mailto:support@pharmanet.ca" 
                    className="text-gray-900 font-semibold hover:text-blue-600 transition-colors"
                  >
                    support@pharmanet.ca
                  </a>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Phone className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Phone Support</span>
                  </div>
                  <a 
                    href="tel:+14165551234" 
                    className="text-gray-900 font-semibold hover:text-blue-600 transition-colors"
                  >
                    (416) 555-1234
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3">
                <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-800">
                  <strong>Note:</strong> For urgent matters related to active shifts, please call our support line directly for immediate assistance.
                </p>
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-500 pt-2">
                <Clock className="w-4 h-4" />
                <span>Support Hours: Monday - Friday, 9:00 AM - 6:00 PM EST</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}