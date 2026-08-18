/**
 * @author FuraxDev
 * Injects a "ZenCord" entry into Discord's user settings sidebar, anchored
 * next to the "Log Out" item (stable UI text, unlike the hashed class names
 * used everywhere else in that sidebar). Clicking it opens a self-styled
 * panel listing every registered plugin with an on/off toggle.
 */

import type { Plugin } from "./index";
import { getPlugins, setPluginEnabled } from "./index";

const ENTRY_ID = "zencord-settings-entry";
const MODAL_ID = "zencord-settings-modal";
const STYLE_ID = "zencord-settings-style";

function ensureStyles(): void {
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    #${ENTRY_ID} {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 6px 10px;
      margin: 1px 0;
      border-radius: 4px;
      font-size: 16px;
      font-weight: 500;
      color: #b9bbbe;
      cursor: pointer;
    }
    #${ENTRY_ID}:hover {
      background: rgba(255, 148, 184, 0.08);
      color: #fff;
    }
    #${ENTRY_ID} svg {
      color: #ff94b8;
      flex-shrink: 0;
    }
  `;
  document.head.appendChild(style);
}

function buildEntry(): HTMLElement {
  const entry = document.createElement("div");
  entry.id = ENTRY_ID;
  entry.setAttribute("role", "tab");
  entry.innerHTML = `
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 3l1.8 4.6L18 9l-4.2 1.4L12 15l-1.8-4.6L6 9l4.2-1.4L12 3z" />
    </svg>
    <span>ZenCord</span>
  `;
  entry.addEventListener("click", toggleModal);
  return entry;
}

const MIN_SETTINGS_TABS = 8;

function findSettingsTablist(root: Element): HTMLElement | null {
  const tablists = root.querySelectorAll<HTMLElement>('[role="tablist"]');
  for (const tablist of tablists) {
    if (tablist.querySelectorAll('[role="tab"]').length >= MIN_SETTINGS_TABS) {
      return tablist;
    }
  }
  return null;
}

function tryInjectWithin(root: Element): boolean {
  if (document.getElementById(ENTRY_ID)) return true;

  const tablist = findSettingsTablist(root);
  if (!tablist) return false;

  const tabs = tablist.querySelectorAll('[role="tab"]');
  const lastTab = tabs[tabs.length - 1];
  if (!lastTab?.parentElement) return false;

  ensureStyles();
  lastTab.parentElement.insertBefore(buildEntry(), lastTab);
  return true;
}

let observer: MutationObserver | undefined;

function startObserving(): void {
  tryInjectWithin(document.body);

  observer = new MutationObserver((mutations) => {
    if (document.getElementById(ENTRY_ID)) return;

    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node instanceof Element && tryInjectWithin(node)) return;
      }
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

function stopObserving(): void {
  observer?.disconnect();
  observer = undefined;
  document.getElementById(ENTRY_ID)?.remove();
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

function toggleModal(): void {
  const existing = document.getElementById(MODAL_ID);
  if (existing) {
    existing.remove();
    return;
  }

  const backdrop = document.createElement("div");
  backdrop.id = MODAL_ID;
  backdrop.style.cssText =
    "position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.6);";
  backdrop.addEventListener("click", (event) => {
    if (event.target === backdrop) backdrop.remove();
  });

  const panel = document.createElement("div");
  panel.style.cssText =
    "background:#18151e;border:1px solid #332c3d;border-radius:16px;padding:24px;width:440px;max-height:80vh;overflow-y:auto;font-family:sans-serif;color:#e2e8f0;box-shadow:0 20px 60px rgba(0,0,0,0.6);";

  const title = document.createElement("h2");
  title.textContent = "ZenCord Plugins";
  title.style.cssText = "font-size:18px;font-weight:700;margin-bottom:16px;";
  panel.appendChild(title);

  for (const plugin of getPlugins()) {
    panel.appendChild(renderPluginRow(plugin));
  }

  backdrop.appendChild(panel);
  document.body.appendChild(backdrop);
}

export const settingsPanelPlugin: Plugin = {
  name: "SettingsPanel",
  description: "Adds a ZenCord entry to Discord's settings sidebar to toggle plugins.",
  enabled: true,
  start(): void {
    startObserving();
  },
  stop(): void {
    stopObserving();
    document.getElementById(MODAL_ID)?.remove();
  },
};
