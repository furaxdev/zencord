/**
 * @author FuraxDev
 * Finds a Webpack module exposing all the given properties among the modules
 * captured by patchWebpackChunk. Must run in the page's real context.
 */

import { getModules } from "./moduleCache";

export function findByProps(...props: string[]): Record<string, unknown> | undefined {
  for (const exported of getModules()) {
    if (props.every((prop) => prop in exported)) {
      return exported;
    }

    const defaultExport = (exported as { default?: Record<string, unknown> }).default;
    if (defaultExport && props.every((prop) => prop in defaultExport)) {
      return defaultExport;
    }
  }

  return undefined;
}
