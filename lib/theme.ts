export type ThemePreference = "system" | "light" | "dark";

export const THEME_STORAGE_KEY = "theme";
const THEME_EVENT = "themechange";

/**
 * Roda antes da primeira pintura (inline em <head>) para aplicar a classe .dark
 * sem flash. Precisa ser autocontido: é serializado como string.
 */
export const themeInitScript = `(function(){try{var p=localStorage.getItem("${THEME_STORAGE_KEY}");var d=p==="dark"||((p!=="light")&&matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d)}catch(e){}})()`;

function isPreference(value: unknown): value is ThemePreference {
  return value === "system" || value === "light" || value === "dark";
}

export function readThemePreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return isPreference(stored) ? stored : "system";
  } catch {
    return "system";
  }
}

export function applyTheme(preference: ThemePreference) {
  const dark =
    preference === "dark" ||
    (preference === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
}

export function setThemePreference(preference: ThemePreference) {
  try {
    if (preference === "system") localStorage.removeItem(THEME_STORAGE_KEY);
    else localStorage.setItem(THEME_STORAGE_KEY, preference);
  } catch {
    // Armazenamento bloqueado: o tema ainda muda nesta sessão.
  }
  applyTheme(preference);
  window.dispatchEvent(new Event(THEME_EVENT));
}

export function subscribeToTheme(onChange: () => void) {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const onSystemChange = () => {
    if (readThemePreference() === "system") applyTheme("system");
    onChange();
  };
  window.addEventListener(THEME_EVENT, onChange);
  window.addEventListener("storage", onChange);
  media.addEventListener("change", onSystemChange);
  return () => {
    window.removeEventListener(THEME_EVENT, onChange);
    window.removeEventListener("storage", onChange);
    media.removeEventListener("change", onSystemChange);
  };
}
