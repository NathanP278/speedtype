/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        oled: '#000000',
        terminal: {
          dark: '#030708',
          strike: '#FF3333',
          counter: '#00E5FF',
          disrupt: '#B026FF',
          amber: '#FFB000',
          lime: '#00FF66',
          magenta: '#FF007F',
          ice: '#E0F7FA',
        }
      },
      fontFamily: {
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', '"Liberation Mono"', '"Courier New"', 'monospace'],
      },
      animation: {
        'flicker': 'flicker 0.15s infinite',
        'scanline': 'scanline 8s linear infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
      },
      keyframes: {
        flicker: {
          '0%, 100%': { opacity: 0.99 },
          '50%': { opacity: 0.96 },
        },
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(1000%)' },
        },
        pulseGlow: {
          '0%, 100%': { filter: 'drop-shadow(0 0 4px var(--theme-glow))' },
          '50%': { filter: 'drop-shadow(0 0 14px var(--theme-glow))' },
        }
      }
    },
  },
  plugins: [],
}
