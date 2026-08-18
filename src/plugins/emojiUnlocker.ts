/**
 * @author FuraxDev
 * Unlocks Discord's Nitro-gated emoji picker: clicking an emoji from a
 * server you're not boosted/subscribed enough for normally shows a lock
 * icon and a "Get Nitro" upsell instead of inserting it. Patches the
 * internal Emoji store's isEmojiPremiumLocked (found via findByProps) so
 * it always reports unlocked — isEmojiFilteredOrLocked calls it via
 * `this.isEmojiPremiumLocked(...)`, so patching it here fixes both.
 *
 * Client-side only: Discord's backend may still reject actually sending
 * an emoji from a server you don't have access to, depending on account
 * and guild boost status, regardless of this patch.
 */

import type { Plugin } from "./index";
import { findByProps } from "../webpack/findByProps";

const POLL_INTERVAL_MS = 1000;

interface EmojiStoreModule {
  isEmojiPremiumLocked: (...args: unknown[]) => boolean;
}

let originalIsEmojiPremiumLocked: EmojiStoreModule["isEmojiPremiumLocked"] | undefined;
let patchedModule: EmojiStoreModule | undefined;
let pollHandle: ReturnType<typeof setInterval> | undefined;

function tryPatch(): boolean {
  const emojiStore = findByProps("isEmojiPremiumLocked", "isEmojiFilteredOrLocked") as EmojiStoreModule | undefined;
  if (!emojiStore) return false;

  originalIsEmojiPremiumLocked = emojiStore.isEmojiPremiumLocked;
  emojiStore.isEmojiPremiumLocked = () => false;
  patchedModule = emojiStore;
  return true;
}

function restore(): void {
  if (patchedModule && originalIsEmojiPremiumLocked) {
    patchedModule.isEmojiPremiumLocked = originalIsEmojiPremiumLocked;
  }
  patchedModule = undefined;
  originalIsEmojiPremiumLocked = undefined;
}

export const emojiUnlockerPlugin: Plugin = {
  name: "EmojiUnlocker",
  description: "Unlocks clicking Nitro-locked emojis in the picker instead of showing the Get Nitro popup.",
  enabled: true,
  start(): void {
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
  },
};
