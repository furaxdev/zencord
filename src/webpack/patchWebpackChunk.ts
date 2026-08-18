/**
 * @author FuraxDev
 * Intercepts webpackChunkdiscord_app as soon as Discord defines it, wrapping every
 * module factory pushed in a chunk so its exports are captured the moment Discord
 * actually executes it (module id -> exports), regardless of when that happens.
 */

import type { WebpackChunkPush, WebpackModule } from "../types/global";
import { registerModule } from "./moduleCache";

type ChunkArray = { push: (chunk: WebpackChunkPush) => unknown };

function patchChunkArray(chunkArray: ChunkArray): void {
  const originalPush = chunkArray.push.bind(chunkArray);

  chunkArray.push = ((chunk: WebpackChunkPush) => {
    const [, factories] = chunk;

    for (const id of Object.keys(factories)) {
      const originalFactory = factories[id];
      factories[id] = (module: WebpackModule, exports: unknown, require: (id: string | number) => unknown) => {
        originalFactory(module, exports, require);
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
