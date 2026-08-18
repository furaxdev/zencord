/**
 * @author FuraxDev
 * "Zen Dark" — a minimalist, higher-contrast dark theme. Only overrides
 * Discord's own CSS custom properties (stable across client builds) plus
 * generic scrollbar styling, avoiding hashed class names that break on
 * every Discord update.
 */

import type { Theme } from "./registry";

export const zenDarkTheme: Theme = {
  name: "Zen Dark",
  description: "Minimalist high-contrast dark theme with muted accents and a thin scrollbar.",
  css: `
:root {
  --background-primary: #1a1b1e !important;
  --background-secondary: #17181a !important;
  --background-secondary-alt: #131415 !important;
  --background-tertiary: #101112 !important;
  --background-floating: #1a1b1e !important;
  --background-mobile-primary: #1a1b1e !important;
  --background-mobile-secondary: #17181a !important;
  --channeltextarea-background: #202124 !important;
  --brand-experiment: #7c8cff !important;
  --brand-experiment-560: #7c8cff !important;
}

* {
  scrollbar-width: thin;
  scrollbar-color: #3a3b3f transparent;
}

::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-thumb {
  background-color: #3a3b3f;
  border-radius: 4px;
}

::-webkit-scrollbar-track {
  background-color: transparent;
}
`,
};
