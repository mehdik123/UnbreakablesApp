/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        'sans': ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'Noto Sans', 'sans-serif'],
        'display': ['Space Grotesk', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        /* Workout design tokens — namespaced to avoid clobbering
           Tailwind's default color scales used elsewhere. */
        'wk-bg': '#08090d',
        'surface-1': '#101218',
        'surface-2': '#15171f',
        'surface-3': '#1b1e28',
        'txt-hi': '#f4f5fa',
        'txt-mid': '#9ea3b2',
        'txt-lo': '#646a7a',
        'brand-red': '#ff2d55',
        'brand-red-deep': '#e11d48',
        'brand-coral': '#ff6a55',
        'brand-emerald': '#34d399',
        'brand-emerald-deep': '#10b981',
        'brand-blue': '#5b8cff',
      },
      borderRadius: {
        /* namespaced so default rounded-lg/md/sm stay intact app-wide */
        'wk-lg': '24px',
        'wk-md': '18px',
        'wk-sm': '13px',
      },
    },
  },
  plugins: [],
};
