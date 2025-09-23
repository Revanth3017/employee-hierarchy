import React from "react";
import { Card, CardContent, Stack, Typography } from "@mui/material";

function EmployeeCard({ emp }) {
  return (
    <Card variant="outlined" sx={{ width: "100%" }}>
      <CardContent sx={{ py: 1.25 }}>
        <Stack spacing={0.25}>
          <Typography variant="subtitle1" fontWeight={600} noWrap>
            {emp.name}
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
