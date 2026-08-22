import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-outfit)", "system-ui", "sans-serif"],
        body: ["var(--font-montserrat)", "system-ui", "sans-serif"]
      },
      colors: {
        paper: "#FDFCF9",
        ink: "#425206",
        muted: "#6B7A4A",
        faint: "#8A8468",
        sand: "#F7F5EC",
        line: "#E9E5D8",
        line2: "#EAE6D9",
        line3: "#E4E0D2",
        green: { DEFAULT: "#2D7B5F", tint: "#EFF6F2", border: "#D3E5DC" },
        olive: { DEFAULT: "#978E4C", tint: "#FBF7EA", border: "#E8DFC3" },
        forest: "#425206",
        cyan: { DEFAULT: "#13E2E9", hover: "#2DC6F0", ink: "#0B2E22" }
      },
      boxShadow: {
        card: "0 1px 2px rgba(66,82,6,.04)",
        cardHover: "0 10px 28px rgba(66,82,6,.10)",
        pop: "0 20px 50px rgba(45,123,95,.22)"
      }
    }
  },
  plugins: []
};

export default config;
