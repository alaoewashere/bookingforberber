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
        thmanyah: ["var(--font-thmanyah)", "serif"],
      },
      colors: {
        m: {
          bg:            "#0c0806",
          surface:       "#161009",
          elevated:      "#201610",
          elevated2:     "#2a1d13",
          brown:         "#a0724a",
          "brown-dim":   "#7a5539",
          "brown-light": "#c8956a",
          cream:         "#ede0cc",
          "cream-2":     "#c0aa8e",
          muted:         "#806a58",
          red:           "#c0392b",
          "red-dim":     "#3d1210",
          green:         "#6b9e6b",
        },
      },
    },
  },
  plugins: [],
};
export default config;
