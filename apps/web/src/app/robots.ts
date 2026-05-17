import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:5000';
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard', '/vocabulary', '/verbs', '/grammar', '/progress', '/settings'],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
