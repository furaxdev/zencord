/**
 * @author FuraxDev
 * Adds a real "ZenCord Settings" section to Discord's native settings
 * sidebar, source-patched into the module that builds the settings layout
 * tree — the same technique Vencord uses (see webpack/sourcePatcher.ts) —
 * instead of injecting DOM nodes after the fact. Discord's own React then
 * renders our section like any other, so it survives re-renders.
 *
 * LayoutTypes numeric IDs (SECTION/SIDEBAR_ITEM/PANEL/CATEGORY/CUSTOM) are
 * resolved at runtime via findByProps when possible; the fallback values
 * below mirror Vencord's own known-good constants as a best effort.
 */

import type { Plugin } from "./index";
import { getPlugins, setPluginEnabled } from "./index";
import { findByProps } from "../webpack/findByProps";
import { registerSourcePatch } from "../webpack/patchWebpackChunk";

const ROOT_LAYOUT_BUILDER_CALL = /(\w+)\.buildLayout\(\)(?=\.map)/;

const FALLBACK_LAYOUT_TYPES = { SECTION: 1, SIDEBAR_ITEM: 2, PANEL: 3, CATEGORY: 5, CUSTOM: 19 };

function getLayoutTypes(): typeof FALLBACK_LAYOUT_TYPES {
  const module = findByProps("SECTION", "SIDEBAR_ITEM", "PANEL", "CUSTOM") as
    | Partial<typeof FALLBACK_LAYOUT_TYPES>
    | undefined;
  return { ...FALLBACK_LAYOUT_TYPES, ...module };
}

interface ReactLike {
  createElement: (type: unknown, props: Record<string, unknown> | null, ...children: unknown[]) => unknown;
  useRef: <T>(initial: T | null) => { current: T | null };
  useEffect: (effect: () => void | (() => void), deps: unknown[]) => void;
}

let cachedReact: ReactLike | undefined;

function getReact(): ReactLike | undefined {
  if (!cachedReact) {
    cachedReact = findByProps("createElement", "useEffect", "useRef") as ReactLike | undefined;
  }
  return cachedReact;
}

function renderPluginRow(plugin: Plugin): HTMLElement {
  const row = document.createElement("div");
  row.style.cssText =
    "display:flex;align-items:center;justify-content:space-between;gap:16px;padding:12px 0;border-bottom:1px solid #332c3d;";

  const info = document.createElement("div");
  const name = document.createElement("div");
  name.textContent = plugin.name;
  name.style.cssText = "font-weight:600;font-size:14px;";
  const desc = document.createElement("div");
  desc.textContent = plugin.description;
  desc.style.cssText = "font-size:12px;color:#94a3b8;margin-top:2px;";
  info.appendChild(name);
  info.appendChild(desc);

  const toggle = document.createElement("input");
  toggle.type = "checkbox";
  toggle.checked = plugin.enabled;
  toggle.style.cssText = "width:36px;height:20px;accent-color:#ff94b8;cursor:pointer;flex-shrink:0;";
  toggle.addEventListener("change", () => setPluginEnabled(plugin.name, toggle.checked));

  row.appendChild(info);
  row.appendChild(toggle);
  return row;
}

function ZenCordPluginsPanel(): unknown {
  const React = getReact();
  if (!React) return null;

  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.innerHTML = "";
    for (const plugin of getPlugins()) {
      container.appendChild(renderPluginRow(plugin));
    }
  }, []);

  return React.createElement("div", { ref: containerRef, style: { padding: "16px" } });
}

interface LayoutNode {
  key?: string;
  type: number;
  useTitle?: () => string;
  buildLayout?: () => LayoutNode[];
  Component?: () => unknown;
}

interface RootLayoutBuilder {
  key?: string;
  buildLayout: () => LayoutNode[];
}

function buildZenCordSection(): LayoutNode {
  const { SECTION, SIDEBAR_ITEM, PANEL, CATEGORY, CUSTOM } = getLayoutTypes();

  const pluginsEntry: LayoutNode = {
    key: "zencord_plugins",
    type: SIDEBAR_ITEM,
    useTitle: () => "Plugins",
    buildLayout: () => [
      {
        key: "zencord_plugins_panel",
        type: PANEL,
        useTitle: () => "ZenCord Plugins",
        buildLayout: () => [
          {
            key: "zencord_plugins_category",
            type: CATEGORY,
            buildLayout: () => [
              {
                key: "zencord_plugins_custom",
                type: CUSTOM,
                Component: ZenCordPluginsPanel,
              },
            ],
          },
        ],
      },
    ],
  };

  return {
    key: "zencord_section",
    type: SECTION,
    useTitle: () => "ZenCord Settings",
    buildLayout: () => [pluginsEntry],
  };
}

function buildSettingsLayout(originalLayoutBuilder: RootLayoutBuilder): LayoutNode[] {
  const layout = originalLayoutBuilder?.buildLayout?.();
  if (!Array.isArray(layout)) return layout;
  if (originalLayoutBuilder.key !== "$Root") return layout;
  if (layout.some((section) => section?.key === "zencord_section")) return layout;

  layout.splice(2, 0, buildZenCordSection());
  return layout;
}

let sectionEnabled = false;
let patchRegistered = false;

function passthroughBuildLayout(originalLayoutBuilder: RootLayoutBuilder): LayoutNode[] {
  return sectionEnabled ? buildSettingsLayout(originalLayoutBuilder) : originalLayoutBuilder?.buildLayout?.();
}

export const settingsPanelPlugin: Plugin = {
  name: "SettingsPanel",
  description: "Adds a native ZenCord Settings section to Discord's settings sidebar to toggle plugins.",
  enabled: true,
  start(): void {
    sectionEnabled = true;

    if (!patchRegistered) {
      window.__zencordBuildSettingsLayout = passthroughBuildLayout;
      registerSourcePatch({
        find: ".buildLayout().map",
        match: ROOT_LAYOUT_BUILDER_CALL,
        replace: "window.__zencordBuildSettingsLayout($1)",
      });
      patchRegistered = true;
    }
  },
  stop(): void {
    // The source patch is baked into the reconstructed factory once Discord's
    // chunk has loaded, so it can't be fully undone for this page session —
    // the passthrough flag makes it act as a no-op instead.
    sectionEnabled = false;
  },
};
