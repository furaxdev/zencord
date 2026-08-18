/**
 * @author FuraxDev
 * Theme registry: lists available CSS themes and toggles which one is active.
 */

import { injectTheme, removeTheme } from "./loader";
import { zenDarkTheme } from "./zenDark";

export interface Theme {
  name: string;
  description: string;
  css: string;
}

const themes: Theme[] = [zenDarkTheme];
let activeThemeName: string | null = zenDarkTheme.name;

export function getThemes(): readonly Theme[] {
  return themes;
}

export function getActiveThemeName(): string | null {
  return activeThemeName;
}

export function setActiveTheme(name: string | null): void {
  if (name === null) {
    removeTheme();
    activeThemeName = null;
    return;
  }

  const theme = themes.find((t) => t.name === name);
  if (!theme) return;

  injectTheme(theme.css);
  activeThemeName = name;
}

export function initThemes(): void {
  if (activeThemeName) setActiveTheme(activeThemeName);
}
