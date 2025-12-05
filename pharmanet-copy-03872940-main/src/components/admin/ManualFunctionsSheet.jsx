import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Play,
  CheckCircle,
  XCircle,
  Loader2,
  Clock,
  Calendar,
  RefreshCw,
  AlertTriangle
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function ManualFunctionsSheet({ open, onOpenChange, category }) {
  const [runningFunction, setRunningFunction] = useState(null);
  const [results, setResults] = useState({});
  const { toast } = useToast();

  const shiftFunctions = [
    {
      id: "autoCloseExpiredShifts",
      name: "Auto-Close Expired Shifts",
      description: "Closes all open shifts where all scheduled dates have passed",
      icon: Clock,
      color: "bg-amber-100 text-amber-700",
      dangerous: false
    },
    {
      id: "cronAutoCloseShifts",
      name: "Cron Auto-Close (with Notifications)",
      description: "Closes expired shifts and sends notifications to employers",
      icon: RefreshCw,
      color: "bg-blue-100 text-blue-700",
      dangerous: false
    }
  ];

  const getFunctions = () => {
    switch (category) {
      case "shifts":
        return shiftFunctions;
      default:
        return [];
    }
  };

  const runFunction = async (funcId) => {
    setRunningFunction(funcId);
    setResults(prev => ({ ...prev, [funcId]: { status: 'running' } }));

    try {
      const response = await base44.functions.invoke(funcId, {});
      
      setResults(prev => ({
        ...prev,
        [funcId]: {
          status: 'success',
          data: response.data,
          timestamp: new Date().toISOString()
        }
      }));

      toast({
        title: "Function Completed",
        description: response.data?.message || "Function executed successfully"
      });
    } catch (error) {
      setResults(prev => ({
        ...prev,
        [funcId]: {
          status: 'error',
          error: error.message,
          timestamp: new Date().toISOString()
        }
      }));

      toast({
        variant: "destructive",
        title: "Function Failed",
        description: error.message
      });
    } finally {
      setRunningFunction(null);
    }
  };

  const functions = getFunctions();
  const categoryTitle = category === "shifts" ? "Shift Management" : "Functions";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="mb-6 border-b border-zinc-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-zinc-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-zinc-700" />
            </div>
            <div>
              <SheetTitle className="text-lg font-bold">{categoryTitle}</SheetTitle>
              <p className="text-xs text-zinc-500">Run manual functions</p>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-4">
          {functions.map((func) => {
            const Icon = func.icon;
            const result = results[func.id];
            const isRunning = runningFunction === func.id;

            return (
              <div
                key={func.id}
                className="border border-zinc-200 rounded-xl p-4 bg-white"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${func.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm text-zinc-900">{func.name}</h4>
                    <p className="text-xs text-zinc-500 mt-0.5">{func.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() => runFunction(func.id)}
                    disabled={isRunning}
                  >
                    {isRunning ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                        Running...
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 mr-2" />
                        Run Function
                      </>
                    )}
                  </Button>

                  {result && (
                    <Badge
                      variant="outline"
                      className={
                        result.status === 'success'
                          ? "bg-green-50 text-green-700 border-green-200"
                          : result.status === 'error'
                          ? "bg-red-50 text-red-700 border-red-200"
                          : "bg-zinc-100 text-zinc-600"
                      }
                    >
                      {result.status === 'success' && <CheckCircle className="w-3 h-3 mr-1" />}
                      {result.status === 'error' && <XCircle className="w-3 h-3 mr-1" />}
                      {result.status === 'running' && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                      {result.status}
                    </Badge>
                  )}
                </div>

                {/* Result Details */}
                {result && result.status !== 'running' && (
                  <div className="mt-3 p-3 bg-zinc-50 rounded-lg border border-zinc-100">
                    <p className="text-[10px] text-zinc-400 mb-2">
                      {new Date(result.timestamp).toLocaleString()}
                    </p>
                    
                    {result.status === 'success' && result.data && (
                      <div className="space-y-2">
                        {result.data.message && (
                          <p className="text-xs text-zinc-700">{result.data.message}</p>
                        )}
                        {result.data.closed_count !== undefined && (
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-[10px]">
                              {result.data.closed_count} shifts closed
                            </Badge>
                            {result.data.notified_count !== undefined && (
                              <Badge variant="secondary" className="text-[10px]">
                                {result.data.notified_count} notified
                              </Badge>
                            )}
                          </div>
                        )}
                        {result.data.closed_shifts && result.data.closed_shifts.length > 0 && (
                          <div className="mt-2 max-h-32 overflow-y-auto">
                            <p className="text-[10px] font-medium text-zinc-500 mb-1">Closed Shifts:</p>
                            {result.data.closed_shifts.slice(0, 5).map((shift, i) => (
                              <div key={i} className="text-[10px] text-zinc-600 py-0.5">
                                • {shift.pharmacy_name} ({shift.primary_date || shift.shift_date || 'N/A'})
                              </div>
                            ))}
                            {result.data.closed_shifts.length > 5 && (
                              <p className="text-[10px] text-zinc-400 mt-1">
                                +{result.data.closed_shifts.length - 5} more...
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {result.status === 'error' && (
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-3.5 h-3.5 text-red-500 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-red-600">{result.error}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {functions.length === 0 && (
            <div className="text-center py-8 text-zinc-500">
              <p className="text-sm">No functions available for this category</p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}