"use client";

import { useEffect, useRef, useState } from "react";
import { voice } from "@/content/voice";
import { StatusMessage } from "@/components/feedback/StatusMessage";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { GiftImportPreview } from "@/components/dashboard/GiftImportPreview";
import { useMediaQuery } from "@/hooks/use-media-query";
import type { OwnerStore } from "@/hooks/use-owner-data";
import { errorMessage } from "@/lib/api";
import { importGifts } from "@/lib/api-owner";
import { readCsvFile } from "@/lib/csv-file";
import { notifySuccess } from "@/lib/toast";
import type { GiftImportResult } from "@/lib/types";

const TEMPLATE_HREF = "/modele-import.csv";

type Step =
  | { kind: "pick"; error: string | null }
  | { kind: "busy"; label: string }
  | { kind: "preview"; content: string; result: GiftImportResult; error: string | null };

const PICK: Step = { kind: "pick", error: null };

type GiftImportDialogProps = { open: boolean; store: OwnerStore; onClose: () => void };

/**
 * CSV import in three steps: pick a file, read the dry run the API answers, then confirm.
 * Nothing is written before the confirm button, and a 422 with row errors keeps the preview.
 */
export function GiftImportDialog({ open, store, onClose }: GiftImportDialogProps) {
  const t = voice.dashboard.gifts.import;
  const [step, setStep] = useState<Step>(PICK);
  const inputRef = useRef<HTMLInputElement>(null);
  const phone = useMediaQuery("(max-width: 767px)");

  useEffect(() => {
    if (open) setStep(PICK);
  }, [open]);

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setStep({ kind: "busy", label: t.reading });
    let content: string;
    try {
      content = await readCsvFile(file);
    } catch (error) {
      setStep({ kind: "pick", error: errorMessage(error, t.unreadable) });
      return;
    }
    setStep({ kind: "busy", label: t.checking });
    try {
      const result = await importGifts(content, true);
      setStep({ kind: "preview", content, result, error: null });
    } catch (error) {
      setStep({ kind: "pick", error: errorMessage(error, t.failed) });
    }
  }

  async function confirm() {
    if (step.kind !== "preview") return;
    const { content, result: previous } = step;
    const outcome: { result: GiftImportResult | null } = { result: null };
    setStep({ kind: "busy", label: t.importing });
    const run = await store.run(async () => {
      outcome.result = await importGifts(content, false);
      if (outcome.result.errors.length > 0) throw new Error(t.fixFirst);
    }, t.failed);
    if (run.ok && outcome.result) {
      notifySuccess(t.done(outcome.result.created_gifts));
      onClose();
      return;
    }
    setStep({ kind: "preview", content, result: outcome.result ?? previous, error: run.error });
  }

  const canImport =
    step.kind === "preview" && step.result.errors.length === 0 && step.result.valid_rows > 0;

  return (
    <Drawer
      placement={phone ? "bottom" : "right"}
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && step.kind !== "busy") onClose();
      }}
    >
      <DrawerContent className={phone ? "h-[calc(100dvh-64px)]" : ""}>
        <DrawerHeader>
          <DrawerTitle>
            {t.title}
            <span className="period" aria-hidden="true">
              .
            </span>
          </DrawerTitle>
          <DrawerDescription>{t.intro}</DrawerDescription>
        </DrawerHeader>
        <DrawerBody className="flex flex-col gap-6">
          <input
            ref={inputRef}
            type="file"
            accept=".csv,.txt,text/csv,text/plain"
            className="hidden"
            aria-label={t.choose}
            onChange={handleFile}
          />
          {step.kind === "pick" ? (
            <>
              <a href={TEMPLATE_HREF} download className="btn btn-text btn-text-accent self-start">
                {t.template}
              </a>
              <StatusMessage message={step.error} tone="error" />
            </>
          ) : null}
          {step.kind === "busy" ? <StatusMessage message={step.label} /> : null}
          {step.kind === "preview" ? (
            <>
              <GiftImportPreview result={step.result} />
              <StatusMessage message={step.error} tone="error" />
            </>
          ) : null}
        </DrawerBody>
        <DrawerFooter>
          <Button
            variant="secondary"
            className="flex-1"
            disabled={step.kind === "busy" || store.busy}
            onClick={() => (step.kind === "preview" ? inputRef.current?.click() : onClose())}
          >
            {step.kind === "preview" ? t.another : t.cancel}
          </Button>
          <Button
            variant="primary"
            className="flex-[1.6]"
            disabled={step.kind === "busy" || store.busy || (step.kind === "preview" && !canImport)}
            onClick={() => (step.kind === "preview" ? void confirm() : inputRef.current?.click())}
          >
            {step.kind === "busy"
              ? voice.errors.wait
              : step.kind === "preview"
                ? t.confirm
                : t.choose}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
