import fs from 'node:fs'
import path from 'node:path'
import { defineConfig, type Plugin } from 'vite'

/** GitHub project pages are served under /repo-name/; set VITE_BASE in CI (see deploy workflow). */
function appBase(): string {
  const b = process.env.VITE_BASE?.trim()
  if (b == null || b === '' || b === '/') return '/'
  const trimmed = b.replace(/^\/+|\/+$/g, '')
  return `/${trimmed}/`
}

const SEO_TITLE = 'Captain of Industry — Resource Calculator'
const SEO_DESCRIPTION =
  'Free Captain of Industry (CoI) resource calculator for factory planning: production chains, base materials, dependency trees, and net material flow for the game.'

function normalizeSiteUrl(raw: string): string {
  const t = raw.trim().replace(/\/+$/, '')
  return `${t}/`
}

/** Public path for static assets under Vite `base` (leading slash, no trailing slash on base duplicate). */
function assetPublicHref(viteBase: string, filePath: string): string {
  const p = filePath.replace(/^\//, '')
  if (viteBase === '/') return `/${p}`
  const b = viteBase.replace(/\/+$/, '')
  return `${b}/${p}`
}

type HeadTag = {
  tag: string
  attrs?: Record<string, string | boolean | undefined>
  children?: string
  injectTo?: 'head'
}

function coiSeoPlugin(): Plugin {
  const siteUrlRaw = process.env.SITE_URL?.trim()
  let viteBase = '/'

  return {
    name: 'coi-seo',
    configResolved(config) {
      viteBase = config.base
    },
    transformIndexHtml(html) {
      const iconHref = assetPublicHref(viteBase, 'assets/favicon.ico')
      const tags: HeadTag[] = [
        {
          tag: 'link',
          attrs: { rel: 'icon', type: 'image/x-icon', href: iconHref },
          injectTo: 'head',
        },
        {
          tag: 'meta',
          attrs: { name: 'theme-color', content: '#1e1e1e' },
          injectTo: 'head',
        },
        {
          tag: 'meta',
          attrs: { name: 'description', content: SEO_DESCRIPTION },
          injectTo: 'head',
        },
      ]

      if (siteUrlRaw) {
        const canonical = normalizeSiteUrl(siteUrlRaw)
        const ogImage = new URL('assets/img/logo.png', canonical).href

        tags.push(
          { tag: 'link', attrs: { rel: 'canonical', href: canonical }, injectTo: 'head' },
          {
            tag: 'meta',
            attrs: { property: 'og:title', content: SEO_TITLE },
            injectTo: 'head',
          },
          {
            tag: 'meta',
            attrs: { property: 'og:description', content: SEO_DESCRIPTION },
            injectTo: 'head',
          },
          { tag: 'meta', attrs: { property: 'og:url', content: canonical }, injectTo: 'head' },
          { tag: 'meta', attrs: { property: 'og:type', content: 'website' }, injectTo: 'head' },
          {
            tag: 'meta',
            attrs: { property: 'og:site_name', content: SEO_TITLE },
            injectTo: 'head',
          },
          {
            tag: 'meta',
            attrs: { property: 'og:locale', content: 'en_US' },
            injectTo: 'head',
          },
          {
            tag: 'meta',
            attrs: { property: 'og:image', content: ogImage },
            injectTo: 'head',
          },
          {
            tag: 'meta',
            attrs: { name: 'twitter:card', content: 'summary_large_image' },
            injectTo: 'head',
          },
          {
            tag: 'meta',
            attrs: { name: 'twitter:title', content: SEO_TITLE },
            injectTo: 'head',
          },
          {
            tag: 'meta',
            attrs: { name: 'twitter:description', content: SEO_DESCRIPTION },
            injectTo: 'head',
          },
          {
            tag: 'meta',
            attrs: { name: 'twitter:image', content: ogImage },
            injectTo: 'head',
          },
        )

        const jsonLd = {
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: SEO_TITLE,
          description: SEO_DESCRIPTION,
          url: canonical,
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD',
          },
        }

        tags.push({
          tag: 'script',
          attrs: { type: 'application/ld+json' },
          children: JSON.stringify(jsonLd),
          injectTo: 'head',
        })
      }

      return { html, tags }
    },
    writeBundle(options) {
      const dir = options.dir
      if (!dir) return

      if (siteUrlRaw) {
        const canonical = normalizeSiteUrl(siteUrlRaw)
        const sitemapHref = new URL('sitemap.xml', canonical).href
        const robots = `User-agent: *\nAllow: /\nSitemap: ${sitemapHref}\n`
        fs.writeFileSync(path.join(dir, 'robots.txt'), robots, 'utf8')

        const lastmod = new Date().toISOString().slice(0, 10)
        const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${canonical}</loc>
    <lastmod>${lastmod}</lastmod>
  </url>
</urlset>
`
        fs.writeFileSync(path.join(dir, 'sitemap.xml'), sitemap, 'utf8')
      } else {
        fs.writeFileSync(
          path.join(dir, 'robots.txt'),
          'User-agent: *\nAllow: /\n',
          'utf8',
        )
      }
    },
  }
}

export default defineConfig({
  root: '.',
  base: appBase(),
  plugins: [coiSeoPlugin()],
})
