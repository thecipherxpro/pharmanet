import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Award, Briefcase, CheckCircle, X, Trophy } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

export default function CompareApplicantsModal({ 
  open, 
  onClose, 
  applications,
  profiles,
  onSelectApplicant,
  getInitials,
  maxCompare = 3
}) {
  if (!applications || applications.length === 0) return null;

  const selectedApplicants = applications.slice(0, maxCompare);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="px-4 pt-4 pb-3 border-b">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>Compare Applicants ({selectedApplicants.length})</DialogTitle>
              <p className="text-sm text-gray-600 mt-1">
                Select up to {maxCompare} applicants to compare side-by-side
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          {selectedApplicants.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 flex items-center gap-2 mt-3">
              <Trophy className="w-4 h-4 text-amber-600" />
              <p className="text-xs text-amber-800 font-medium">
                Best match highlighted in gold
              </p>
            </div>
          )}
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-80px)]">
          <div className="p-4">
            {/* Desktop: Side-by-side */}
            <div className="hidden md:flex md:gap-4">
              {selectedApplicants.map((app, index) => {
                const profile = profiles.find(p => p.pharmacist_email === app.pharmacist_email);
                
                const score = (profile?.years_experience || 0) * 10 + 
                             (profile?.completed_shifts || 0) * 5 + 
                             (profile?.rating || 0) * 20;
                const scores = selectedApplicants.map(a => {
                  const p = profiles.find(pf => pf.pharmacist_email === a.pharmacist_email);
                  return (p?.years_experience || 0) * 10 + (p?.completed_shifts || 0) * 5 + (p?.rating || 0) * 20;
                });
                const isBestMatch = score === Math.max(...scores) && selectedApplicants.length > 1;
                
                return (
                  <Card key={app.id} className={`flex-1 min-w-[250px] ${isBestMatch ? 'border-2 border-amber-400 bg-amber-50/30' : ''}`}>
                    <CardHeader className="pb-3">
                      {isBestMatch && (
                        <div className="mb-3 bg-gradient-to-r from-amber-400 to-yellow-400 text-white px-3 py-1.5 rounded-lg flex items-center gap-2 justify-center">
                          <Trophy className="w-4 h-4" />
                          <span className="text-xs font-bold">BEST MATCH</span>
                        </div>
                      )}
                      
                      <div className="flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-full flex items-center justify-center text-white font-bold text-xl mb-3">
                          {getInitials(app.pharmacist_name)}
                        </div>
                        <h4 className="font-bold text-gray-900">{app.pharmacist_name}</h4>
                        <p className="text-xs text-gray-600 truncate w-full">{app.pharmacist_email}</p>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-3">
                      {profile?.rating > 0 && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Rating:</span>
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                            <span className="font-bold">{profile.rating.toFixed(1)}</span>
                          </div>
                        </div>
                      )}
                      
                      {profile?.years_experience > 0 && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Experience:</span>
                          <span className="font-bold">{profile.years_experience} years</span>
                        </div>
                      )}
                      
                      {profile?.completed_shifts > 0 && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Completed:</span>
                          <span className="font-bold">{profile.completed_shifts} shifts</span>
                        </div>
                      )}

                      {profile?.license_verified && (
                        <Badge className="w-full justify-center bg-green-50 text-green-700 border-green-200">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Verified License
                        </Badge>
                      )}

                      <Button
                        onClick={() => {
                          onSelectApplicant(app);
                          onClose();
                        }}
                        className="w-full bg-teal-600 hover:bg-teal-700 mt-4"
                      >
                        View Full Profile
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Mobile: Stacked */}
            <div className="md:hidden space-y-3">
              {selectedApplicants.map((app, index) => {
                const profile = profiles.find(p => p.pharmacist_email === app.pharmacist_email);
                
                const score = (profile?.years_experience || 0) * 10 + 
                             (profile?.completed_shifts || 0) * 5 + 
                             (profile?.rating || 0) * 20;
                const scores = selectedApplicants.map(a => {
                  const p = profiles.find(pf => pf.pharmacist_email === a.pharmacist_email);
                  return (p?.years_experience || 0) * 10 + (p?.completed_shifts || 0) * 5 + (p?.rating || 0) * 20;
                });
                const isBestMatch = score === Math.max(...scores) && selectedApplicants.length > 1;
                
                return (
                  <Card key={app.id} className={`${isBestMatch ? 'border-2 border-amber-400 bg-amber-50/30' : ''}`}>
                    <CardContent className="p-3">
                      {isBestMatch && (
                        <div className="mb-3 bg-gradient-to-r from-amber-400 to-yellow-400 text-white px-3 py-1.5 rounded-lg flex items-center gap-2 justify-center">
                          <Trophy className="w-4 h-4" />
                          <span className="text-xs font-bold">BEST MATCH</span>
                        </div>
                      )}
                      
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                          {getInitials(app.pharmacist_name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-gray-900 text-sm">{app.pharmacist_name}</h4>
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {profile?.rating > 0 && (
                              <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                                <Star className="w-3 h-3 mr-1 fill-amber-500" />
                                {profile.rating.toFixed(1)}
                              </Badge>
                            )}
                            {profile?.years_experience > 0 && (
                              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                {profile.years_experience}y exp
                              </Badge>
                            )}
                            {profile?.completed_shifts > 0 && (
                              <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                {profile.completed_shifts} shifts
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <Button
                        onClick={() => {
                          onSelectApplicant(app);
                          onClose();
                        }}
                        className="w-full bg-teal-600 hover:bg-teal-700"
                        size="sm"
                      >
                        View Details
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}