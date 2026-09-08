import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        snap: {
          yellow: "#FFFC00",
          "yellow-hover": "#E6E300",
          black: "#000000",
          dark: "#0B0B0E",
          surface: "#141418",
          card: "rgba(255, 255, 255, 0.08)",
          border: "rgba(255, 255, 255, 0.12)",
          muted: "#8E8E93",
        },
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "SF Pro Display",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "sans-serif",
        ],
      },
      keyframes: {
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 15px rgba(255, 252, 0, 0.4)" },
          "50%": { boxShadow: "0 0 30px rgba(255, 252, 0, 0.8)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        pulseGlow: "pulseGlow 2s infinite ease-in-out",
        shimmer: "shimmer 2s infinite linear",
      },
    },
  },
  plugins: [],
};

export default config;
