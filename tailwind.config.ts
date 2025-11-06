import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#e6f7f7",
          100: "#9de1e0",
          200: "#52c7c4",
          300: "#19b3ab",
          400: "#009a92"
        },
        muted: "#B0B0B0"
      },
      fontFamily: {
        sans: ["'Inter var'", "Inter", "system-ui", "sans-serif"]
      },
      boxShadow: {
        panel: "0 20px 45px rgba(0,0,0,0.2)",
      }
    }
  },
  plugins: []
};

export default config;
