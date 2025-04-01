/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",  
    "./app/**/*.{js,ts,jsx,tsx}",  
    "./components/**/*.{js,ts,jsx,tsx}",  
    "./styles/**/*.css" // Ensure styles are scanned
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
