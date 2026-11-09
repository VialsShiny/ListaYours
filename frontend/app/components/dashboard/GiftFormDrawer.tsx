"use client";

import { useEffect, useState } from "react";
import { StatusMessage } from "@/components/feedback/StatusMessage";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { GiftFormFields } from "@/components/dashboard/GiftFormFields";
import { ScrapePrefill } from "@/components/dashboard/ScrapePrefill";
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

export function GiftFormDrawer({ open, gift, categories, store, onClose }: GiftFormDrawerProps) {
  const [values, setValues] = useState<GiftFormValues>(EMPTY_GIFT_FORM);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
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
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
    >
      <DrawerContent aria-describedby={undefined}>
        <DrawerHeader>
          <p className="eyebrow">{gift ? "Modification" : "Nouveau cadeau"}</p>
          <DrawerTitle>{gift ? gift.name : "Ajouter un cadeau"}</DrawerTitle>
          <DrawerDescription>
            Pré-remplissez depuis une adresse produit, puis ajustez les champs.
          </DrawerDescription>
        </DrawerHeader>
        <DrawerBody className="flex flex-col gap-8">
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
          <Button type="submit" form={formId} variant="primary" disabled={saving || store.busy}>
            {saving ? "Enregistrement…" : gift ? "Enregistrer" : "Ajouter le cadeau"}
          </Button>
          <DrawerClose className="btn btn-ghost">Annuler</DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
