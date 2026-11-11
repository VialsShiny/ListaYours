"use client";

import { useState } from "react";
import { voice } from "@/content/voice";
import { AVATAR_TYPES } from "@/lib/avatar-file";

type AvatarDropzoneProps = {
  disabled?: boolean;
  onFile: (file: File) => void;
};

/**
 * Click, keyboard (the real file input sits over the zone) or drag-and-drop picker.
 */
export function AvatarDropzone({ disabled = false, onFile }: AvatarDropzoneProps) {
  const [dragging, setDragging] = useState(false);

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    if (disabled) return;
    const file = event.dataTransfer.files[0];
    if (file) onFile(file);
  }

  return (
    <div
      className="dropzone"
      data-dragging={dragging}
      onDragOver={(event) => {
        event.preventDefault();
        if (!disabled) setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
    >
      <input
        id="avatar-file"
        type="file"
        accept={AVATAR_TYPES.join(",")}
        disabled={disabled}
        className="dropzone-input"
        aria-describedby="avatar-file-hint"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) onFile(file);
        }}
      />
      <label htmlFor="avatar-file" className="text-[16px] font-semibold">
        {voice.account.photo.pick}
      </label>
      <span className="text-secondary text-soft">{voice.account.photo.drop}</span>
      <span id="avatar-file-hint" className="field-help mt-2 max-w-[32ch]">
        {voice.account.photo.hint}
      </span>
    </div>
  );
}
