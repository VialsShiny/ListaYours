"use client";

import * as React from "react";
import { Drawer as DrawerPrimitive } from "@base-ui/react/drawer";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type DrawerRootProps = DrawerPrimitive.Root.Props & { placement?: "right" | "bottom" };

const PlacementContext = React.createContext<"right" | "bottom">("right");

/**
 * Side panel (560px on the right) or bottom sheet, both swipeable to dismiss.
 * Enter/exit motion lives in `styles/overlays.css`; reduced motion turns it into a fade.
 */
function Drawer({ placement = "right", ...props }: DrawerRootProps) {
  return (
    <PlacementContext.Provider value={placement}>
      <DrawerPrimitive.Root
        data-slot="drawer"
        swipeDirection={placement === "bottom" ? "down" : "right"}
        {...props}
      />
    </PlacementContext.Provider>
  );
}

function DrawerTrigger(props: DrawerPrimitive.Trigger.Props) {
  return <DrawerPrimitive.Trigger data-slot="drawer-trigger" {...props} />;
}

function DrawerClose(props: DrawerPrimitive.Close.Props) {
  return <DrawerPrimitive.Close data-slot="drawer-close" {...props} />;
}

function DrawerContent({ className, children, ...props }: DrawerPrimitive.Popup.Props) {
  const placement = React.useContext(PlacementContext);
  return (
    <DrawerPrimitive.Portal data-slot="drawer-portal">
      <DrawerPrimitive.Backdrop data-slot="drawer-overlay" className="ly-backdrop" />
      <DrawerPrimitive.Viewport
        data-slot="drawer-viewport"
        className="pointer-events-none fixed inset-0 z-50"
      >
        <DrawerPrimitive.Popup
          data-slot="drawer-popup"
          className={cn(
            placement === "bottom" ? "ly-sheet-popup" : "ly-drawer-popup",
            "pointer-events-auto",
            className,
          )}
          {...props}
        >
          {placement === "bottom" ? <span aria-hidden="true" className="sheet-handle" /> : null}
          <DrawerPrimitive.Content
            data-slot="drawer-content"
            className="flex min-h-0 flex-1 flex-col overflow-hidden"
          >
            {children}
          </DrawerPrimitive.Content>
        </DrawerPrimitive.Popup>
      </DrawerPrimitive.Viewport>
    </DrawerPrimitive.Portal>
  );
}

function DrawerHeader({ className, children, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="drawer-header"
      className={cn(
        "flex shrink-0 items-center justify-between gap-4 px-4 py-4 md:px-10 md:pt-8",
        className,
      )}
      {...props}
    >
      <div className="flex min-w-0 flex-col gap-1">{children}</div>
      <DrawerClose className="btn btn-icon shrink-0" aria-label="Fermer le panneau">
        <X aria-hidden="true" />
      </DrawerClose>
    </div>
  );
}

function DrawerBody({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="drawer-body"
      className={cn("min-h-0 flex-1 overflow-y-auto px-4 py-4 md:px-10", className)}
      {...props}
    />
  );
}

function DrawerFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="drawer-footer"
      className={cn(
        "flex shrink-0 items-center gap-3 border-t border-line bg-card px-4 py-3 md:px-10 md:py-6",
        className,
      )}
      {...props}
    />
  );
}

function DrawerTitle({ className, ...props }: DrawerPrimitive.Title.Props) {
  return (
    <DrawerPrimitive.Title
      data-slot="drawer-title"
      className={cn("display display-sub", className)}
      {...props}
    />
  );
}

function DrawerDescription({ className, ...props }: DrawerPrimitive.Description.Props) {
  return (
    <DrawerPrimitive.Description
      data-slot="drawer-description"
      className={cn("text-secondary text-soft", className)}
      {...props}
    />
  );
}

export {
  Drawer,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
};
