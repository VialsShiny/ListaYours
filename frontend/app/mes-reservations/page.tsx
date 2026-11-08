import type { Metadata } from "next";
import { ReservationsView } from "@/components/reservations/ReservationsView";

export const metadata: Metadata = { title: "Mes réservations" };

export default function MyReservationsPage() {
  return <ReservationsView />;
}
