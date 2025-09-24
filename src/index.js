import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./App.css";

import CssBaseline from "@mui/material/CssBaseline";
import { ThemeModeProvider } from "./context/ThemeContext";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeModeProvider>
      <CssBaseline />
      <App />
    </ThemeModeProvider>
  </React.StrictMode>
);
