/**
 * @author FuraxDev
 * Content script, runs at document_start in the isolated extension world.
 * Injects core.js as a real <script> tag into the page's DOM to bypass extension
 * isolation and gain access to webpackChunkdiscord_app.
 */

function injectCore(): void {
  const script = document.createElement("script");
  script.src = chrome.runtime.getURL("core.js");
  script.onload = () => script.remove();
  (document.head || document.documentElement).appendChild(script);
}

injectCore();
