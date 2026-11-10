"use client";

import { useEffect, useState } from "react";
import { StatusMessage } from "@/components/feedback/StatusMessage";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { GiftFormFields } from "@/components/dashboard/GiftFormFields";
import { ScrapePrefill } from "@/components/dashboard/ScrapePrefill";
import { useMediaQuery } from "@/hooks/use-media-query";
import type { OwnerStore } from "@/hooks/use-owner-data";
import { createGift, updateGift } from "@/lib/api-owner";
import {
  EMPTY_GIFT_FORM,
  giftFormToPayload,
  giftToFormValues,
  validateGiftForm,
  type GiftFormValues,
} from "@/lib/gift-form";
import type { Category, OwnerGift } from "@/lib/types";

type GiftFormDrawerProps = {
  open: boolean;
  gift: OwnerGift | null;
  categories: Category[];
  store: OwnerStore;
  onClose: () => void;
};

/**
 * Add / edit gift form: a 560px right-hand drawer on desktop, a bottom sheet on phones.
 */
export function GiftFormDrawer({ open, gift, categories, store, onClose }: GiftFormDrawerProps) {
  const [values, setValues] = useState<GiftFormValues>(EMPTY_GIFT_FORM);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const phone = useMediaQuery("(max-width: 767px)");
  const formId = "gift-form";

  useEffect(() => {
    if (!open) return;
    setValues(gift ? giftToFormValues(gift) : EMPTY_GIFT_FORM);
    setError(null);
  }, [open, gift]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const problem = validateGiftForm(values);
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    setSaving(true);
    const payload = giftFormToPayload(values);
    const result = await store.run(
      (token) => (gift ? updateGift(token, gift.id, payload) : createGift(token, payload)),
      "L'enregistrement du cadeau a échoué.",
    );
    setSaving(false);
    if (result.ok) onClose();
    else setError(result.error);
  }

  return (
    <Drawer
      placement={phone ? "bottom" : "right"}
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
    >
      <DrawerContent aria-describedby={undefined} className={phone ? "h-[calc(100dvh-64px)]" : ""}>
        <DrawerHeader>
          <DrawerTitle>
            {gift ? "Modifier le cadeau" : "Ajouter un cadeau"}
            <span className="period" aria-hidden="true">
              .
            </span>
          </DrawerTitle>
        </DrawerHeader>
        <DrawerBody className="flex flex-col gap-6">
          <ScrapePrefill
            initialUrl={values.purchase_url}
            onPrefill={(next) => setValues((current) => next(current))}
          />
          <form id={formId} onSubmit={handleSubmit} className="flex flex-col gap-5">
            <GiftFormFields values={values} categories={categories} onChange={setValues} />
            <StatusMessage message={error} tone="error" />
          </form>
        </DrawerBody>
        <DrawerFooter>
          <DrawerClose className="btn btn-secondary flex-1">Annuler</DrawerClose>
          <Button
            type="submit"
            form={formId}
            variant="primary"
            className="flex-[1.6]"
            disabled={saving || store.busy}
          >
            {saving ? "Enregistrement…" : gift ? "Enregistrer" : "Enregistrer le cadeau"}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
