"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { voice } from "@/content/voice";
import { useAuth } from "@/hooks/use-auth";
import { ApiError, errorMessage } from "@/lib/api";
import { cancelReservation, reserveGift } from "@/lib/api-public";

export const TAKEN_MESSAGE = voice.list.toastTaken;

type Id = number | string;

export type ActionMessage = { id: number; text: string; tone: "success" | "error" };

export type ReservationHandlers = {
  onReserved?: (giftId: Id) => void;
  onCancelled?: (giftId: Id) => void;
  onConflict?: () => void;
};

export type ReservationActions = {
  pendingId: Id | null;
  message: ActionMessage | null;
  reserve: (giftId: Id) => Promise<boolean>;
  cancel: (giftId: Id) => Promise<boolean>;
  clearMessage: () => void;
};

/**
 * Reserve / cancel helpers shared by the public wishlist and "Mes réservations".
 * `onReserved` / `onCancelled` let the caller patch its local data; `onConflict` runs after a 409.
 * Every message carries a tone and an id so the caller can show it as a toast exactly once.
 */
export function useReservationActions(handlers: ReservationHandlers): ReservationActions {
  const { token } = useAuth();
  const handlersRef = useRef(handlers);
  const counter = useRef(0);
  const [pendingId, setPendingId] = useState<Id | null>(null);
  const [message, setMessage] = useState<ActionMessage | null>(null);

  useEffect(() => {
    handlersRef.current = handlers;
  });

  const say = useCallback((text: string, tone: ActionMessage["tone"]) => {
    counter.current += 1;
    setMessage({ id: counter.current, text, tone });
  }, []);

  const reserve = useCallback(
    async (giftId: Id) => {
      if (!token) return false;
      setPendingId(giftId);
      try {
        await reserveGift(giftId, token);
        handlersRef.current.onReserved?.(giftId);
        say(voice.list.toastReserved, "success");
        return true;
      } catch (error) {
        if (error instanceof ApiError && error.status === 409) {
          say(TAKEN_MESSAGE, "error");
          handlersRef.current.onConflict?.();
        } else {
          say(errorMessage(error, voice.list.reserveFailed), "error");
        }
        return false;
      } finally {
        setPendingId(null);
      }
    },
    [token, say],
  );

  const cancel = useCallback(
    async (giftId: Id) => {
      if (!token) return false;
      setPendingId(giftId);
      try {
        await cancelReservation(giftId, token);
        handlersRef.current.onCancelled?.(giftId);
        say(voice.list.toastCancelled, "success");
        return true;
      } catch (error) {
        say(errorMessage(error, voice.list.cancelFailed), "error");
        return false;
      } finally {
        setPendingId(null);
      }
    },
    [token, say],
  );

  const clearMessage = useCallback(() => setMessage(null), []);

  return { pendingId, message, reserve, cancel, clearMessage };
}
