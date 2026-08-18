/**
 * @author FuraxDev
 * FakeProfileThemes: lets anyone set a custom Nitro-style profile gradient
 * by hiding a "[#primary,#accent]" color pair as invisible Unicode "tag"
 * characters (3y3 encoding) inside their About Me bio.
 *
 * Wire format ported from Vencord's FakeProfileThemes plugin (GPL-3.0,
 * itself a port of Alyxia's Vendetta plugin) so bios encoded by either
 * client render correctly in both: https://github.com/Vendicated/Vencord
 * /blob/main/src/plugins/fakeProfileThemes/index.tsx
 *
 * Patches the internal UserProfileStore-like module's getUserProfile() so
 * a decoded bio makes Discord's own profile UI believe premiumType is 2
 * (Nitro) with those themeColors — the real profile popout then renders
 * the gradient itself, no DOM guessing needed. Pairs with ThemeUnlocker,
 * which unlocks the premium-gated UI that reads this.
 */

import type { Plugin } from "./index";
import { findByProps } from "../webpack/findByProps";

const TAG_OFFSET = 0xe0000;
const TAG_MIN = 0x20;
const TAG_MAX = 0x7f;
const NITRO_FIRST = true;
const POLL_INTERVAL_MS = 1000;
const PANEL_ID = "zencord-profile-theme-panel";

function encode(primary: number, accent: number): string {
  const message = `[#${primary.toString(16).padStart(6, "0")},#${accent.toString(16).padStart(6, "0")}]`;
  const encoded = Array.from(message)
    .map((char) => char.codePointAt(0) ?? 0)
    .filter((code) => code >= TAG_MIN && code <= TAG_MAX)
    .map((code) => String.fromCodePoint(code + TAG_OFFSET))
    .join("");

  return ` ${encoded}`;
}

function decode(bio: string | undefined): [number, number] | null {
  if (!bio) return null;

  const match = bio.match(
    /\u{e005b}\u{e0023}([\u{e0061}-\u{e0066}\u{e0041}-\u{e0046}\u{e0030}-\u{e0039}]{1,6})\u{e002c}\u{e0023}([\u{e0061}-\u{e0066}\u{e0041}-\u{e0046}\u{e0030}-\u{e0039}]{1,6})\u{e005d}/u,
  );
  if (!match) return null;

  const parsed = [...match[0]].map((char) => String.fromCodePoint((char.codePointAt(0) ?? 0) - TAG_OFFSET)).join("");
  const [primary, accent] = parsed
    .slice(1, -1)
    .split(",")
    .map((hex) => parseInt(hex.replace("#", "0x"), 16));

  return primary !== undefined && accent !== undefined && !Number.isNaN(primary) && !Number.isNaN(accent)
    ? [primary, accent]
    : null;
}

interface UserProfile {
  bio?: string;
  premiumType?: number;
  themeColors?: [number, number];
  [key: string]: unknown;
}

interface UserProfileStoreModule {
  getUserProfile: (userId: string) => UserProfile | undefined;
}

let originalGetUserProfile: UserProfileStoreModule["getUserProfile"] | undefined;
let patchedModule: UserProfileStoreModule | undefined;
let pollHandle: ReturnType<typeof setInterval> | undefined;

function patchedGetUserProfile(this: UserProfileStoreModule, userId: string): UserProfile | undefined {
  const profile = originalGetUserProfile!.call(this, userId);
  if (!profile?.bio) return profile;
  if (NITRO_FIRST && profile.themeColors) return profile;

  const colors = decode(profile.bio);
  if (!colors) return profile;

  return { ...profile, premiumType: 2, themeColors: colors };
}

function tryPatch(): boolean {
  const userProfileStore = findByProps("getUserProfile") as UserProfileStoreModule | undefined;
  if (!userProfileStore) return false;

  originalGetUserProfile = userProfileStore.getUserProfile;
  userProfileStore.getUserProfile = patchedGetUserProfile;
  patchedModule = userProfileStore;
  return true;
}

function restore(): void {
  if (patchedModule && originalGetUserProfile) {
    patchedModule.getUserProfile = originalGetUserProfile;
  }
  patchedModule = undefined;
  originalGetUserProfile = undefined;
}

function hexToInt(hex: string): number {
  return parseInt(hex.replace("#", ""), 16);
}

function toggleThemePanel(): void {
  const existing = document.getElementById(PANEL_ID);
  if (existing) {
    existing.remove();
    return;
  }

  const panel = document.createElement("div");
  panel.id = PANEL_ID;
  panel.style.cssText =
    "position:fixed;bottom:20px;right:20px;z-index:2147483647;background:#211d29;border:1px solid #332c3d;border-radius:16px;padding:16px;display:flex;flex-direction:column;gap:10px;font-family:sans-serif;color:#e2e8f0;width:220px;box-shadow:0 10px 40px rgba(0,0,0,0.5);";

  const title = document.createElement("div");
  title.textContent = "ZenCord profile theme";
  title.style.cssText = "font-weight:600;font-size:14px;";
  panel.appendChild(title);

  const primaryInput = document.createElement("input");
  primaryInput.type = "color";
  primaryInput.value = "#18151e";
  const accentInput = document.createElement("input");
  accentInput.type = "color";
  accentInput.value = "#ff94b8";

  for (const [label, input] of [
    ["Primary", primaryInput],
    ["Accent", accentInput],
  ] as const) {
    const row = document.createElement("label");
    row.style.cssText = "display:flex;align-items:center;justify-content:space-between;font-size:13px;";
    row.textContent = label;
    input.style.cssText = "width:40px;height:28px;border:none;border-radius:6px;background:none;cursor:pointer;";
    row.appendChild(input);
    panel.appendChild(row);
  }

  const copyButton = document.createElement("button");
  copyButton.textContent = "Copy 3y3";
  copyButton.style.cssText =
    "margin-top:6px;padding:8px;border-radius:8px;border:none;background:#ff94b8;color:#18151e;font-weight:600;cursor:pointer;";
  copyButton.addEventListener("click", () => {
    const invisibleCode = encode(hexToInt(primaryInput.value), hexToInt(accentInput.value));
    void navigator.clipboard.writeText(invisibleCode);
    copyButton.textContent = "Copied! Paste it in your bio";
    setTimeout(() => (copyButton.textContent = "Copy 3y3"), 2000);
  });
  panel.appendChild(copyButton);

  document.body.appendChild(panel);
}

export const fakeProfileThemesPlugin: Plugin = {
  name: "FakeProfileThemes",
  description: "Profile theming via invisible 3y3-encoded colors in bios, compatible with Vencord's plugin.",
  enabled: true,
  start(): void {
    window.zencordToggleProfileThemePanel = toggleThemePanel;

    if (tryPatch()) return;

    pollHandle = setInterval(() => {
      if (tryPatch() && pollHandle !== undefined) {
        clearInterval(pollHandle);
        pollHandle = undefined;
      }
    }, POLL_INTERVAL_MS);
  },
  stop(): void {
    if (pollHandle !== undefined) {
      clearInterval(pollHandle);
      pollHandle = undefined;
    }
    restore();
    document.getElementById(PANEL_ID)?.remove();
    delete window.zencordToggleProfileThemePanel;
  },
};
