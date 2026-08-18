/**
 * @author FuraxDev
 * Adds a "ZenCord" entry to Discord's settings sidebar: a self-styled DOM
 * node anchored on the same class prefixes as every other sidebar item
 * (verified against the real DOM: div.item_XXXXX.destructive_XXXXX for
 * "Log Out", item_XXXXX for the rest — the hash suffix changes every
 * Discord build, the prefix doesn't).
 *
 * A source-level patch (see webpack/sourcePatcher.ts) was tried first, in
 * the same spirit as Vencord's own settings-injection technique, but the
 * function it targeted turned out to never actually run on Discord Web's
 * visible render path (confirmed live: the patched factory executes, the
 * patched code inside it never does) — likely a different utility than
 * what Vencord patches on desktop. Falling back to DOM injection here,
 * made resilient with a persistent MutationObserver that re-inserts the
 * entry if Discord's React ever removes it on re-render.
 */

import type { Plugin } from "./index";
import { getPlugins, setPluginEnabled } from "./index";

const ENTRY_ID = "zencord-settings-entry";
const MODAL_ID = "zencord-settings-modal";
const STYLE_ID = "zencord-settings-style";
const MIN_SIDEBAR_ITEMS = 8;

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
  entry.innerHTML = `
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 3l1.8 4.6L18 9l-4.2 1.4L12 15l-1.8-4.6L6 9l4.2-1.4L12 3z" />
    </svg>
    <span>ZenCord</span>
  `;
  entry.addEventListener("click", toggleModal);
  return entry;
}

function findLogOutItem(root: Element): HTMLElement | null {
  const candidates = root.querySelectorAll<HTMLElement>('[class*="destructive_"]');
  for (const candidate of candidates) {
    const parent = candidate.parentElement;
    if (!parent) continue;

    const siblingItems = parent.querySelectorAll('[class*="item_"]');
    if (siblingItems.length >= MIN_SIDEBAR_ITEMS) {
      return candidate;
    }
  }
  return null;
}

function ensureEntryInjected(): void {
  const existing = document.getElementById(ENTRY_ID);
  if (existing?.isConnected) return;

  // documentElement (<html>) is always present at document_start, unlike
  // <head>/<body>, and still contains <body> once the parser reaches it.
  const logOutItem = findLogOutItem(document.documentElement);
  if (!logOutItem?.parentElement) return;

  ensureStyles();
  logOutItem.parentElement.insertBefore(buildEntry(), logOutItem);
}

let observer: MutationObserver | undefined;

function startObserving(): void {
  ensureEntryInjected();
  observer = new MutationObserver(() => ensureEntryInjected());
  observer.observe(document.documentElement, { childList: true, subtree: true });
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
