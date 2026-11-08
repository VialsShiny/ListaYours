"use client";

import { AlertDialog } from "@base-ui/react/alert-dialog";
import { Button } from "@/components/ui/button";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

/**
 * Modal confirmation used before destructive owner actions.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Supprimer",
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
        <AlertDialog.Backdrop className="ly-drawer-backdrop" />
        <AlertDialog.Popup className="ly-dialog-popup p-6 md:p-8">
          <p className="micro mb-3 text-ink-soft">Confirmation</p>
          <AlertDialog.Title className="display display-card mb-3">{title}</AlertDialog.Title>
          <AlertDialog.Description className="text-sm text-ink-soft">
            {description}
          </AlertDialog.Description>
          <div className="hairline mt-6 flex flex-wrap justify-end gap-3 pt-4">
            <Button variant="outline" onClick={onCancel} disabled={busy}>
              Annuler
            </Button>
            <Button variant="primary" onClick={onConfirm} disabled={busy}>
              {busy ? "Suppression…" : confirmLabel}
            </Button>
          </div>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
