import type { Config } from "tailwindcss";

// LumenX Studio brand palette (from the official logo)
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0d1426",      // deep navy background (logo letter color family)
        panel: "#131c33",    // raised surfaces
        line: "#20305a",     // hairline borders
        accent: "#2563eb",   // LumenX primary blue (STUDIO wordmark)
        accentBright: "#3b82f6", // gradient-X bright blue
        accentDim: "#1d4ed8",
        up: "#34d399",       // positive deltas
        warn: "#f59e0b",
        danger: "#ef4444",
      },
      fontFamily: {
        sans: ["var(--font-poppins)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
