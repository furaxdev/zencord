/**
 * @author FuraxDev
 * Stores Webpack module exports captured as Discord's chunks execute.
 */

const modules = new Map<string | number, Record<string, unknown>>();

export function registerModule(id: string | number, exports: unknown): void {
  if (typeof exports === "object" && exports !== null) {
    modules.set(id, exports as Record<string, unknown>);
  }
}

export function getModules(): IterableIterator<Record<string, unknown>> {
  return modules.values();
}
