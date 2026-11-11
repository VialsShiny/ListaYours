"use client";

import { useState } from "react";
import { voice } from "@/content/voice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { OwnerStore } from "@/hooks/use-owner-data";
import { createCategory } from "@/lib/api-owner";

export function CategoryAddForm({ store }: { store: OwnerStore }) {
  const [name, setName] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    const { ok } = await store.run(
      (token) => createCategory(token, trimmed),
      voice.dashboard.categories.createFailed,
    );
    if (ok) setName("");
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row">
      <label htmlFor="new-category" className="sr-only">
        {voice.dashboard.categories.placeholder}
      </label>
      <Input
        id="new-category"
        required
        maxLength={80}
        placeholder={voice.dashboard.categories.placeholder}
        value={name}
        onChange={(event) => setName(event.target.value)}
        className="flex-1"
      />
      <Button
        type="submit"
        variant="primary"
        className="shrink-0"
        disabled={store.busy || name.trim() === ""}
      >
        {voice.dashboard.categories.add}
      </Button>
    </form>
  );
}
