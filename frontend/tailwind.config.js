/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class', '[data-theme="dark"]'],
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg:       'var(--c-bg)',
        'bg-2':   'var(--c-bg-2)',
        'bg-3':   'var(--c-bg-3)',
        surface:  'var(--c-surface)',
        border:   'var(--c-border)',
        text:     'var(--c-text)',
        'text-dim':   'var(--c-text-dim)',
        'text-faint': 'var(--c-text-faint)',
        water: {
          DEFAULT: 'var(--c-water)',
          light:   'var(--c-water-light)',
          dark:    'var(--c-water-dark)',
          glow:    'var(--c-water-glow)',
        },
        sand: {
          DEFAULT: 'var(--c-sand)',
          light:   'var(--c-sand-light)',
        },
        type: {
          river:   'var(--c-type-river)',
          lake:    'var(--c-type-lake)',
          cave:    'var(--c-type-cave)',
          portage: 'var(--c-type-portage)',
        },
        success: 'var(--c-success)',
        warning: 'var(--c-warning)',
        danger:  'var(--c-danger)',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        sm: '8px',
        DEFAULT: '12px',
        lg: '20px',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        glow: 'var(--shadow-glow)',
      },
    },
  },
  plugins: [],
};
