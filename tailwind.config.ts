import type { Config } from "tailwindcss";

const hsl = (name: string) => `hsl(var(--${name}) / <alpha-value>)`;

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      colors: {
        background: hsl("background"),
        foreground: hsl("foreground"),
        card: { DEFAULT: hsl("card"), foreground: hsl("card-foreground") },
        popover: { DEFAULT: hsl("popover"), foreground: hsl("popover-foreground") },
        primary: { DEFAULT: hsl("primary"), foreground: hsl("primary-foreground") },
        secondary: { DEFAULT: hsl("secondary"), foreground: hsl("secondary-foreground") },
        muted: { DEFAULT: hsl("muted"), foreground: hsl("muted-foreground") },
        accent: { DEFAULT: hsl("accent"), foreground: hsl("accent-foreground") },
        border: hsl("border"),
        input: hsl("input"),
        ring: hsl("ring"),
        success: hsl("success"),
        warning: hsl("warning"),
        destructive: hsl("destructive"),
        // Aliases antigos, mantidos para os componentes ainda não migrados.
        surface: {
          DEFAULT: hsl("background"),
          raised: hsl("card"),
          border: hsl("border"),
          sidebar: "hsl(60 5% 96%)",
        },
      },
      borderRadius: {
        lg: "calc(var(--radius) - 2px)",
        xl: "var(--radius)",
        "2xl": "calc(var(--radius) + 4px)",
      },
    },
  },
  plugins: [],
};

export default config;
