import React from "react";

export const T = {
  teal900: "#004D5C",
  teal700: "#007A8C",
  teal500: "#00A8BF",
  teal300: "#00BFD8",
  teal100: "#D6F4F8",
  teal050: "#EDF9FB",
  navy: "#0B1D3A",
  green500: "#4CAF50",
  red: "#E5484D",
  gray950: "#0D1117",
  gray700: "#374151",
  gray600: "#4B5563",
  gray200: "#E5E7EB",
  gray100: "#F3F4F6",
  gray050: "#F9FAFB",
  white: "#FFFFFF",
};

export const card: React.CSSProperties = {
  background: T.white,
  borderRadius: 16,
  padding: 16,
  boxShadow: "0 2px 12px rgba(0,0,0,.06)",
  border: `1px solid ${T.gray200}`,
};

export const sectionTitle: React.CSSProperties = {
  fontFamily: "'Nunito',sans-serif",
  fontWeight: 800,
  fontSize: 16,
  color: T.gray950,
  margin: "0 0 12px",
};

export const btnPrimary: React.CSSProperties = {
  background: T.teal700,
  color: T.white,
  border: "none",
  borderRadius: 12,
  padding: "12px 20px",
  fontWeight: 700,
  fontSize: 14,
  cursor: "pointer",
  fontFamily: "inherit",
  minHeight: 44,
};

export const btnGhost: React.CSSProperties = {
  background: "transparent",
  color: T.teal700,
  border: "none",
  fontWeight: 600,
  fontSize: 13,
  cursor: "pointer",
  fontFamily: "inherit",
};
