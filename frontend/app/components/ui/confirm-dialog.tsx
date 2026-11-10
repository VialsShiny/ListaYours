"use client";

import { AlertDialog } from "@base-ui/react/alert-dialog";
import { voice } from "@/content/voice";
import { Button } from "@/components/ui/button";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

/**
 * Centred confirmation used before destructive actions. The confirm button is the accent one.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Supprimer",
  cancelLabel = "Garder",
  busy = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <AlertDialog.Root
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onCancel();
      }}
    >
      <AlertDialog.Portal>
        <AlertDialog.Backdrop className="ly-backdrop" />
        <AlertDialog.Popup className="ly-dialog-popup flex flex-col gap-3.5">
          <AlertDialog.Title className="display-sub">{title}</AlertDialog.Title>
          <AlertDialog.Description className="text-secondary text-soft">
            {description}
          </AlertDialog.Description>
          <div className="mt-2 flex gap-2.5">
            <Button variant="secondary" className="flex-1" onClick={onCancel} disabled={busy}>
              {cancelLabel}
            </Button>
            <Button
              variant="destructive-fill"
              className="flex-1"
              onClick={onConfirm}
              disabled={busy}
            >
              {busy ? voice.errors.wait : confirmLabel}
            </Button>
          </div>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
