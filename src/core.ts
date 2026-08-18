/**
 * @author FuraxDev
 * ZenCord core — registered as a document_start content script running in
 * the page's MAIN world (manifest.json), so it executes directly in
 * Discord's real page context (same window as their own scripts) before any
 * of their code runs, with no injection step and no page-CSP exposure.
 * Exposes findByProps globally and bootstraps plugins and themes.
 */

import { patchWebpackChunk } from "./webpack/patchWebpackChunk";
import { findByProps } from "./webpack/findByProps";
import { initPlugins } from "./plugins/index";
import { initThemes } from "./themes/registry";

patchWebpackChunk();

window.findByProps = findByProps;

initPlugins();
initThemes();

console.log("[ZenCord] Core injected and initialized.");
