/** @type {import('tailwindcss').Config} */
module.exports = {
  daisyui: {
    themes: [
      {
        mytheme: {
          primary: "#2563eb",
          secondary: "#9fea62",
          accent: "#b192f4",
          neutral: "#18141F",
          "base-100": "#343248",
          "base-200": "#2E2A3C",
          info: "#92B8E8",
          success: "#178C59",
          warning: "#ECB213",
          error: "#EF2F1A",
        },
      },
    ],
  },
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx,css,md,mdx,html,json,scss}",
  ],
  darkMode: "class",
  theme: {
    extend: {},
  },
  plugins: [require("daisyui")],
};
