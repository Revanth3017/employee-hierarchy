import { AppBar, Toolbar, Typography, Button, Container, Box } from "@mui/material";
import useAuth from "./hooks/useAuth";
import LoginForm from "./components/LoginForm";
import SearchBar from "./components/SearchBar";
import OrgTree from "./components/OrgTree";
import { useState } from "react";

export default function App() {
  const { user, isAuthenticated, login, logout } = useAuth();
  const [focusName, setFocusName] = useState("");

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

          {/* Search shrinks on mobile, grows on desktop */}
          <Box sx={{ flexBasis: { xs: "100%", sm: "auto" }, flexGrow: { xs: 1, sm: 0 } }}>
            <SearchBar onSearch={setFocusName} />
          </Box>

          <Typography variant="body2" sx={{ mr: 1 }}>
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
