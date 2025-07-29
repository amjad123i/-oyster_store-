/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#14532d',
        'primary-hover': '#166534',
        secondary: '#f0fdf4',
        'secondary-hover': '#dcfce7',
        accent: '#22c55e',
        'accent-hover': '#16a34a',
        
        'text-primary': '#1f2937', // gray-800
        'text-secondary': '#4b5563', // gray-600
        
        background: '#f9fafb', // gray-50
        surface: '#ffffff', // white
        
        success: '#16a34a', // green-600
        warning: '#f97316', // orange-500
        danger: '#dc2626', // red-600
        'danger-hover': '#b91c1c', // red-700
      },
      fontFamily: {
        sans: ['Tajawal', 'sans-serif'],
      },
      boxShadow: {
        'subtle': '0 2px 8px rgba(0, 0, 0, 0.04)',
        'medium': '0 4px 16px rgba(0, 0, 0, 0.08)',
      },
      borderRadius: {
        'xl': '1rem',
      }
    },
  },
  plugins: [],
}
