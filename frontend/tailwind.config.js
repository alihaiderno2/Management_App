/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}", // This tells Tailwind to watch all files in your src path alias
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#4f46e5',   // Indigo 600
          accent: '#06b6d4',    // Cyan 500
        },
        panel: {
          light: '#ffffff',
          dark: '#0f172a',      // Slate 900
        },
        app: {
          bgLight: '#f8fafc',   // Slate 50
          bgDark: '#020617',    // Slate 950
        }
      }
    }
  },
  plugins: [],
}