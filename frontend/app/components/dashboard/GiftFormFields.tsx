"use client";

import { Field } from "@/components/ui/field";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Toggle } from "@/components/ui/toggle";
import type { GiftFormValues } from "@/lib/gift-form";
import type { Category } from "@/lib/types";

type GiftFormFieldsProps = {
  values: GiftFormValues;
  categories: Category[];
  onChange: (values: GiftFormValues) => void;
};

export function GiftFormFields({ values, categories, onChange }: GiftFormFieldsProps) {
  function set<K extends keyof GiftFormValues>(key: K, value: GiftFormValues[K]) {
    onChange({ ...values, [key]: value });
  }

  return (
    <>
      <Field id="gift-name" label="Nom" required>
        {(describedBy) => (
          <Input
            id="gift-name"
            required
            maxLength={200}
            value={values.name}
            onChange={(event) => set("name", event.target.value)}
            aria-describedby={describedBy}
          />
        )}
      </Field>
      <Field
        id="gift-description"
        label="Description"
        hint="Indiquez ici la taille ou une alternative"
      >
        {(describedBy) => (
          <Textarea
            id="gift-description"
            value={values.description}
            onChange={(event) => set("description", event.target.value)}
            aria-describedby={describedBy}
          />
        )}
      </Field>
      <Field id="gift-image" label="URL de l'image">
        {(describedBy) => (
          <Input
            id="gift-image"
            type="url"
            inputMode="url"
            placeholder="https://…"
            value={values.image_url}
            onChange={(event) => set("image_url", event.target.value)}
            aria-describedby={describedBy}
          />
        )}
      </Field>
      <div className="grid gap-5 sm:grid-cols-3">
        <Field id="gift-price" label="Prix">
          {(describedBy) => (
            <Input
              id="gift-price"
              inputMode="decimal"
              placeholder="49,90"
              value={values.price}
              onChange={(event) => set("price", event.target.value)}
              aria-describedby={describedBy}
            />
          )}
        </Field>
        <Field id="gift-old-price" label="Ancien prix">
          {(describedBy) => (
            <Input
              id="gift-old-price"
              inputMode="decimal"
              placeholder="59,90"
              value={values.old_price}
              onChange={(event) => set("old_price", event.target.value)}
              aria-describedby={describedBy}
            />
          )}
        </Field>
        <Field id="gift-currency" label="Devise" hint="Trois lettres, ex. EUR">
          {(describedBy) => (
            <Input
              id="gift-currency"
              maxLength={3}
              pattern="[A-Za-z]{3}"
              value={values.currency}
              onChange={(event) => set("currency", event.target.value.toUpperCase())}
              aria-describedby={describedBy}
              className="uppercase"
            />
          )}
        </Field>
      </div>
      <Field id="gift-url" label="URL d'achat">
        {(describedBy) => (
          <Input
            id="gift-url"
            type="url"
            inputMode="url"
            placeholder="https://…"
            value={values.purchase_url}
            onChange={(event) => set("purchase_url", event.target.value)}
            aria-describedby={describedBy}
          />
        )}
      </Field>
      <Field id="gift-category" label="Catégorie">
        {(describedBy) => (
          <Select
            id="gift-category"
            value={values.category_id}
            onChange={(event) => set("category_id", event.target.value)}
            aria-describedby={describedBy}
          >
            <option value="">Aucune</option>
            {categories.map((category) => (
              <option key={category.id} value={String(category.id)}>
                {category.name}
              </option>
            ))}
          </Select>
        )}
      </Field>
      <Toggle
        id="gift-visible"
        label="Visible"
        hint="Un cadeau masqué n'apparaît pas sur la liste publique."
        checked={values.is_visible}
        onChange={(checked) => set("is_visible", checked)}
      />
    </>
  );
}
