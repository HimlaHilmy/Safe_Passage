/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // UI Reference Color Palette
        palette: {
          primary: '#0B3D2E',        // Deep Emerald Forest Navy
          'primary-dark': '#06241B',
          'primary-light': '#134E3C',
          secondary: '#16A085',      // Vibrant Brand Teal/Emerald
          'secondary-dark': '#0E7A64',
          'secondary-light': '#2ECC71',
          bg: '#F3F8F6',             // Light Mint Canvas Tint
          surface: '#FFFFFF',
          text: '#1F2937',           // Slate Charcoal
          muted: '#6B7280',          // Neutral Gray
          border: '#E5E7EB',
        },
        brand: {
          navy: '#0B3D2E',           // Updated to match the reference deep primary
          'navy-light': '#144636',
          teal: '#16A085',           // Updated to match reference secondary
          'teal-dark': '#0E7A64',
          'teal-light': '#2DD4BF',
          bg: '#F3F8F6',
          surface: '#FFFFFF',
          text: '#1F2937',
          muted: '#6B7280',
          border: '#E5E7EB',
        },
        emergency: {
          red: '#EF4444',
          'red-dark': '#DC2626',
          'red-light': '#FEE2E2',
        },
        warning: {
          amber: '#F59E0B',
          'amber-light': '#FEF3C7',
        },
        success: {
          green: '#16A085',
          'green-light': '#E8F8F5',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Manrope', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 4px 20px -2px rgba(11, 61, 46, 0.05), 0 2px 6px -1px rgba(11, 61, 46, 0.03)',
        'card-hover': '0 12px 32px -4px rgba(11, 61, 46, 0.12), 0 4px 12px -2px rgba(11, 61, 46, 0.06)',
        'glow-teal': '0 0 25px rgba(22, 160, 133, 0.25)',
        'glow-red': '0 0 25px rgba(239, 68, 68, 0.25)',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.25rem',
        '3xl': '1.5rem',
      }
    },
  },
  plugins: [],
}
