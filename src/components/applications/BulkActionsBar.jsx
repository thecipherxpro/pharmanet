import React from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function BulkActionsBar({ 
  selectedCount, 
  onAcceptSelected, 
  onRejectSelected, 
  onClearSelection,
  isProcessing 
}) {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-20 left-0 right-0 z-30 px-4 animate-in slide-in-from-bottom-5">
      <div className="max-w-4xl mx-auto">
        <div className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-2xl shadow-2xl p-4 border-2 border-white">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Badge className="bg-white text-teal-700 font-bold text-sm px-3 py-1">
                {selectedCount} Selected
              </Badge>
              <button
                onClick={onClearSelection}
                className="text-white/80 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                onClick={onRejectSelected}
                disabled={isProcessing}
                variant="outline"
                size="sm"
                className="bg-white/10 border-white/30 text-white hover:bg-white/20 h-9"
              >
                <XCircle className="w-4 h-4 mr-1.5" />
                Reject
              </Button>
              <Button
                onClick={onAcceptSelected}
                disabled={isProcessing}
                size="sm"
                className="bg-white text-teal-700 hover:bg-white/90 h-9 font-semibold"
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-teal-700 border-t-transparent rounded-full animate-spin mr-1.5" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-1.5" />
                    Accept
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}