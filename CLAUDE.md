# Project Instructions: ZenCord

## 🌍 User Context
- **Developer Name**: FuraxDev (or Furax)
- **Language**: The user is **French**. Code comments, documentation, and architecture must remain in English (standard dev practices), but you should communicate and explain your reasoning in French.


## 🎯 Project Objective
Develop "ZenCord", an ultra-lightweight Discord client modification built as a browser extension (Manifest V3). It allows injecting functional plugins, managing custom CSS themes, and blocking default telemetry/analytics.

## 🛠️ Mandatory Technical Specifications
- **Manifest V3**: Strict configuration targeting `https://discord.com*`.
- **Webpack Injection**: The `content.ts` script (running at `document_start`) must inject `core.ts` directly into the page's real DOM via a `<script>` tag. This is required to bypass extension isolation and access `webpackChunkdiscord_app`.
- **Core Utilities**: Implement a global `findByProps(...props)` helper function to scan and retrieve Discord's internal Webpack modules (e.g., Dispatcher, UserStore).
- **Modularity**: Enforce a strict plugin-based architecture (modular toggleable features) and clean CSS injection for custom themes.

## 🤖 Behavioral Rules for Claude Code
1. **Planning First**: ALWAYS propose the file structure or a step-by-step action plan before writing or modifying any code.
2. **Security & Validity**: Ensure the `web_accessible_resources` directive in `manifest.json` is always correctly configured to allow script injection into the DOM.
3. **Code Quality**: Write clean, modular, well-documented TypeScript following a strict "no-bloat" philosophy.
4. - **NEVER modify, delete, or overwrite** the `public/index.html` file. This file contains the approved, rebranded production landing page assets and must remain completely untouched by Claude Code under any circumstances.

