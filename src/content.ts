/**
 * @author FuraxDev
 * Content script, runs at document_start in the isolated extension world.
 * Injects core.js into the page's real DOM to bypass extension isolation and
 * gain access to webpackChunkdiscord_app.
 *
 * Uses document.write() to insert a <script src="chrome-extension://...">
 * tag during the document's initial parse. Two things depend on this exact
 * combination:
 *   - src (not inline textContent): Discord's CSP has no 'unsafe-inline'
 *     for script-src and would block an inline script outright; a
 *     chrome-extension:// src is exempt from the page's CSP.
 *   - document.write during parsing: the parser blocks on a <script src>
 *     it just wrote until that script has fetched AND executed, before
 *     resuming with the rest of the original document — including
 *     Discord's own script tags. This closes the race where their bundle
 *     could start pushing Webpack chunks before our patch hook is
 *     installed (which broke source patches silently: chunks pushed
 *     before the hook exists are never patchable again for the session).
 */

function injectCore(): void {
  document.write(`<script src="${chrome.runtime.getURL("core.js")}"></script>`);
}

injectCore();
