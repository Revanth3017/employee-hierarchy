// src/components/EmployeeCard.jsx
import React from "react";
import { Card, CardContent, Stack, Typography, Box, IconButton, Tooltip } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

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

function EmployeeCard({ emp, query, selected = false, canEdit = false, onEdit, onDelete }) {
  return (
    <Card
      variant="outlined"
      sx={{
        width: "100%",
        borderColor: selected ? "primary.main" : "divider",
        borderWidth: selected ? 2 : 1,
        bgcolor: selected ? "action.selected" : "background.paper",
        boxShadow: selected ? 2 : 0,
        transition: "background-color 120ms, border-color 120ms, box-shadow 120ms",
      }}
    >
      <CardContent sx={{ py: 1.25 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          {/* Left: text */}
          <Stack spacing={0.25} minWidth={0} sx={{ flex: 1 }}>
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

          {/* Right: admin actions */}
          {canEdit && (
            <Stack direction="row" spacing={0.5}>
              <Tooltip title="Edit">
                <IconButton
                  size="small"
                  onClick={(e) => { e.stopPropagation(); onEdit?.(emp); }}
                  aria-label="edit employee"
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete">
                <IconButton
                  size="small"
                  onClick={(e) => { e.stopPropagation(); onDelete?.(emp); }}
                  aria-label="delete employee"
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}

export default React.memo(EmployeeCard);
