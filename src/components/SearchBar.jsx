// src/components/SearchBar.jsx
import React, { useState } from "react";

export default function SearchBar({ value, onChange, onSubmit, onClear }) {
  const [isFocused, setIsFocused] = useState(false);
  const hasText = Boolean(value && value.trim().length);

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit && onSubmit(); // expand + scroll in your parent
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        width: "100%",
        maxWidth: 720,
        margin: 0,
        padding: 0,
        background: "transparent", // ✅ no white halo
      }}
    >
      <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
        <input
          type="text"
          placeholder="Search employee by name…"
          value={value}
          onChange={(e) => onChange && onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={{
            flex: 1,
            height: 44,
            padding: "0 86px 0 14px", // room for 2 buttons on the right
            border: "2px solid",
            borderColor: hasText || isFocused ? "#000" : "#bdbdbd",
            borderRadius: 12,
            outline: "none",
            background: "#fff",  // ✅ stays readable in dark mode
            color: "#111",
            fontSize: 16,
            boxSizing: "border-box",
          }}
        />

        {/* Clear button (only when there is text) */}
        {hasText && (
          <button
            type="button"
            onClick={onClear}
            title="Clear"
            style={{
              position: "absolute",
              right: 44,
              width: 32,
              height: 32,
              display: "grid",
              placeItems: "center",
              border: "none",
              background: "transparent",
              cursor: "pointer",
            }}
          >
            {/* small X icon */}
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path
                d="M18 6L6 18M6 6l12 12"
                stroke="#555"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        )}

        {/* Search submit button */}
        <button
          type="submit"
          title="Search"
          style={{
            position: "absolute",
            right: 6,
            width: 32,
            height: 32,
            display: "grid",
            placeItems: "center",
            border: "none",
            background: "transparent",
            cursor: "pointer",
          }}
        >
          {/* magnifying glass icon */}
          <svg width="22" height="22" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="7" fill="none" stroke="#555" strokeWidth="2" />
            <line x1="16.65" y1="16.65" x2="21" y2="21" stroke="#555" strokeWidth="2" />
          </svg>
        </button>
      </div>
    </form>
  );
}
