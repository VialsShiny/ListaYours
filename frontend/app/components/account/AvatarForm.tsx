"use client";

import { useEffect, useState } from "react";
import { voice } from "@/content/voice";
import { AvatarDropzone } from "@/components/account/AvatarDropzone";
import { StatusMessage } from "@/components/feedback/StatusMessage";
import { UserAvatar } from "@/components/layout/UserAvatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useAvatarUrl } from "@/hooks/use-avatar-url";
import { errorMessage } from "@/lib/api";
import { deleteAvatar, uploadAvatar } from "@/lib/api-account";
import { checkAvatarFile, cropToSquare } from "@/lib/avatar-file";
import { notifySuccess } from "@/lib/toast";
import type { User } from "@/lib/types";

type AvatarFormProps = { user: User; token: string };
type Picked = { blob: Blob; url: string };

/**
 * Current picture (or initial), a drop zone, a square preview before saving, and removal.
 */
export function AvatarForm({ user, token }: AvatarFormProps) {
  const { updateUser } = useAuth();
  const currentUrl = useAvatarUrl(user, token);
  const [picked, setPicked] = useState<Picked | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const caption = picked
    ? voice.account.photo.preview
    : user.has_avatar
      ? voice.account.photo.current
      : voice.account.photo.none;

  useEffect(() => {
    if (!picked) return;
    return () => URL.revokeObjectURL(picked.url);
  }, [picked]);

  async function handleFile(file: File) {
    setError(null);
    const problem = checkAvatarFile(file);
    if (problem) {
      setError(problem);
      return;
    }
    try {
      const blob = await cropToSquare(file);
      setPicked({ blob, url: URL.createObjectURL(blob) });
    } catch {
      setError(voice.account.photo.unreadable);
    }
  }

  async function run(action: () => Promise<User>, done: string) {
    setError(null);
    setBusy(true);
    try {
      updateUser(await action());
      setPicked(null);
      notifySuccess(done);
    } catch (caught) {
      setError(errorMessage(caught, voice.account.photo.failed));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="panel grid gap-6 p-5 md:grid-cols-[auto_minmax(0,1fr)] md:gap-8 md:p-8">
      <div className="flex flex-col items-center gap-3 md:items-start">
        <UserAvatar name={user.display_name} src={picked?.url ?? currentUrl} size="xl" described />
        <p className="text-small max-w-[18ch] text-center text-soft md:text-left">{caption}</p>
      </div>
      <div className="flex min-w-0 flex-col gap-4">
        <AvatarDropzone onFile={handleFile} disabled={busy} />
        <StatusMessage message={error} tone="error" />
        <div className="flex flex-wrap gap-3">
          {picked ? (
            <>
              <Button
                variant="primary"
                disabled={busy}
                onClick={() =>
                  run(() => uploadAvatar(token, picked.blob), voice.account.photo.saved)
                }
              >
                {busy ? voice.errors.wait : voice.account.photo.save}
              </Button>
              <Button variant="secondary" disabled={busy} onClick={() => setPicked(null)}>
                {voice.account.photo.cancel}
              </Button>
            </>
          ) : user.has_avatar ? (
            <Button
              variant="destructive"
              disabled={busy}
              onClick={() => run(() => deleteAvatar(token), voice.account.photo.removed)}
            >
              {busy ? voice.errors.wait : voice.account.photo.remove}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
