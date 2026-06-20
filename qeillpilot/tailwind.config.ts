import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#FBFAF8",
        ink: "#13151B",
        muted: "#6B7280",
        line: "#E6E4DF",
        brand: {
          DEFAULT: "#2F5DFF",
          deep: "#1B3DCB",
          soft: "#EAEFFF"
        },
        accent: {
          DEFAULT: "#7C5CFC",
          soft: "#F1ECFF"
        },
        mint: "#19B98C"
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"]
      },
      borderRadius: {
        card: "18px"
      },
      boxShadow: {
        card: "0 1px 2px rgba(19,21,27,0.04), 0 8px 24px rgba(19,21,27,0.06)"
      },
      backgroundImage: {
        "dot-line":
          "repeating-linear-gradient(90deg, #C9C6BD 0, #C9C6BD 6px, transparent 6px, transparent 14px)"
      }
    }
  },
  plugins: []
};

export default config;
