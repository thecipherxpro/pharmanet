import React from "react";
import { ArrowLeft, MoreVertical, Edit, Trash2, Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function EmployerDrawerHeader({ shift, onClose, onEdit, onDelete }) {
  return (
    <div className="px-4 py-3 border-b border-gray-200 bg-white sticky top-0 z-10 flex items-center gap-3">
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={onClose}
        className="h-9 w-9 rounded-full hover:bg-gray-100 -ml-2"
      >
        <ArrowLeft className="w-5 h-5 text-gray-600" />
      </Button>

      <div className="flex-1 min-w-0">
        <h2 className="font-bold text-gray-900 truncate text-base">
          Shift Details
        </h2>
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <Building2 className="w-3 h-3" />
          <span className="truncate">{shift.pharmacy_name}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Badge variant={shift.status === 'open' ? 'default' : 'secondary'} className="capitalize">
          {shift.status}
        </Badge>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
              <MoreVertical className="w-4 h-4 text-gray-600" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>
              <Edit className="w-4 h-4 mr-2" />
              Edit Shift
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDelete} className="text-red-600">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Shift
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}