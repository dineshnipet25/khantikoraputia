import type { MetadataRoute } from 'next';
export default function sitemap(): MetadataRoute.Sitemap { const base = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, ''); return [{ url: `${base}/`, lastModified: new Date() }, { url: `${base}/privacy`, lastModified: new Date() }, { url: `${base}/terms`, lastModified: new Date() }]; }
