/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        editor: {
          bg: '#FAF9F5',
          workspace: '#F7F6F2',
          panel: '#FFFFFF',
          text: '#171717',
          muted: '#6B6B66',
          border: '#E8E5DD',
          separator: '#F0EEE8',
          subtle: '#F4F2EC',
        },
        accent: {
          yellow: '#F6C344',
          strong: '#F2B705',
          soft: '#FFF5D6',
          hover: '#E9B332',
          border: '#E5A800',
        },
        brand: {
          50: '#fffbeb',
          100: '#fef3c7',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
        },
        surface: {
          base: '#FAF9F5',
          panel: '#FFFFFF',
          card: '#FFFFFF',
          border: '#E8E5DD',
          borderHover: '#D4D0C8',
          muted: '#6B6B66',
          accent: '#F6C344',
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'subtle': '0 1px 2px 0 rgba(0, 0, 0, 0.04)',
        'panel': '0 2px 8px -2px rgba(0, 0, 0, 0.06)',
        'card': '0 4px 16px -4px rgba(0, 0, 0, 0.06)',
      }
    },
  },
  plugins: [],
}
