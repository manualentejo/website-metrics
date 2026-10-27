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
          DEFAULT: "#0b0f17",
          raised: "#111827",
          border: "#1f2937",
        },
      },
    },
  },
  darkMode: "class",
  plugins: [],
};

export default config;
