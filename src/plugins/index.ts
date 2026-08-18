/**
 * @author FuraxDev
 * Plugin registry: registers plugins and toggles them on/off.
 */

import { examplePlugin } from "./example";
import { trackerBlockerPlugin } from "./trackerBlocker";
import { avatarViewerPlugin } from "./avatarViewer";
import { fakeNitroPlugin } from "./fakeNitro";

export interface Plugin {
  name: string;
  description: string;
  enabled: boolean;
  start(): void;
  stop(): void;
}

const plugins: Plugin[] = [examplePlugin, trackerBlockerPlugin, avatarViewerPlugin, fakeNitroPlugin];

export function getPlugins(): readonly Plugin[] {
  return plugins;
}

export function setPluginEnabled(name: string, enabled: boolean): void {
  const plugin = plugins.find((p) => p.name === name);
  if (!plugin) return;

  if (enabled && !plugin.enabled) {
    plugin.start();
  } else if (!enabled && plugin.enabled) {
    plugin.stop();
  }
  plugin.enabled = enabled;
}

export function initPlugins(): void {
  for (const plugin of plugins) {
    if (plugin.enabled) plugin.start();
  }
}
