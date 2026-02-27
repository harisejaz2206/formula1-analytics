const withOpacity = (variable) => `rgb(var(${variable}) / <alpha-value>)`;

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'f1-red': withOpacity('--f1-red'),
        'f1-black': withOpacity('--f1-bg'),
        'f1-gray': withOpacity('--f1-surface-2'),
        'f1-silver': withOpacity('--f1-text'),
        'f1-neon': withOpacity('--f1-neon'),
        'f1-surface': withOpacity('--f1-surface'),
        'f1-surface-soft': withOpacity('--f1-surface-soft'),
        'f1-muted': withOpacity('--f1-muted'),
        'f1-text': withOpacity('--f1-text'),
      },
      backgroundImage: {
        'carbon-fiber':
          'linear-gradient(120deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0) 45%), linear-gradient(45deg, rgba(var(--f1-pattern) / 0.4) 25%, rgba(var(--f1-pattern) / 0.12) 25%, rgba(var(--f1-pattern) / 0.12) 50%, rgba(var(--f1-pattern) / 0.4) 50%, rgba(var(--f1-pattern) / 0.4) 75%, rgba(var(--f1-pattern) / 0.12) 75%, rgba(var(--f1-pattern) / 0.12) 100%)',
        'gradient-racing': 'radial-gradient(circle at 10% 0%, rgba(var(--f1-red) / 0.16) 0, transparent 40%), linear-gradient(180deg, rgb(var(--f1-bg-alt)) 0%, rgb(var(--f1-bg)) 100%)',
      },
      fontFamily: {
        f1: ['"Space Grotesk"', 'sans-serif'],
        'f1-display': ['"Rajdhani"', 'sans-serif'],
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.35s ease-out both',
        'pulse-soft': 'pulseSoft 2.4s ease-in-out infinite',
        'border-glow': 'borderGlow 2.8s ease-in-out infinite',
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(var(--f1-red) / 0.4), 0 8px 30px rgba(0, 0, 0, 0.3)',
        panel: '0 24px 64px rgba(0, 0, 0, 0.38)',
      },
      borderRadius: {
        xl2: '1.125rem',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '0.55' },
          '50%': { opacity: '1' },
        },
        borderGlow: {
          '0%, 100%': { boxShadow: '0 0 0 1px rgba(var(--f1-red) / 0.18)' },
          '50%': { boxShadow: '0 0 0 1px rgba(var(--f1-red) / 0.45)' },
        },
      },
    },
  },
  plugins: [],
};

