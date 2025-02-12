/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        blob: {
          '0%': {
            transform: 'translate(0px, 0px) scale(1)',
          },
          '33%': {
            transform: 'translate(30px, -50px) scale(1.1)',
          },
          '66%': {
            transform: 'translate(-20px, 20px) scale(0.9)',
          },
          '100%': {
            transform: 'tranlate(0px, 0px) scale(1)',
          },
        },
        navSlideDown: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(0)' }
        },
        navLinkFade: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        navButtonPulse: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' }
        },
        messagePulse: {
          '0%, 100%': { 
            opacity: '1',
            transform: 'scale(1)',
            borderColor: 'rgba(239, 68, 68, 0.8)'
          },
          '50%': { 
            opacity: '0.8',
            transform: 'scale(1.02)',
            borderColor: 'rgba(239, 68, 68, 0.4)'
          }
        },
        newMessageBadgePulse: {
          '0%, 100%': { 
            backgroundColor: 'rgba(254, 226, 226, 1)',
            color: 'rgba(220, 38, 38, 1)'
          },
          '50%': { 
            backgroundColor: 'rgba(254, 202, 202, 1)',
            color: 'rgba(185, 28, 28, 1)'
          }
        }
      },
      animation: {
        fadeIn: 'fadeIn 0.2s ease-out',
        slideDown: 'slideDown 0.3s ease-out',
        blob: 'blob 7s infinite',
        navSlideDown: 'navSlideDown 0.5s ease-out',
        navLinkFade: 'navLinkFade 0.5s ease-out forwards',
        navButtonPulse: 'navButtonPulse 2s infinite',
        messagePulse: 'messagePulse 2s infinite',
        newMessageBadgePulse: 'newMessageBadgePulse 2s infinite'
      }
    },
  },
  plugins: [
    require('@tailwindcss/aspect-ratio'),
    require('@tailwindcss/forms'),
  ],
} 