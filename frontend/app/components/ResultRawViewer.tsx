"use client";

import {
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ResultRawViewerProps = {
  json: unknown;
  className?: string;
};

/**
 * "Voir le résultat brut" drawer showing the raw scraper JSON next to the product preview.
 */
export default function ResultRawViewer({ json, className }: ResultRawViewerProps) {
  return (
    <Drawer>
      <DrawerTrigger className={cn(buttonVariants({ variant: "ghost" }), "self-start", className)}>
        Voir le résultat brut →
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <p className="eyebrow">Scraper</p>
          <DrawerTitle>Résultat brut</DrawerTitle>
          <DrawerDescription>Données renvoyées par l&apos;API, telles quelles.</DrawerDescription>
        </DrawerHeader>
        <DrawerBody className="bg-tile">
          {json ? (
            <pre className="text-micro overflow-auto leading-6 text-ink">
              {JSON.stringify(json, null, 2)}
            </pre>
          ) : (
            <p className="text-secondary text-soft">Aucune donnée disponible.</p>
          )}
        </DrawerBody>
        <DrawerFooter>
          <DrawerClose className={buttonVariants({ variant: "primary" })}>Fermer</DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
