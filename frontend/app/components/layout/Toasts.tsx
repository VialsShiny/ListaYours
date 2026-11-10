"use client";

import { Toaster } from "sonner";

/**
 * Sonner toaster: short enter/exit, stackable, bottom centre, above the mobile sticky bar.
 * Movement is dropped by Sonner itself under reduced motion.
 */
export function Toasts() {
  return (
    <Toaster
      position="bottom-center"
      duration={3200}
      gap={10}
      offset={16}
      mobileOffset={{ bottom: 88, left: 16, right: 16 }}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast: "toast",
          icon: "toast-icon",
          title: "toast-title",
          description: "toast-description",
          error: "toast-error",
          success: "toast-success",
        },
      }}
    />
  );
}
