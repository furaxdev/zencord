/**
 * @author FuraxDev
 * Minimal example plugin — disabled by default. Use it as a template for new plugins.
 */

import type { Plugin } from "../index";

export const examplePlugin: Plugin = {
  name: "Example",
  description: "A minimal example plugin demonstrating the plugin API.",
  enabled: false,
  start(): void {
    console.log("[ZenCord] Example plugin started.");
  },
  stop(): void {
    console.log("[ZenCord] Example plugin stopped.");
  },
};
