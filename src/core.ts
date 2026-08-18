/**
 * @author FuraxDev
 * ZenCord core — injected directly into Discord's real page context by content.ts.
 * Exposes findByProps globally and bootstraps plugins and themes.
 */

import { findByProps } from "./webpack/findByProps";
import { initPlugins } from "./plugins/index";

window.findByProps = findByProps;

initPlugins();

console.log("[ZenCord] Core injected and initialized.");
