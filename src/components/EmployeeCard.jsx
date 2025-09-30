import React from "react";
import { Card, CardContent, Stack, Typography, Box } from "@mui/material";

function highlight(text, query) {
  if (!query) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  const before = text.slice(0, idx);
  const match  = text.slice(idx, idx + query.length);
  const after  = text.slice(idx + query.length);
  return (
    <>
      {before}
      <Box component="mark" sx={{ px: 0.25, bgcolor: "warning.light", color: "inherit" }}>
        {match}
      </Box>
      {after}
    </>
  );
}

function EmployeeCard({ emp, query, selected = false }) {
  return (
    <Card
      variant="outlined"
      sx={{
        width: "100%",
        borderColor: selected ? "primary.main" : "divider",
        borderWidth: selected ? 2 : 1,
        boxShadow: selected ? 2 : 0,
        bgcolor: selected ? "action.hover" : "background.paper",
        transition: "background-color 120ms ease, border-color 120ms ease",
      }}
    >
      <CardContent sx={{ py: 1.25 }}>
        <Stack spacing={0.25} minWidth={0}>
          <Typography variant="subtitle1" fontWeight={600} noWrap>
            {highlight(emp.name, query)}
          </Typography>
          {emp.role && (
            <Typography variant="body2" color="text.secondary" noWrap>
              {emp.role}
            </Typography>
          )}
          {emp.department && (
            <Typography variant="caption" color="text.secondary" noWrap>
              {emp.department}
            </Typography>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}

export default React.memo(EmployeeCard);
