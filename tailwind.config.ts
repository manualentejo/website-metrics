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
          DEFAULT: "#f7f8fa",
          raised: "#ffffff",
          border: "#e5e7eb",
          sidebar: "#ffffff",
        },
      },
    },
  },
  darkMode: "class",
  plugins: [],
};

export default config;
