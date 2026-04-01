import { useEffect, useState } from "react";

export interface ThemeConfig {
  id: string;
  label: string;
  primary: string;
  isDark: boolean;
  preview: { bg: string; accent: string };
}

const DARK_BASE = {
  "--background": "240 10% 4%",
  "--foreground": "0 0% 98%",
  "--card": "240 8% 8%",
  "--card-foreground": "0 0% 98%",
  "--popover": "240 8% 8%",
  "--popover-foreground": "0 0% 98%",
  "--secondary": "240 6% 14%",
  "--secondary-foreground": "0 0% 98%",
  "--muted": "240 6% 14%",
  "--muted-foreground": "240 5% 64%",
  "--border": "240 6% 18%",
  "--input": "240 6% 18%",
  "--sidebar-background": "240 8% 8%",
  "--sidebar-foreground": "0 0% 98%",
  "--sidebar-accent": "240 6% 14%",
  "--sidebar-accent-foreground": "0 0% 98%",
  "--sidebar-border": "240 6% 18%",
};

const LIGHT_BASE = {
  "--background": "0 0% 97%",
  "--foreground": "240 10% 10%",
  "--card": "0 0% 100%",
  "--card-foreground": "240 10% 10%",
  "--popover": "0 0% 100%",
  "--popover-foreground": "240 10% 10%",
  "--secondary": "240 5% 90%",
  "--secondary-foreground": "240 10% 10%",
  "--muted": "240 5% 90%",
  "--muted-foreground": "240 5% 40%",
  "--border": "240 5% 82%",
  "--input": "240 5% 82%",
  "--sidebar-background": "0 0% 100%",
  "--sidebar-foreground": "240 10% 10%",
  "--sidebar-accent": "240 5% 93%",
  "--sidebar-accent-foreground": "240 10% 10%",
  "--sidebar-border": "240 5% 85%",
};

export const THEMES: ThemeConfig[] = [
  { id: "orange-dark", label: "Orange & Black", primary: "24 95% 53%", isDark: true, preview: { bg: "#0a0a0f", accent: "#e8772e" } },
  { id: "purple-dark", label: "Purple & Black", primary: "270 60% 50%", isDark: true, preview: { bg: "#0a0a0f", accent: "#8033cc" } },
  { id: "maroon-dark", label: "Maroon & Black", primary: "0 60% 35%", isDark: true, preview: { bg: "#0a0a0f", accent: "#8f2323" } },
  { id: "orange-light", label: "Orange & White", primary: "24 95% 50%", isDark: false, preview: { bg: "#f7f7f7", accent: "#e07520" } },
  { id: "purple-light", label: "Purple & White", primary: "270 60% 45%", isDark: false, preview: { bg: "#f7f7f7", accent: "#7329b8" } },
  { id: "red-light", label: "Red & White", primary: "0 70% 50%", isDark: false, preview: { bg: "#f7f7f7", accent: "#d92626" } },
];

const STORAGE_KEY = "critiqs-theme";

export function useTheme() {
  const [themeId, setThemeId] = useState(() => localStorage.getItem(STORAGE_KEY) || "orange-dark");

  const applyTheme = (id: string) => {
    const theme = THEMES.find(t => t.id === id) || THEMES[0];
    const base = theme.isDark ? DARK_BASE : LIGHT_BASE;
    const root = document.documentElement;

    Object.entries(base).forEach(([key, val]) => root.style.setProperty(key, val));
    root.style.setProperty("--primary", theme.primary);
    root.style.setProperty("--primary-foreground", theme.isDark ? "0 0% 98%" : "0 0% 100%");
    root.style.setProperty("--accent", theme.primary);
    root.style.setProperty("--accent-foreground", theme.isDark ? "0 0% 98%" : "0 0% 100%");
    root.style.setProperty("--ring", theme.primary);
    root.style.setProperty("--destructive", "0 84% 60%");
    root.style.setProperty("--destructive-foreground", "0 0% 98%");
    root.style.setProperty("--sidebar-primary", theme.primary);
    root.style.setProperty("--sidebar-primary-foreground", theme.isDark ? "0 0% 98%" : "0 0% 100%");
    root.style.setProperty("--sidebar-ring", theme.primary);

    // Toggle body class for light/dark specific CSS
    root.classList.toggle("light-theme", !theme.isDark);
    root.classList.toggle("dark-theme", theme.isDark);
  };

  useEffect(() => {
    applyTheme(themeId);
  }, [themeId]);

  const setTheme = (id: string) => {
    localStorage.setItem(STORAGE_KEY, id);
    setThemeId(id);
  };

  const currentTheme = THEMES.find(t => t.id === themeId) || THEMES[0];

  return { themeId, setTheme, currentTheme, themes: THEMES };
}
