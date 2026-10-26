/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          0: '#FAF8F5',   // Warm ivory / cream background matching editorial reference
          1: '#FFFFFF',   // Pure white card surfaces
          2: '#F4F1EA',   // Elevated subtle cream / stone badge background
          3: '#EEF2FF',   // Active / hover royal indigo tint
        },
        border: {
          DEFAULT: '#E7E5E4', // Subtle stone border
          active: '#D6D3D1',  // Slightly darker border for active/hover
          accent: 'rgba(79, 70, 229, 0.25)', // Royal indigo border
        },
        accent: {
          cyan: '#4F46E5',    // Royal Indigo / Violet matching the "Search" button in screenshot
          amber: '#D97706',   // Terracotta / Burnt Orange
          red: '#DC2626',     // Crimson
          green: '#059669',   // Forest Emerald
          purple: '#7C3AED',  // Royal Violet
        },
        ink: {
          900: '#0F172A',     // Deep midnight ink text matching "Beautifully Crafted Thoughts"
          700: '#334155',     // Slate text
          500: '#64748B',     // Muted subtitle text matching "Essays — ideas — and quiet reflections..."
          400: '#94A3B8',     // Subtle placeholder / border
        }
      },
      fontFamily: {
        serif: ['"Playfair Display"', '"Instrument Serif"', '"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['"Playfair Display"', '"Instrument Serif"', '"Cormorant Garamond"', 'Georgia', 'serif'],
        mono: ['"Playfair Display"', 'Georgia', 'serif'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '0.95rem' }],
      },
    },
  },
  plugins: [],
}
