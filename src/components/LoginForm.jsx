import { useState } from "react";
import { Container, Paper, TextField, Button, Typography, Stack, Alert } from "@mui/material";

/**
 * LoginForm: responsive layout
 * - centered on all screens
 * - compact on phones, roomier on tablets/desktop
 * - inputs 100% width on small screens
 */
export default function LoginForm({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setErr("");
    try {
      await onLogin(username, password);
    } catch (e) {
      setErr(e.message || "Login failed");
    }
  }

  return (
    <Container
      component="main"
      maxWidth="xs"                       // nice width on mobile; auto scales up
      sx={{ minHeight: "100vh", display: "flex", alignItems: "center" }}
    >
      <Paper
        elevation={2}
        sx={{
          width: "100%",
          px: { xs: 2, sm: 3 },          // horizontal padding responsive
          py: { xs: 2.5, sm: 3 },
          borderRadius: 2,
        }}
      >
        <Typography variant="h6" gutterBottom>
          Sign in
        </Typography>

        <Stack component="form" onSubmit={handleSubmit} spacing={1.5}>
          <TextField
            size="medium"
            label="Username"
            fullWidth
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
          />
          <TextField
            size="medium"
            label="Password"
            type="password"
            fullWidth
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
          {err && <Alert severity="error">{err}</Alert>}
          <Button type="submit" variant="contained" size="large" fullWidth>
            Login
          </Button>
        </Stack>
      </Paper>
    </Container>
  );
}
