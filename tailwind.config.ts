import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#12181f",
        paper: "#f7f7f5",
        accent: "#2f6f4f",
      },
    },
  },
  plugins: [],
};
export default config;
