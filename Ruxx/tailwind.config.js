// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ["./App.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
       colors: {
        background: "var(--color-background)",
        text: "var(--color-text)",
        card: "var(--color-card)",
        border: "var(--color-border)",
        inputBackground: "var(--color-inputBackground)",
        inputText: "var(--color-inputText)",
        placeholder: "var(--color-placeholder)",
        gray: "var(--color-gray)",
        selectedBackground: "var(--color-selectedBackground)",
        selectedText: "var(--color-selectedText)",
        buttonBackground: "var(--color-buttonBackground)",
        buttonText: "var(--color-buttonText)",
        modalOverlay: "var(--color-modalOverlay)",
        label: "var(--color-label)",
        accent: "var(--color-accent)",
        danger: "var(--color-danger)",
    },
  },
  },
  darkMode: "class",
  plugins: [],
}