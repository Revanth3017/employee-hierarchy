// src/index.js
import React from "react";
import { createRoot } from "react-dom/client";   // ← correct import
import App from "./App";
import { ThemeModeProvider } from "./context/ThemeContext";
import { BrowserRouter } from "react-router-dom";
import "./index.css";

const container = document.getElementById("root");
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <ThemeModeProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ThemeModeProvider>
  </React.StrictMode>
);
