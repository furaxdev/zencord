# Project Instructions: ZenCord

## 🌍 User Context
- **Developer Name**: FuraxDev (or Furax)
- **Language**: The user is **French**. Code comments, documentation, and architecture must remain in English (standard dev practices), but you should communicate and explain your reasoning in French.


## 🎯 Project Objective
Develop "ZenCord", an ultra-lightweight Discord client modification built as a browser extension (Manifest V3). It allows injecting functional plugins, managing custom CSS themes, and blocking default telemetry/analytics.

## 🛠️ Mandatory Technical Specifications
- **Manifest V3**: Strict configuration targeting `https://discord.com*`.
- **Webpack Access**: `core.ts` is registered directly as a `document_start` content script running in the page's `"world": "MAIN"` (see `manifest.json`) — same `window` object as Discord's own scripts, guaranteed to run before them, no injection step. This replaced an earlier `content.ts` + `<script>`-tag-injection design: that approach lost the race against Discord's own bundle (chunks could push before the patch hook installed) and, when made synchronous via `document.write`, broke the page entirely (it resets the document instead of streaming into the existing parse). `world: "MAIN"` is the MV3-native fix for exactly this problem.
- **Core Utilities**: Implement a global `findByProps(...props)` helper function to scan and retrieve Discord's internal Webpack modules (e.g., Dispatcher, UserStore).
- **Modularity**: Enforce a strict plugin-based architecture (modular toggleable features) and clean CSS injection for custom themes.

## 🤖 Behavioral Rules for Claude Code
1. **Planning First**: ALWAYS propose the file structure or a step-by-step action plan before writing or modifying any code.
2. **Code Quality**: Write clean, modular, well-documented TypeScript following a strict "no-bloat" philosophy.


