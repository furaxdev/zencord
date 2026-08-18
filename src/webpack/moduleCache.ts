/**
 * @author FuraxDev
 * Stores Webpack module exports captured as Discord's chunks execute.
 */

const modules = new Map<string | number, Record<string, unknown>>();

export function registerModule(id: string | number, exports: Record<string, unknown>): void {
  if (exports) modules.set(id, exports);
}

export function getModules(): IterableIterator<Record<string, unknown>> {
  return modules.values();
}
