import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      colors: {
        surface: {
          DEFAULT: "#f4f4f5",
          raised: "#ffffff",
          border: "#e4e4e7",
          sidebar: "#ffffff",
        },
      },
      borderRadius: {
        xl: "0.875rem",
      },
    },
  },
  darkMode: "class",
  plugins: [],
};

export default config;
