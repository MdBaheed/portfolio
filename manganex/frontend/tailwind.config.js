/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Deep-survey navy scale -- the base of the geospatial-intelligence
        // shell (map canvas, panels, chrome).
        abyss: {
          950: "#050a12",
          900: "#0a1220",
          800: "#101c30",
          700: "#182842",
          600: "#243657",
        },
        // Signal cyan -- the instrument accent used for active data,
        // selected targets, and primary actions.
        signal: {
          400: "#5fd8ff",
          500: "#2bb8f0",
          600: "#1a93c9",
        },
        // Risk-tier semantic colors (used sparingly, only for prospectivity
        // / risk indicators -- never as general decoration).
        risk: {
          low: "#3fcf8e",
          medium: "#e8a33d",
          high: "#e2593f",
        },
      },
      fontFamily: {
        display: ["'Space Grotesk'", "system-ui", "sans-serif"],
        mono: ["'IBM Plex Mono'", "ui-monospace", "monospace"],
        body: ["'Inter'", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
