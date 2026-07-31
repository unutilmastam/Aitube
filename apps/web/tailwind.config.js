/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        studio: {
          bg: "#0B0D10",
          panel: "#14171B",
          panelRaised: "#1C2026",
          border: "#262B32",
          text: "#E7E9EC",
          muted: "#8A919C",
        },
        signal: {
          amber: "#F2A93B",
          amberDim: "#8A611F",
          teal: "#4FD1C5",
          red: "#E5484D",
        },
      },
      fontFamily: {
        display: ["Space Grotesk", "sans-serif"],
        body: ["Inter", "sans-serif"],
        mono: ["IBM Plex Mono", "monospace"],
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(242,169,59,0.3), 0 0 24px rgba(242,169,59,0.15)",
      },
    },
  },
  plugins: [],
};
