import { useMemo } from "react";
import { AppBar, Toolbar, Typography, Button, Container, Box } from "@mui/material";
import useAuth from "./hooks/useAuth";
import LoginForm from "./components/LoginForm";

/**
 * App shell:
 * - On mobile, items wrap (no overflow) and keep touch-friendly spacing.
 * - Content area uses responsive vertical padding.
 */
export default function App() {
  const { user, isAuthenticated, login, logout } = useAuth();

  if (!isAuthenticated) return <LoginForm onLogin={login} />;

  return (
    <>
      <AppBar position="static">
        <Toolbar
          sx={{
            gap: 1,
            flexWrap: "wrap",                 // critical for responsiveness
            alignItems: "center",
            py: { xs: 1, sm: 1.5 },          // slightly taller on bigger screens
          }}
        >
          <Typography variant="h6" sx={{ flexGrow: 1, minWidth: 180 }}>
            Employee Hierarchy
          </Typography>

          {/* Greeting can wrap or move to a new line on narrow screens */}
          <Typography variant="body2" sx={{ mr: 1 }}>
            Hi, {user.name}
          </Typography>

          <Button color="inherit" onClick={logout}>Logout</Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 } }}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h5" gutterBottom>
            Home
          </Typography>
          <Typography variant="body1">
            You are logged in. Next we’ll add the Org Tree, Search, and Theme toggle here.
          </Typography>
        </Box>
      </Container>
    </>
  );
}
