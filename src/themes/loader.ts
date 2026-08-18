/**
 * @author FuraxDev
 * Injects and removes custom CSS themes via a single dedicated <style> tag.
 */

const STYLE_ELEMENT_ID = "zencord-theme";

function getStyleElement(): HTMLStyleElement {
  let style = document.getElementById(STYLE_ELEMENT_ID) as HTMLStyleElement | null;
  if (!style) {
    style = document.createElement("style");
    style.id = STYLE_ELEMENT_ID;
    // core.js runs at document_start, before <head> necessarily exists yet;
    // documentElement (<html>) is always present by then.
    (document.head ?? document.documentElement).appendChild(style);
  }
  return style;
}

export function injectTheme(css: string): void {
  getStyleElement().textContent = css;
}

export function removeTheme(): void {
  document.getElementById(STYLE_ELEMENT_ID)?.remove();
}
