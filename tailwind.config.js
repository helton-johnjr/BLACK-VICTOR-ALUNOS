/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './obrigado.html', './design-system.html', './js/**/*.js'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        'surface-2': 'var(--surface-2)',
        line: 'var(--border)',
        body: 'var(--text)',
        muted: 'var(--text-muted)',
        gold: 'var(--gold)',
      },
      fontFamily: {
        sans: ['Archivo', 'Segoe UI', 'system-ui', 'sans-serif'],
      },
      maxWidth: { content: '1200px', prose: '65ch' },
      transitionTimingFunction: { out: 'cubic-bezier(0.16, 1, 0.3, 1)' },
    },
  },
  plugins: [],
};
