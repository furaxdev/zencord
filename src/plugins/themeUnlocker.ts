/**
 * @author FuraxDev
 * Unlocks Discord's Nitro-gated profile theming (accent colors, gradients,
 * banners) by patching the internal isPremiumAtLeast() check that gates
 * premium-only UI across the client, so it always resolves as unlocked.
 *
 * Client-side only: actions Discord validates server-side (uploading a
 * banner image, saving a profile theme) still require an actual Nitro
 * subscription and will be rejected by the backend regardless of this patch.
 */

import type { Plugin } from "./index";
import { findByProps } from "../webpack/findByProps";

const POLL_INTERVAL_MS = 1000;

interface PremiumUtilsModule {
  isPremiumAtLeast: (...args: unknown[]) => boolean;
}

let originalIsPremiumAtLeast: PremiumUtilsModule["isPremiumAtLeast"] | undefined;
let patchedModule: PremiumUtilsModule | undefined;
let pollHandle: ReturnType<typeof setInterval> | undefined;

function tryPatch(): boolean {
  const premiumUtils = findByProps("isPremiumAtLeast") as PremiumUtilsModule | undefined;
  if (!premiumUtils) return false;

  originalIsPremiumAtLeast = premiumUtils.isPremiumAtLeast;
  premiumUtils.isPremiumAtLeast = () => true;
  patchedModule = premiumUtils;
  return true;
}

function restore(): void {
  if (patchedModule && originalIsPremiumAtLeast) {
    patchedModule.isPremiumAtLeast = originalIsPremiumAtLeast;
  }
  patchedModule = undefined;
  originalIsPremiumAtLeast = undefined;
}

export const themeUnlockerPlugin: Plugin = {
  name: "ThemeUnlocker",
  description: "Unlocks Discord's Nitro-only profile theming (accent colors, gradients, banners).",
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
