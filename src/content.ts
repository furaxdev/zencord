/**
 * @author FuraxDev
 * Content script, runs at document_start in the isolated extension world.
 * Injects core.js into the page's real DOM to bypass extension isolation and
 * gain access to webpackChunkdiscord_app.
 *
 * The script is fetched synchronously and injected inline (textContent, not
 * src) rather than as `<script src>`. A src-based script must round-trip to
 * fetch before executing, and Discord's own bundle can start pushing
 * Webpack chunks during that gap — any chunk pushed before patchWebpackChunk
 * installs its hook is never patchable again for the session. Synchronous
 * inline injection guarantees core.js runs before any later script tag gets
 * a chance to.
 */

function injectCore(): void {
  const request = new XMLHttpRequest();
  request.open("GET", chrome.runtime.getURL("core.js"), false);
  request.send();

  const script = document.createElement("script");
  script.textContent = request.responseText;
  (document.head || document.documentElement).appendChild(script);
  script.remove();
}

injectCore();
