import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CourseFullscreenDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: React.ReactNode;
}

export const CourseFullscreenDialog: React.FC<CourseFullscreenDialogProps> = ({
  open,
  onOpenChange,
  title,
  children,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[100vw] max-w-[100vw] h-[100dvh] max-h-[100dvh] p-0">
        <div className="flex h-full flex-col">
          <DialogHeader className="px-4 py-3 border-b">
            <DialogTitle className="text-base">{title}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 min-h-0 p-4">{children}</div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
