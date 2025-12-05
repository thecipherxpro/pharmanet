/**
 * Standardized toast notification helpers
 * Consistent messaging across the app
 */

export const ToastMessages = {
  // Success messages
  success: {
    shiftPosted: {
      title: "✓ Shift Posted",
      description: "Your shift is now live and visible to pharmacists.",
      duration: 4000
    },
    shiftUpdated: {
      title: "✓ Shift Updated",
      description: "Changes saved successfully.",
      duration: 3000
    },
    shiftDeleted: {
      title: "✓ Shift Deleted",
      description: "The shift has been removed.",
      duration: 3000
    },
    applicationAccepted: {
      title: "✓ Application Accepted",
      description: "Pharmacist assigned - $50 fee charged.",
      duration: 5000
    },
    applicationRejected: {
      title: "✓ Application Rejected",
      description: "The applicant has been notified.",
      duration: 3000
    },
    applicationWithdrawn: {
      title: "✓ Application Withdrawn",
      description: "Your application has been withdrawn.",
      duration: 3000
    },
    invitationSent: {
      title: "✓ Invitation Sent",
      description: "The pharmacist will be notified via email.",
      duration: 4000
    },
    invitationAccepted: {
      title: "✓ Invitation Accepted",
      description: "You've been assigned to this shift!",
      duration: 4000
    },
    profileUpdated: {
      title: "✓ Profile Updated",
      description: "Your changes have been saved.",
      duration: 3000
    },
    cardAdded: {
      title: "✓ Card Added",
      description: "Payment method added successfully.",
      duration: 3000
    },
    pharmacyAdded: {
      title: "✓ Pharmacy Added",
      description: "New pharmacy location created.",
      duration: 3000
    }
  },
  
  // Error messages
  error: {
    generic: {
      variant: "destructive",
      title: "Error",
      description: "Something went wrong. Please try again.",
      duration: 4000
    },
    network: {
      variant: "destructive",
      title: "Connection Error",
      description: "Please check your internet connection and try again.",
      duration: 5000
    },
    unauthorized: {
      variant: "destructive",
      title: "Access Denied",
      description: "You don't have permission for this action.",
      duration: 4000
    },
    validation: {
      variant: "destructive",
      title: "Validation Error",
      description: "Please check all required fields.",
      duration: 4000
    },
    payment: {
      variant: "destructive",
      title: "Payment Failed",
      description: "Please update your payment method and try again.",
      duration: 6000
    }
  },
  
  // Info messages
  info: {
    saving: {
      title: "Saving...",
      description: "Please wait while we save your changes.",
      duration: 2000
    },
    loading: {
      title: "Loading...",
      description: "Fetching data...",
      duration: 2000
    }
  }
};

/**
 * Helper to show toast with custom message
 */
export function showToast(toast, type, customMessage = null) {
  const message = customMessage || ToastMessages.success[type] || ToastMessages.error.generic;
  toast(message);
}