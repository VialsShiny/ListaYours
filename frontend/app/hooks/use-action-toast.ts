"use client";

import { useEffect } from "react";
import type { ActionMessage } from "@/hooks/use-reservation-actions";
import { notifyError, notifySuccess } from "@/lib/toast";

/**
 * Shows each new action message as a toast, once (keyed by its id).
 */
export function useActionToast(message: ActionMessage | null) {
  useEffect(() => {
    if (!message) return;
    if (message.tone === "error") notifyError(message.text);
    else notifySuccess(message.text);
  }, [message]);
}
