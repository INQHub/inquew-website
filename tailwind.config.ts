import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"]
      },
      colors: {
        // V2 brand palette (Inquew color palette + the dark-green logo ground).
        paper: "#FFFFFF",
        ink: "#1F2A24",
        muted: "#4F5B54",
        faint: "#5A665F",
        sand: "#F7F8F5",
        line: "#E3E7E1",
        line2: "#E3E7E1",
        line3: "#C9D1CC",
        green: { DEFAULT: "#2D7B5F", tint: "#EAF3EE", border: "#C9E0D4" },
        olive: { DEFAULT: "#425206", tint: "#EFEDDF", border: "#DCD8BE" },
        khaki: "#978E4C",
        moss: "#425206",
        forest: "#14401A",
        sky: "#2DC6F0",
        aqua: "#13E2E9",
        cyan: { DEFAULT: "#2DC6F0", hover: "#13E2E9", ink: "#14401A" }
      },
      boxShadow: {
        card: "0 1px 2px rgba(20,64,26,.05)",
        cardHover: "0 10px 28px rgba(20,64,26,.10)",
        pop: "0 20px 50px rgba(45,123,95,.22)"
      }
    }
  },
  plugins: []
};

export default config;
