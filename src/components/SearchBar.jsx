import { Box, TextField, InputAdornment, IconButton } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";

export default function SearchBar({ value, onChange, onSubmit, onClear }) {
  function submit(e) {
    e.preventDefault();
    onSubmit?.(); // triggers expand + scroll
  }

  const hasText = Boolean(value && value.trim().length);

  return (
    <Box
      component="form"
      onSubmit={submit}
      sx={{
        width: "100%",
        maxWidth: 620,         // feel free to change
        m: 0,
        p: 0,
        bgcolor: "transparent" // ✅ remove the white block behind the input
      }}
    >
      <TextField
        variant="outlined"
        size="medium"
        fullWidth
        placeholder="Search employee by name…"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        // ✅ style the outlined input + border behavior
        sx={{
          "& .MuiOutlinedInput-root": {
            borderRadius: 3,
            bgcolor: "common.white", // the input itself stays white
            // default/resting border
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: hasText ? "black" : "rgba(0,0,0,0.32)",
            },
            // hover border
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: hasText ? "black" : "rgba(0,0,0,0.6)",
            },
            // focused border
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: hasText ? "black" : "rgba(0,0,0,0.87)",
            },
          },
        }}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              {hasText && (
                <IconButton aria-label="clear search" onClick={onClear} edge="end">
                  <CloseIcon />
                </IconButton>
              )}
              <IconButton type="submit" aria-label="search" edge="end">
                <SearchIcon />
              </IconButton>
            </InputAdornment>
          ),
        }}
      />
    </Box>
  );
}
