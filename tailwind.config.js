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
          0: '#F9F9F7',   // Light linen warm parchment matching svg-scroll-draw
          1: '#FFFFFF',   // Pure crisp white card surfaces
          2: '#F2F2EE',   // Subtle ash / elevated pill badge background
          3: '#FFF0FB',   // Active / hover creator-pink tint
        },
        creator: {
          pink: '#FF90E8',      // Bubblegum / neon pink highlight from svg-scroll-draw
          pinkHover: '#FF70E0',
          dark: '#E85BB5',
        },
        sunshine: {
          yellow: '#FFC700',    // Sunshine yellow from svg-scroll-draw
          yellowHover: '#E5B300',
        },
        lime: {
          glow: '#70FF00',      // Electric neon lime dot
          acid: '#D4FF00',
        },
        pitch: {
          black: '#0D0D0D',     // Pitch jet black for text & crisp borders
        },
        border: {
          DEFAULT: '#0D0D0D',   // Crisp solid 1px neo-brutalist border
          subtle: '#E2E2DC',    // Subtle divider
          active: '#0D0D0D',
          accent: '#FF90E8',
        },
        accent: {
          cyan: '#0D0D0D',      // Bold pitch black action buttons
          amber: '#FFC700',     // Sunshine yellow
          red: '#EF4444',       // Crimson alert
          green: '#10B981',     // Emerald
          purple: '#A855F7',    // Vibrant violet
          pink: '#FF90E8',      // Signature creator pink
        },
        ink: {
          900: '#0D0D0D',       // Jet pitch black
          700: '#2A2A28',       // Dark graphite
          500: '#686864',       // Subtle ash
          400: '#9E9E98',       // Muted
        }
      },
      fontFamily: {
        display: ['"Syne"', 'sans-serif'],
        serif: ['"Syne"', 'sans-serif'],
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        mono: ['"Space Mono"', 'monospace'],
      },
      boxShadow: {
        'pop': '2px 2px 0px #0D0D0D',
        'pop-md': '3px 3px 0px #0D0D0D',
        'pop-lg': '4px 4px 0px #0D0D0D',
        'pop-pink': '3px 3px 0px #FF90E8',
        'pop-yellow': '3px 3px 0px #FFC700',
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '0.95rem' }],
      },
    },
  },
  plugins: [],
}
