/**
 * @author FuraxDev
 * FakeProfileThemes: lets anyone set a custom profile gradient without
 * Nitro by hiding a color pair as invisible Unicode "tag" characters
 * (3y3-style steganography) inside their About Me bio. Other ZenCord
 * users automatically decode it and re-skin the profile popout.
 *
 * This is ZenCord's own encoding (zc1:<primary>:<accent>), not
 * wire-compatible with other clients' similar plugins. Applying the
 * gradient is a DOM heuristic (nearest sizable ancestor of the bio text),
 * not a real patch of Discord's profile component, so it may miss on
 * some client layouts.
 */

import type { Plugin } from "./index";

const TAG_OFFSET = 0xe0000;
const TAG_MIN = 0x20;
const TAG_MAX = 0x7e;
const PAYLOAD_PREFIX = "zc1:";
const PANEL_ID = "zencord-profile-theme-panel";

function encode3y3(payload: string): string {
  let out = "";
  for (const char of payload) {
    const code = char.codePointAt(0) ?? 0;
    if (code < TAG_MIN || code > TAG_MAX) continue;
    out += String.fromCodePoint(TAG_OFFSET + code);
  }
  return out;
}

function decode3y3(text: string): string | null {
  let out = "";
  for (const char of text) {
    const code = char.codePointAt(0) ?? 0;
    if (code < TAG_OFFSET + TAG_MIN || code > TAG_OFFSET + TAG_MAX) continue;
    out += String.fromCodePoint(code - TAG_OFFSET);
  }
  return out.startsWith(PAYLOAD_PREFIX) ? out : null;
}

function parseColors(decoded: string): { primary: string; accent: string } | null {
  const [primary, accent] = decoded.slice(PAYLOAD_PREFIX.length).split(":");
  if (!/^#[0-9a-f]{6}$/i.test(primary ?? "") || !/^#[0-9a-f]{6}$/i.test(accent ?? "")) return null;
  return { primary, accent };
}

function findSizableAncestor(element: Element, maxHops = 6): HTMLElement | null {
  let current: Element | null = element;
  for (let i = 0; i < maxHops && current; i++) {
    if (current instanceof HTMLElement && current.offsetWidth > 150 && current.offsetHeight > 80) {
      return current;
    }
    current = current.parentElement;
  }
  return null;
}

const styledElements = new WeakSet<HTMLElement>();

function applyThemeFromTextNode(node: Text): void {
  const decoded = decode3y3(node.textContent ?? "");
  if (!decoded || !node.parentElement) return;

  const colors = parseColors(decoded);
  if (!colors) return;

  const target = findSizableAncestor(node.parentElement);
  if (!target || styledElements.has(target)) return;

  target.style.background = `linear-gradient(135deg, ${colors.primary}, ${colors.accent})`;
  styledElements.add(target);
}

function scanNode(node: Node): void {
  if (node.nodeType === Node.TEXT_NODE) {
    applyThemeFromTextNode(node as Text);
    return;
  }
  if (!(node instanceof Element)) return;

  const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
  let textNode = walker.nextNode();
  while (textNode) {
    applyThemeFromTextNode(textNode as Text);
    textNode = walker.nextNode();
  }
}

let observer: MutationObserver | undefined;

function startObserving(): void {
  observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      mutation.addedNodes.forEach(scanNode);
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

function stopObserving(): void {
  observer?.disconnect();
  observer = undefined;
}

function toggleThemePanel(): void {
  const existing = document.getElementById(PANEL_ID);
  if (existing) {
    existing.remove();
    return;
  }

  const panel = document.createElement("div");
  panel.id = PANEL_ID;
  panel.style.cssText =
    "position:fixed;bottom:20px;right:20px;z-index:2147483647;background:#211d29;border:1px solid #332c3d;border-radius:16px;padding:16px;display:flex;flex-direction:column;gap:10px;font-family:sans-serif;color:#e2e8f0;width:220px;box-shadow:0 10px 40px rgba(0,0,0,0.5);";

  const title = document.createElement("div");
  title.textContent = "ZenCord profile theme";
  title.style.cssText = "font-weight:600;font-size:14px;";
  panel.appendChild(title);

  const primaryInput = document.createElement("input");
  primaryInput.type = "color";
  primaryInput.value = "#18151e";
  const accentInput = document.createElement("input");
  accentInput.type = "color";
  accentInput.value = "#ff94b8";

  for (const [label, input] of [
    ["Primary", primaryInput],
    ["Accent", accentInput],
  ] as const) {
    const row = document.createElement("label");
    row.style.cssText = "display:flex;align-items:center;justify-content:space-between;font-size:13px;";
    row.textContent = label;
    input.style.cssText = "width:40px;height:28px;border:none;border-radius:6px;background:none;cursor:pointer;";
    row.appendChild(input);
    panel.appendChild(row);
  }

  const copyButton = document.createElement("button");
  copyButton.textContent = "Copy invisible code";
  copyButton.style.cssText =
    "margin-top:6px;padding:8px;border-radius:8px;border:none;background:#ff94b8;color:#18151e;font-weight:600;cursor:pointer;";
  copyButton.addEventListener("click", () => {
    const payload = `${PAYLOAD_PREFIX}${primaryInput.value}:${accentInput.value}`;
    void navigator.clipboard.writeText(encode3y3(payload));
    copyButton.textContent = "Copied! Paste it in your bio";
    setTimeout(() => (copyButton.textContent = "Copy invisible code"), 2000);
  });
  panel.appendChild(copyButton);

  document.body.appendChild(panel);
}

export const fakeProfileThemesPlugin: Plugin = {
  name: "FakeProfileThemes",
  description: "Hides a profile color gradient as invisible text in bios so anyone can theme their profile.",
  enabled: true,
  start(): void {
    startObserving();
    window.zencordToggleProfileThemePanel = toggleThemePanel;
  },
  stop(): void {
    stopObserving();
    document.getElementById(PANEL_ID)?.remove();
    delete window.zencordToggleProfileThemePanel;
  },
};
