import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-y2k-display)", "sans-serif"],
      },
      colors: {
        y2k: {
          black: "#080a0f",
          surface: "#121820",
          raised: "#1a2230",
          navy: "#0f1623",
          border: "#d4a017",
          gold: "#d4a017",
          "gold-light": "#f0c14d",
          electric: "#2d7ff9",
          white: "#f4f6fa",
          muted: "#8b9cb3",
          ink: "#0a0c10",
          red: "#dc2626",
          "red-dark": "#991b1b",
          green: "#22c55e",
        },
        barber: {
          bg: "#080a0f",
          surface: "#121820",
          border: "#d4a017",
          gold: "#d4a017",
          "gold-light": "#f0c14d",
        },
      },
      boxShadow: {
        y2k: "4px 4px 0 0 #d4a017",
        "y2k-lg": "6px 6px 0 0 #d4a017",
        "y2k-sm": "2px 2px 0 0 #d4a017",
        "y2k-dark": "4px 4px 0 0 #000000",
      },
    },
  },
  plugins: [],
};
export default config;
