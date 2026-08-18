/**
 * @author FuraxDev
 * Blocks Discord's telemetry/analytics module (event tracking, Sentry-style
 * crash reporting) by no-oping its sending functions once found via
 * findByProps. The module may not be loaded yet when the plugin starts, so
 * it retries on an interval until found.
 */

import type { Plugin } from "./index";
import { findByProps } from "../webpack/findByProps";

const TRACKER_PROPS = ["track", "trackNavigation"] as const;
const NOOP_METHODS = ["track", "trackNavigation", "trackEvent", "submitLiveEvent"] as const;
const POLL_INTERVAL_MS = 1000;

let patchedModule: Record<string, unknown> | undefined;
const originalMethods = new Map<string, unknown>();
let pollHandle: ReturnType<typeof setInterval> | undefined;

function neutralize(trackerModule: Record<string, unknown>): void {
  for (const method of NOOP_METHODS) {
    if (typeof trackerModule[method] === "function") {
      originalMethods.set(method, trackerModule[method]);
      trackerModule[method] = () => undefined;
    }
  }
}

function restore(): void {
  if (!patchedModule) return;
  for (const [method, original] of originalMethods) {
    patchedModule[method] = original;
  }
  originalMethods.clear();
  patchedModule = undefined;
}

function tryPatch(): boolean {
  const trackerModule = findByProps(...TRACKER_PROPS);
  if (!trackerModule) return false;

  neutralize(trackerModule);
  patchedModule = trackerModule;
  return true;
}

export const trackerBlockerPlugin: Plugin = {
  name: "TrackerBlocker",
  description: "Blocks Discord's default telemetry/analytics tracking calls.",
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
