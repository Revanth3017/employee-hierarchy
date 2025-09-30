// src/context/ThemeContext.jsx
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { ThemeProvider, createTheme, responsiveFontSizes } from "@mui/material/styles";
import { CssBaseline } from "@mui/material";

const ThemeModeCtx = createContext({ mode: "light", toggle: () => {} });

export function ThemeModeProvider({ children }) {
  // Start with saved mode → OS preference → light
  const initial = (() => {
    const saved = localStorage.getItem("mode");
    if (saved === "light" || saved === "dark") return saved;
    if (window.matchMedia?.("(prefers-color-scheme: dark)").matches) return "dark";
    return "light";
  })();

  const [mode, setMode] = useState(initial);

  useEffect(() => {
    localStorage.setItem("mode", mode);
  }, [mode]);

  const muiTheme = useMemo(() => {
    const t = createTheme({
      palette: { mode },
      shape: { borderRadius: 10 },
      components: {
        // Keep surfaces clean (no gradient) in both modes
        MuiPaper: {
          styleOverrides: { root: { backgroundImage: "none" } },
        },
        MuiCard: {
          styleOverrides: {
            root: ({ theme }) => ({
              backgroundImage: "none",
              borderColor:
                theme.palette.mode === "dark"
                  ? theme.palette.grey[800]
                  : theme.palette.divider,
            }),
          },
        },
        // AppBar uses theme primary color consistently
        MuiAppBar: {
          defaultProps: { color: "primary" },
        },
        // Inputs get a surface bg that matches the theme
        MuiOutlinedInput: {
          styleOverrides: {
            root: ({ theme }) => ({
              backgroundColor: theme.palette.background.paper,
            }),
          },
        },
        // Subtle default: no 3D buttons
        MuiButton: {
          defaultProps: { disableElevation: true },
        },
      },
    });
    return responsiveFontSizes(t);
  }, [mode]);

  const value = useMemo(
    () => ({ mode, toggle: () => setMode((m) => (m === "light" ? "dark" : "light")) }),
    [mode]
  );

  return (
    <ThemeModeCtx.Provider value={value}>
      <ThemeProvider theme={muiTheme}>
        {/* Normalizes page colors and sets CSS color-scheme for dark mode */}
        <CssBaseline enableColorScheme />
        {children}
      </ThemeProvider>
    </ThemeModeCtx.Provider>
  );
}

export function useThemeMode() {
  return useContext(ThemeModeCtx);
}
