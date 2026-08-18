/**
 * @author FuraxDev
 * Scans Discord's internal Webpack modules to find one exposing all the given properties.
 * Must run in the page's real context (injected by content.ts), not the isolated extension world.
 */

import type { WebpackModule } from "../types/global";

const moduleCache = new Map<number | string, WebpackModule["exports"]>();
let cacheReady = false;

function buildCache(): void {
  const chunkLoader = window.webpackChunkdiscord_app;
  if (!chunkLoader) return;

  const cacheId = "zencord";
  chunkLoader.push([
    [cacheId],
    {},
    (require: (id: string | number) => unknown) => {
      const requireWithCache = require as unknown as { c: Record<string | number, WebpackModule> };
      for (const id in requireWithCache.c) {
        const mod = requireWithCache.c[id];
        if (mod?.exports) {
          moduleCache.set(id, mod.exports);
        }
      }
    },
  ]);

  cacheReady = true;
}

export function findByProps(...props: string[]): Record<string, unknown> | undefined {
  if (!cacheReady) buildCache();

  for (const exported of moduleCache.values()) {
    if (props.every((prop) => prop in exported)) {
      return exported as Record<string, unknown>;
    }

    const defaultExport = (exported as { default?: Record<string, unknown> }).default;
    if (defaultExport && props.every((prop) => prop in defaultExport)) {
      return defaultExport;
    }
  }

  return undefined;
}
