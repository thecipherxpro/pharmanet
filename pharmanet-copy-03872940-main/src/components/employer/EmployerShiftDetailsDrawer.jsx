import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import DeleteShiftModal from "../shift/DeleteShiftModal";

// Import new components
import EmployerDrawerHeader from "../shift/employer-drawer/EmployerDrawerHeader";
import EmployerDrawerStats from "../shift/employer-drawer/EmployerDrawerStats";
import EmployerDrawerShiftInfo from "../shift/employer-drawer/EmployerDrawerShiftInfo";
import EmployerDrawerPharmacy from "../shift/employer-drawer/EmployerDrawerPharmacy";
import EmployerDrawerActions from "../shift/employer-drawer/EmployerDrawerActions";
import EmployerDrawerSkeleton from "../shift/employer-drawer/EmployerDrawerSkeleton";

export default function EmployerShiftDetailsDrawer({ open, onClose, shift, onEditClick }) {
  const navigate = useNavigate();
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const { data: applications = [], isLoading: appsLoading } = useQuery({
    queryKey: ['shiftApplications', shift?.id],
    queryFn: () => base44.entities.ShiftApplication.filter({ shift_id: shift.id }),
    enabled: !!shift?.id && open,
    initialData: []
  });

  const { data: pharmacy, isLoading: pharmacyLoading } = useQuery({
    queryKey: ['pharmacy', shift?.pharmacy_id],
    queryFn: async () => {
      const pharmacies = await base44.entities.Pharmacy.filter({ id: shift.pharmacy_id });
      return pharmacies[0];
    },
    enabled: !!shift?.pharmacy_id && open
  });

  const handleViewApplications = () => {
    navigate(createPageUrl("ManageApplications"));
    onClose();
  };

  const handleEdit = () => {
    if (onEditClick) {
      onEditClick(shift);
    } else {
      navigate(createPageUrl("EditShift") + `?id=${shift.id}`);
      onClose();
    }
  };

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const handleViewFullDetails = () => {
    navigate(createPageUrl("FilledShiftDetails") + `?id=${shift.id}`);
    onClose();
  };

  if (!shift) return null;
  
  const isLoading = appsLoading || pharmacyLoading;

  return (
    <>
      <Sheet open={open} onOpenChange={onClose}>
        <SheetContent 
          side="right" 
          className="w-full sm:max-w-md p-0 overflow-hidden flex flex-col bg-gray-50"
        >
          {isLoading ? (
            <EmployerDrawerSkeleton />
          ) : (
            <>
              <EmployerDrawerHeader 
                shift={shift} 
                onClose={onClose}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />

              <div className="flex-1 overflow-y-auto p-4 space-y-5">
                {shift.status === 'open' && (
                  <EmployerDrawerStats 
                    applications={applications} 
                    onViewApplications={handleViewApplications}
                  />
                )}

                <EmployerDrawerShiftInfo shift={shift} />
                
                <EmployerDrawerPharmacy pharmacy={pharmacy} />
              </div>

              <EmployerDrawerActions 
                onEdit={handleEdit}
                onViewFullDetails={handleViewFullDetails}
                showFullDetails={shift.status !== 'open'}
              />
            </>
          )}
        </SheetContent>
      </Sheet>

      <DeleteShiftModal
        shift={shift}
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onSuccess={() => {
          setShowDeleteModal(false);
          onClose();
        }}
      />
    </>
  );
}