import { useState } from "react";
import {
  AppBar, Toolbar, Typography, Button, Container, Box, IconButton, Tooltip
} from "@mui/material";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";

import useAuth from "./hooks/useAuth";
import LoginForm from "./components/LoginForm";
import SearchBar from "./components/SearchBar";
import OrgTree from "./components/OrgTree";
import { useThemeMode } from "./context/ThemeContext";

export default function App() {
  const { user, isAuthenticated, login, logout } = useAuth();
  const [focusName, setFocusName] = useState("");
  const { mode, toggle } = useThemeMode();

  if (!isAuthenticated) return <LoginForm onLogin={login} />;

  return (
    <>
      <AppBar position="static">
        <Toolbar
          sx={{
            gap: 1,
            flexWrap: "wrap",
            alignItems: "center",
            py: { xs: 1, sm: 1.5 },
          }}
        >
          <Typography variant="h6" sx={{ flexGrow: 1, minWidth: 180 }}>
            Employee Hierarchy
          </Typography>

          {/* Search: full width on mobile, inline on larger screens */}
          <Box sx={{ flexBasis: { xs: "100%", sm: "auto" }, flexGrow: { xs: 1, sm: 0 } }}>
            <SearchBar onSearch={setFocusName} />
          </Box>

          {/* Theme toggle */}
          <Tooltip title={mode === "light" ? "Switch to dark" : "Switch to light"}>
            <IconButton color="inherit" onClick={toggle} aria-label="toggle theme mode">
              {mode === "light" ? <DarkModeIcon /> : <LightModeIcon />}
            </IconButton>
          </Tooltip>

          <Typography variant="body2" sx={{ mr: 1, display: { xs: "none", sm: "block" } }}>
            Hi, {user.name}
          </Typography>

          <Button color="inherit" onClick={logout}>Logout</Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 } }}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h5" gutterBottom>
            Organization
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Use the search to focus a person. Nodes expand automatically to reveal them.
          </Typography>
        </Box>

        <OrgTree focusName={focusName} />
      </Container>
    </>
  );
}
