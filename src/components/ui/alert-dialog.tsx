import * as React from "react";
import { cn } from "@/lib/utils";

interface AlertDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  cancelText?: string;
  confirmText?: string;
  onConfirm?: () => void;
  variant?: "default" | "destructive";
  children?: React.ReactNode;
}

const AlertDialog: React.FC<AlertDialogProps> = ({
  open,
  onClose,
  title,
  description,
  cancelText = "取消",
  confirmText = "确认",
  onConfirm,
  variant = "default",
  children,
}) => {
  if (!open) return null;

  const handleConfirm = () => {
    if (onConfirm) onConfirm();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={cn(
          "relative w-full max-w-md rounded-lg p-6 shadow-lg sm:max-w-lg",
          variant === "default" ? "bg-background" : "bg-destructive",
          variant === "default" ? "text-foreground" : "text-destructive-foreground"
        )}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <h2
          id="alert-dialog-title"
          className="text-lg font-semibold leading-none tracking-tight"
        >
          {title}
        </h2>
        {description && (
          <p
            id="alert-dialog-description"
            className="mt-2 text-sm text-muted-foreground"
          >
            {description}
          </p>
        )}
        {children && <div className="mt-4">{children}</div>}
        <div className="mt-6 flex justify-end space-x-2">
          <button
            className={cn(
              "inline-flex h-9 items-center justify-center rounded-md px-3 text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
              "border border-input bg-background hover:bg-accent hover:text-accent-foreground"
            )}
            onClick={onClose}
          >
            {cancelText}
          </button>
          {onConfirm && (
            <button
              className={cn(
                "inline-flex h-9 items-center justify-center rounded-md px-3 text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                variant === "default"
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "bg-destructive text-destructive-foreground hover:bg-destructive/90"
              )}
              onClick={handleConfirm}
            >
              {confirmText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export { AlertDialog };