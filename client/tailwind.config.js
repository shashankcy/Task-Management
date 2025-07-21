module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./auth/**/*.{js,ts,jsx,tsx}", // Add this for your auth components
    "./edit/**/*.{js,ts,jsx,tsx}", // Add this for your edit components
  ],
  darkMode: "class", // Enables class-based dark mode
  theme: {
    extend: {},
  },
  plugins: [],
};
