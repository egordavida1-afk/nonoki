"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/user-auth";

const MAX_AVATAR_BYTES = 320 * 1024;

function cleanNickname(value: string) {
  return value.trim().replace(/\s+/g, " ").slice(0, 32);
}

function validAvatarUrl(value: string) {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return url.toString().slice(0, 1200);
  } catch {
    return null;
  }
}

export async function updateProfile(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/profile");

  const nickname = cleanNickname(String(formData.get("nickname") || ""));
  if (nickname.length > 32) redirect("/profile?error=nickname");

  const avatarInput = String(formData.get("avatarUrl") || "").trim();
  if (avatarInput && !validAvatarUrl(avatarInput)) redirect("/profile?error=avatar-url");
  let avatarUrl = avatarInput ? validAvatarUrl(avatarInput) : user.avatarUrl || null;
  const avatarFile = formData.get("avatar");

  if (avatarFile instanceof File && avatarFile.size > 0) {
    if (!avatarFile.type.startsWith("image/") || avatarFile.size > MAX_AVATAR_BYTES) {
      redirect("/profile?error=avatar");
    }
    const bytes = new Uint8Array(await avatarFile.arrayBuffer());
    const base64 = Buffer.from(bytes).toString("base64");
    avatarUrl = `data:${avatarFile.type};base64,${base64}`;
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      nickname: nickname || null,
      avatarUrl: avatarUrl || null,
    },
  });

  redirect("/profile?saved=1");
}
