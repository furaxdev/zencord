/**
 * @author FuraxDev
 * Shared type declarations for the page context (injected core.ts).
 */

export interface WebpackModule {
  id: number | string;
  exports: Record<string, unknown>;
}

export type WebpackRequire = {
  c: Record<string | number, WebpackModule>;
};

export type WebpackChunkPush = [
  chunkIds: (string | number)[],
  modules: Record<string | number, (module: WebpackModule, exports: unknown, require: (id: string | number) => unknown) => void>,
  entries?: unknown,
];

declare global {
  interface Window {
    webpackChunkdiscord_app?: {
      push: (chunk: WebpackChunkPush) => unknown;
    };
    findByProps?: (...props: string[]) => Record<string, unknown> | undefined;
    zencordToggleProfileThemePanel?: () => void;
    __zencordBuildSettingsLayout?: (originalLayoutBuilder: { key?: string; buildLayout: () => unknown[] }) => unknown[];
  }
}
