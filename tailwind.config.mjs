/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx}',
    // Preline ships its interactive markup classes from here.
    './node_modules/preline/dist/*.js',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Fraunces"', 'Georgia', 'serif'],
        body: ['"Inter"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      maxWidth: {
        prose: '42rem',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-14px)' },
        },
        'gradient-pan': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.7s cubic-bezier(0.22, 1, 0.36, 1) both',
        float: 'float 9s ease-in-out infinite',
        'gradient-pan': 'gradient-pan 12s ease infinite',
      },
    },
  },
  // daisyUI supplies the theme tokens and base components; Preline supplies the
  // `hs-*` variants that drive its accessible overlay/dropdown behaviour.
  plugins: [require('daisyui'), require('preline/plugin')],
  daisyui: {
    themes: [
      {
        blog: {
          // Teal-700 rather than teal-600: white button text needs a 4.5:1
          // contrast ratio at 14px, and #0D9488 only reached 3.74:1.
          primary: '#0F766E',
          'primary-content': '#ffffff',
          secondary: '#C2410C',
          'secondary-content': '#ffffff',
          accent: '#A16207',
          'accent-content': '#ffffff',
          neutral: '#201B16',
          'neutral-content': '#F6F1E9',
          'base-100': '#FBF9F5',
          'base-200': '#F3EDE3',
          'base-300': '#E6DCCD',
          'base-content': '#221D18',
          info: '#2AA9D6',
          success: '#1FA971',
          warning: '#E0A417',
          error: '#E1543B',
          '--rounded-box': '1.25rem',
          '--rounded-btn': '0.75rem',
          '--rounded-badge': '2rem',
        },
      },
      {
        blogdark: {
          primary: '#2DD4BF',
          'primary-content': '#062723',
          secondary: '#FB8C7D',
          'secondary-content': '#2a0f0a',
          accent: '#EAB94F',
          'accent-content': '#2a1e05',
          neutral: '#F0EBE2',
          'neutral-content': '#16120E',
          'base-100': '#141110',
          'base-200': '#1D1916',
          'base-300': '#2A2420',
          'base-content': '#ECE6DC',
          info: '#56C7EC',
          success: '#43C88E',
          warning: '#EAB94F',
          error: '#F0715A',
          '--rounded-box': '1.25rem',
          '--rounded-btn': '0.75rem',
          '--rounded-badge': '2rem',
        },
      },
    ],
    darkTheme: 'blogdark',
  },
}
