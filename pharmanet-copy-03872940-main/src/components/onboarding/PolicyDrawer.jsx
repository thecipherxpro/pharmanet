import React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText } from "lucide-react";

export default function PolicyDrawer({ open, onClose, policy }) {
  if (!policy) return null;

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[85vh] sm:h-[90vh]">
        <SheetHeader className="mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <SheetTitle className="text-lg">{policy.title}</SheetTitle>
              <SheetDescription className="text-xs">
                Effective: {policy.effectiveDate} • Version {policy.version}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <ScrollArea className="h-[calc(100%-80px)] pr-4">
          <div className="prose prose-sm max-w-none">
            <div dangerouslySetInnerHTML={{ __html: policy.content }} />
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}