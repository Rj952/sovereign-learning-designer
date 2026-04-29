import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Jamaican-inspired palette, accessibility-tuned
        jamGreen: {
          DEFAULT: "#006B3C", // Deep flag green — WCAG AA on cream
          dark: "#004F2D",
          mid: "#00874A",
          light: "#E6F2EC",
        },
        jamGold: {
          DEFAULT: "#FED100", // Flag gold — used as accent only
          deep: "#C99A00", // Accessible gold for text on cream
          light: "#FFF6CC",
        },
        jamBlack: {
          DEFAULT: "#1A1A1A",
          soft: "#3A3A3A",
        },
        cream: {
          DEFAULT: "#FFFBEF",
          warm: "#FFF6DA",
          deep: "#F4ECCB",
        },
      },
      fontFamily: {
        serif: ["Fraunces", "Georgia", "serif"],
        sans: ["'Public Sans'", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 2px 0 0 rgba(0, 79, 45, 0.18)",
        focus: "0 0 0 3px rgba(254, 209, 0, 0.6)",
      },
    },
  },
  plugins: [],
};

export default config;
