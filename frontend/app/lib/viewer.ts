import type { ViewerRole } from "@/components/wishlist/ReservationControl";
import type { AuthStatus } from "@/hooks/use-auth";

type ViewerInput = {
  status: AuthStatus;
  isOwner: boolean;
  reservationsVisible: boolean | undefined;
};

/**
 * Who the public list is rendered for. The API hides reservations from the list's owner
 * (`reservations_visible: false`); that answer alone also selects the owner view, so a stale or
 * missing local profile can never show reservation states the API meant to mask.
 */
export function resolveViewer({ status, isOwner, reservationsVisible }: ViewerInput): ViewerRole {
  if (isOwner || reservationsVisible === false) return "owner";
  return status === "authenticated" ? "visitor" : "anonymous";
}
