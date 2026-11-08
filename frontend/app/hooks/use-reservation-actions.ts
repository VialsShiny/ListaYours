"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { ApiError, errorMessage } from "@/lib/api";
import { cancelReservation, reserveGift } from "@/lib/api-public";

export const TAKEN_MESSAGE = "Ce cadeau vient d'être réservé par quelqu'un d'autre.";

type Id = number | string;

export type ReservationHandlers = {
  onReserved?: (giftId: Id) => void;
  onCancelled?: (giftId: Id) => void;
  onConflict?: () => void;
};

export type ReservationActions = {
  pendingId: Id | null;
  message: string | null;
  reserve: (giftId: Id) => Promise<boolean>;
  cancel: (giftId: Id) => Promise<boolean>;
  clearMessage: () => void;
};

/**
 * Reserve / cancel helpers shared by the public wishlist and "Mes réservations".
 * `onReserved` / `onCancelled` let the caller patch its local data; `onConflict` runs after a 409.
 */
export function useReservationActions(handlers: ReservationHandlers): ReservationActions {
  const { token } = useAuth();
  const handlersRef = useRef(handlers);
  const [pendingId, setPendingId] = useState<Id | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    handlersRef.current = handlers;
  });

  const reserve = useCallback(
    async (giftId: Id) => {
      if (!token) return false;
      setPendingId(giftId);
      setMessage(null);
      try {
        await reserveGift(giftId, token);
        handlersRef.current.onReserved?.(giftId);
        setMessage("Cadeau réservé. Merci !");
        return true;
      } catch (error) {
        if (error instanceof ApiError && error.status === 409) {
          setMessage(TAKEN_MESSAGE);
          handlersRef.current.onConflict?.();
        } else {
          setMessage(errorMessage(error, "La réservation a échoué."));
        }
        return false;
      } finally {
        setPendingId(null);
      }
    },
    [token],
  );

  const cancel = useCallback(
    async (giftId: Id) => {
      if (!token) return false;
      setPendingId(giftId);
      setMessage(null);
      try {
        await cancelReservation(giftId, token);
        handlersRef.current.onCancelled?.(giftId);
        setMessage("Réservation annulée.");
        return true;
      } catch (error) {
        setMessage(errorMessage(error, "L'annulation a échoué."));
        return false;
      } finally {
        setPendingId(null);
      }
    },
    [token],
  );

  const clearMessage = useCallback(() => setMessage(null), []);

  return { pendingId, message, reserve, cancel, clearMessage };
}
