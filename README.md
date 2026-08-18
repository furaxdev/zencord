# ZenCord

An ultra-lightweight Discord client modification, built as a Manifest V3 browser extension. It injects functional plugins, manages custom CSS themes, and blocks default telemetry/analytics.

Author: **FuraxDev**

## Development

```bash
npm install
npm run watch   # rebuild on change
npm run build   # production build
```

The build output goes to `dist/`.

## Load the extension (Chrome)

1. Run `npm run build`.
2. Open `chrome://extensions`.
3. Enable **Developer mode**.
4. Click **Load unpacked** and select the `dist/` folder.

## Project structure

- `src/content.ts` — content script injected at `document_start`; loads `core.js` as a real `<script>` tag in the page DOM.
- `src/core.ts` — entry point running in the page's real context; exposes `findByProps` and bootstraps plugins/themes.
- `src/webpack/findByProps.ts` — scans Discord's internal Webpack modules.
- `src/plugins/` — plugin registry and individual plugins.
- `src/themes/loader.ts` — custom CSS theme injection.
