import { defineConfig } from 'vite'

/** GitHub project pages are served under /repo-name/; set VITE_BASE in CI (see deploy workflow). */
function appBase(): string {
  const b = process.env.VITE_BASE
  if (b == null || b === '' || b === '/') return '/'
  const trimmed = b.replace(/^\/+|\/+$/g, '')
  return `/${trimmed}/`
}

export default defineConfig({
  root: '.',
  base: appBase(),
})
