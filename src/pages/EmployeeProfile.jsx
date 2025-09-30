import { useMemo } from "react";
import { useParams, Link as RouterLink, useNavigate } from "react-router-dom";
import {
  Box, Button, Card, CardContent, Chip, Container, Divider,
  Stack, Typography
} from "@mui/material";
import EMPLOYEES from "../data/employees.json";
import { normalizeEmployees } from "../utils/buildTree";

const STORAGE_KEY = "employees";

export default function EmployeeProfile() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Load from localStorage (persisted), fallback to bundled JSON
  const employees = useMemo(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const base = stored ? JSON.parse(stored) : EMPLOYEES;
    return normalizeEmployees(base);
  }, []);

  const byId = useMemo(() => new Map(employees.map(e => [String(e.id), e])), [employees]);
  const emp = byId.get(String(id));

  const manager = emp?.managerId != null ? byId.get(String(emp.managerId)) : null;
  const reports = useMemo(() => employees.filter(e => String(e.managerId) === String(id)), [employees, id]);

  if (!emp) {
    return (
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Typography variant="h6" gutterBottom>Employee not found</Typography>
        <Button variant="contained" onClick={() => navigate("/")}>Back to chart</Button>
      </Container>
    );
  }

  const initials = (emp.name || "")
    .split(" ")
    .map(p => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <Container maxWidth="md" sx={{ py: { xs: 2, md: 4 } }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Button component={RouterLink} to="/" variant="outlined">← Back to chart</Button>
      </Stack>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center">
            <Box
              sx={{
                width: 72, height: 72, borderRadius: "50%",
                bgcolor: "primary.main", color: "primary.contrastText",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 28, fontWeight: 700, flex: "0 0 auto"
              }}
            >
              {initials}
            </Box>

            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="h5" fontWeight={700} noWrap>{emp.name}</Typography>
              <Typography variant="body1" color="text.secondary" noWrap>{emp.role || "—"}</Typography>
              <Typography variant="body2" color="text.secondary" noWrap>{emp.department || "—"}</Typography>
            </Box>

            {manager && (
              <Stack alignItems={{ xs: "flex-start", sm: "flex-end" }}>
                <Typography variant="caption" color="text.secondary">Reports to</Typography>
                <Button
                  component={RouterLink}
                  to={`/profile/${manager.id}`}
                  size="small"
                  sx={{ textTransform: "none", px: 0 }}
                >
                  {manager.name} →
                </Button>
              </Stack>
            )}
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom>Direct reports</Typography>
          <Divider sx={{ mb: 2 }} />
          {reports.length ? (
            <Stack direction="row" flexWrap="wrap" gap={1}>
              {reports.map(r => (
                <Chip
                  key={r.id}
                  label={r.name}
                  component={RouterLink}
                  clickable
                  to={`/profile/${r.id}`}
                />
              ))}
            </Stack>
          ) : (
            <Typography variant="body2" color="text.secondary">No direct reports.</Typography>
          )}
        </CardContent>
      </Card>
    </Container>
  );
}
