import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { ThemeProvider, createTheme, responsiveFontSizes } from "@mui/material/styles";

const ThemeModeCtx = createContext({ mode: "light", toggle: () => {} });

export function ThemeModeProvider({ children }) {
  // start with localStorage, otherwise respect OS preference, else 'light'
  const initial = (() => {
    const saved = localStorage.getItem("mode");
    if (saved === "light" || saved === "dark") return saved;
    if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      return "dark";
    }
    return "light";
  })();

  const [mode, setMode] = useState(initial);

  useEffect(() => {
    localStorage.setItem("mode", mode);
  }, [mode]);

  const muiTheme = useMemo(() => {
    let t = createTheme({ palette: { mode } });
    return responsiveFontSizes(t);
  }, [mode]);

  const value = useMemo(
    () => ({ mode, toggle: () => setMode(m => (m === "light" ? "dark" : "light")) }),
    [mode]
  );

  return (
    <ThemeModeCtx.Provider value={value}>
      <ThemeProvider theme={muiTheme}>{children}</ThemeProvider>
    </ThemeModeCtx.Provider>
  );
}

export function useThemeMode() {
  return useContext(ThemeModeCtx);
}
