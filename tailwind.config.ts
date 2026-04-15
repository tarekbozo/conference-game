import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './hooks/**/*.{js,ts,jsx,tsx,mdx}',
    './store/**/*.{js,ts,jsx,tsx,mdx}',
    './data/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      animation: {
        'glow-pulse': 'glowPulse 1.8s ease-in-out infinite',
      },
      keyframes: {
        glowPulse: {
          '0%, 100%': {
            boxShadow: '0 0 10px #f59e0b, 0 0 20px #f59e0b40',
          },
          '50%': {
            boxShadow: '0 0 25px #f59e0b, 0 0 50px #f59e0b60, 0 0 70px #f59e0b30',
          },
        },
      },
    },
  },
  plugins: [],
};

export default config;
