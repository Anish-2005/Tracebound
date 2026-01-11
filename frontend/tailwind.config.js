/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ledger: {
          bg: "#0E1116",
          surface: "#141925",
          text: "#E6EAF0",
          muted: "#9AA4B2",
          accent: "#7FD1AE",
          warn: "#E06C75",
          line: "#1C2230",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        plex: ["IBM Plex Sans", "Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "SFMono-Regular", "monospace"],
      },
    },
  },
  plugins: [],
};
