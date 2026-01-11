/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0f172a",
        card: "#1e293b",
        accent: "#38bdf8",
        muted: "#cbd5e1",
        text: "#e2e8f0",
        success: "#34d399",
        failure: "#f87171",
      },
      fontFamily: {
        display: ["Space Grotesk", "Segoe UI", "sans-serif"],
      },
    },
  },
  plugins: [],
};
