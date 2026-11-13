/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      {
        quickline: {
          "primary":           "#dc2626",  // 🔴 Rouge
          "primary-content":   "#ffffff",
          "secondary":         "#ea580c",  // 🟠 Orange
          "secondary-content": "#ffffff",
          "accent":            "#16a34a",  // 🟢 Vert
          "accent-content":    "#ffffff",
          "neutral":           "#1e293b",
          "neutral-content":   "#f1f5f9",
          "base-100":          "#ffffff",
          "base-200":          "#f8fafc",
          "base-300":          "#e2e8f0",
          "base-content":      "#0f172a",
          "info":              "#0ea5e9",
          "success":           "#16a34a",
          "warning":           "#ea580c",
          "error":             "#dc2626",
          "--rounded-box":     "1rem",
          "--rounded-btn":     "0.5rem",
          "--rounded-badge":   "0.5rem",
          "--btn-text-case":   "none",
          "--border-btn":      "1px",
        },
      },
    ],
    logs: false,
  },
};
