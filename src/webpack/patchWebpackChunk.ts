/**
 * @author FuraxDev
 * Intercepts webpackChunkdiscord_app as soon as Discord defines it. For every
 * module factory pushed in a chunk, first runs any registered source patches
 * (see sourcePatcher.ts) against its original source, then wraps the
 * (possibly patched) factory so its exports are captured the moment Discord
 * actually executes it (module id -> exports), regardless of when that happens.
 */

import type { WebpackChunkPush, WebpackModule } from "../types/global";
import { registerModule } from "./moduleCache";
import { patchFactorySource, type SourcePatch } from "./sourcePatcher";

type ChunkArray = { push: (chunk: WebpackChunkPush) => unknown };
type Factory = (module: WebpackModule, exports: unknown, require: (id: string | number) => unknown) => void;

const sourcePatches: SourcePatch[] = [];

export function registerSourcePatch(patch: SourcePatch): void {
  sourcePatches.push(patch);
}

function patchChunkArray(chunkArray: ChunkArray): void {
  const originalPush = chunkArray.push.bind(chunkArray);

  chunkArray.push = ((chunk: WebpackChunkPush) => {
    const [, factories] = chunk;

    for (const id of Object.keys(factories)) {
      const originalFactory = factories[id];
      const patched = patchFactorySource(originalFactory as (...args: unknown[]) => unknown, sourcePatches);
      const baseFactory = (patched ?? originalFactory) as Factory;

      factories[id] = (module: WebpackModule, exports: unknown, require: (id: string | number) => unknown) => {
        baseFactory(module, exports, require);
        registerModule(id, module.exports);
      };
    }

    return originalPush(chunk);
  }) as typeof chunkArray.push;
}

export function patchWebpackChunk(): void {
  if (Array.isArray(window.webpackChunkdiscord_app)) {
    patchChunkArray(window.webpackChunkdiscord_app);
    return;
  }

  Object.defineProperty(window, "webpackChunkdiscord_app", {
    configurable: true,
    get: () => undefined,
    set(value: ChunkArray) {
      Object.defineProperty(window, "webpackChunkdiscord_app", {
        configurable: true,
        writable: true,
        value,
      });
      patchChunkArray(value);
    },
  });
}
