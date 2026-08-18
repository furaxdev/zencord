/**
 * @author FuraxDev
 * Shows a user's avatar in full size when clicked, instead of Discord's
 * default small profile popout. Uses findByProps to grab Discord's own
 * IconUtils helper (getUserAvatarURL) so animated avatars resolve to a
 * .gif at max resolution, falling back to a plain URL rewrite if that
 * internal module can't be found or its signature has changed.
 */

import type { Plugin } from "./index";
import { findByProps } from "../webpack/findByProps";

const OVERLAY_ID = "zencord-avatar-viewer";
const MAX_SIZE = 4096;
const AVATAR_URL_PATTERN = /cdn\.discordapp\.com\/(avatars|embed\/avatars|guilds\/\d+\/users\/\d+\/avatars)\//;

interface IconUtilsModule {
  getUserAvatarURL(user: { id: string; avatar: string }, canAnimate: boolean, size: number): string;
}

function isAvatarImage(target: EventTarget | null): target is HTMLImageElement {
  return target instanceof HTMLImageElement && AVATAR_URL_PATTERN.test(target.src);
}

function parseAvatarUrl(src: string): { userId?: string; hash?: string } {
  const match = src.match(/\/avatars\/(\d+)\/([a-zA-Z0-9_]+)\.\w+/);
  if (!match) return {};
  return { userId: match[1], hash: match[2] };
}

function toFullSizeUrl(src: string): string {
  const { userId, hash } = parseAvatarUrl(src);
  const iconUtils = findByProps("getUserAvatarURL") as IconUtilsModule | undefined;

  if (iconUtils && userId && hash) {
    try {
      return iconUtils.getUserAvatarURL({ id: userId, avatar: hash }, true, MAX_SIZE);
    } catch {
      // Discord's internal signature may have changed; fall back below.
    }
  }

  const url = new URL(src);
  url.searchParams.set("size", String(MAX_SIZE));
  return url.toString();
}

function onKeyDown(event: KeyboardEvent): void {
  if (event.key === "Escape") closeOverlay();
}

function closeOverlay(): void {
  document.getElementById(OVERLAY_ID)?.remove();
  document.removeEventListener("keydown", onKeyDown);
}

function openOverlay(src: string): void {
  closeOverlay();

  const overlay = document.createElement("div");
  overlay.id = OVERLAY_ID;
  overlay.style.cssText =
    "position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.85);cursor:zoom-out;";
  overlay.addEventListener("click", closeOverlay);

  const image = document.createElement("img");
  image.src = src;
  image.style.cssText = "max-width:90vw;max-height:90vh;border-radius:8px;";
  overlay.appendChild(image);

  document.body.appendChild(overlay);
  document.addEventListener("keydown", onKeyDown);
}

function onDocumentClick(event: MouseEvent): void {
  if (!isAvatarImage(event.target)) return;

  event.preventDefault();
  event.stopPropagation();
  openOverlay(toFullSizeUrl(event.target.src));
}

export const avatarViewerPlugin: Plugin = {
  name: "AvatarViewer",
  description: "Click a user's avatar to view it full size.",
  enabled: true,
  start(): void {
    document.addEventListener("click", onDocumentClick, true);
  },
  stop(): void {
    document.removeEventListener("click", onDocumentClick, true);
    closeOverlay();
  },
};
