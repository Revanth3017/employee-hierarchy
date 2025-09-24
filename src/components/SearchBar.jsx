import { TextField, InputAdornment, IconButton } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";

export default function SearchBar({ value, onChange, onSubmit, onClear }) {
  function submit(e) {
    e.preventDefault();
    onSubmit?.();            // triggers expand + scroll
  }

  return (
    <form onSubmit={submit} style={{ width: "100%", maxWidth: 420 }}>
      <TextField
        size="small"
        fullWidth
        placeholder="Search employee by name…"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              {value ? (
                <IconButton aria-label="clear search" onClick={onClear} edge="end">
                  <CloseIcon />
                </IconButton>
              ) : null}
              <IconButton type="submit" aria-label="search" edge="end">
                <SearchIcon />
              </IconButton>
            </InputAdornment>
          ),
        }}
      />
    </form>
  );
}
