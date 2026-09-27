"use client";

import { useState } from "react";

export default function ProfileForm({
  action,
  nickname,
  avatarUrl,
}: {
  action: (formData: FormData) => Promise<void>;
  nickname: string;
  avatarUrl: string;
}) {
  const [preview, setPreview] = useState(avatarUrl);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;

    const image = new Image();
    image.src = URL.createObjectURL(file);
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("image"));
    });
    const size = 320;
    const scale = Math.min(1, size / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext("2d");
    if (!context) return;
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    URL.revokeObjectURL(image.src);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.78);
    setPreview(dataUrl);

    const dataTransfer = new DataTransfer();
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    dataTransfer.items.add(new File([blob], "avatar.jpg", { type: "image/jpeg" }));
    event.target.files = dataTransfer.files;
  }

  return (
    <form action={action} className="profile-form">
      <div className="profile-avatar-large">
        {preview ? <img src={preview} alt="Предпросмотр аватара" /> : <span>{nickname.slice(0, 1).toUpperCase() || "N"}</span>}
      </div>
      <div className="profile-form-fields">
        <div className="field">
          <label htmlFor="nickname">Никнейм</label>
          <input id="nickname" name="nickname" defaultValue={nickname} maxLength={32} placeholder="Как тебя называть" />
        </div>
        <div className="field">
          <label htmlFor="avatar">Фото профиля</label>
          <input id="avatar" name="avatar" type="file" accept="image/*" onChange={handleFileChange} />
          <small className="field-hint">Можно выбрать изображение. Оно будет уменьшено перед сохранением.</small>
        </div>
        <div className="field">
          <label htmlFor="avatarUrl">Или URL изображения</label>
          <input id="avatarUrl" name="avatarUrl" type="url" defaultValue={avatarUrl.startsWith("data:") ? "" : avatarUrl} placeholder="https://..." />
        </div>
        <button className="btn" type="submit">Сохранить профиль</button>
      </div>
    </form>
  );
}
