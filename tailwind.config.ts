import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#151515",
        paper: "#fbfaf7",
        moss: "#406451",
        clay: "#b85f43",
        steel: "#4e6f87",
        lemon: "#e0b840",
      },
      boxShadow: {
        soft: "0 18px 60px rgba(24, 24, 24, 0.10)",
        insetPanel: "inset 0 1px 0 rgba(255,255,255,0.7)",
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "ui-sans-serif", "system-ui"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "SFMono-Regular"],
      },
    },
  },
  plugins: [],
};

export default config;
