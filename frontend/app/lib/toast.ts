import { toast } from "sonner";

/**
 * Thin wrappers around Sonner so components never import the library directly.
 * They only ever report the viewer's own actions: nothing here is derived from other users.
 */
export function notifySuccess(message: string) {
  toast.success(message);
}

export function notifyError(message: string) {
  toast.error(message);
}
