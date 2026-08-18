/**
 * @author FuraxDev
 * Source-level patcher for Discord's Webpack module factories, in the same
 * spirit as Vencord's patch system: gets a factory's original source via
 * Function.prototype.toString() (V8 returns the exact authored source, not
 * decompiled bytecode), regex-replaces it, and reconstructs the function
 * via the Function constructor. Works because Webpack factories are always
 * self-contained `function(module, exports, require) { ... }` closures that
 * never capture outer scope, so rebuilding from source loses nothing.
 */

export interface SourcePatch {
  /** Cheap substring pre-check, run before the (potentially slow) regex. */
  find: string;
  match: RegExp;
  replace: string;
}

const FACTORY_SHAPE = /^function\s*[^(]*\(([^)]*)\)\s*\{([\s\S]*)\}$/;

export function patchFactorySource(
  factory: (...args: unknown[]) => unknown,
  patches: readonly SourcePatch[],
): ((...args: unknown[]) => unknown) | null {
  const source = factory.toString();
  const applicable = patches.filter((patch) => source.includes(patch.find));
  if (applicable.length === 0) return null;

  let patchedSource = source;
  for (const patch of applicable) {
    patchedSource = patchedSource.replace(patch.match, patch.replace);
  }
  if (patchedSource === source) return null;

  const shapeMatch = patchedSource.match(FACTORY_SHAPE);
  if (!shapeMatch) return null;

  const [, params, body] = shapeMatch;
  try {
    return new Function(...params.split(",").map((p) => p.trim()).filter(Boolean), body) as (
      ...args: unknown[]
    ) => unknown;
  } catch {
    return null;
  }
}
