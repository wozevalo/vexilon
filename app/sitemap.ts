import { MetadataRoute } from 'next';
import { getAllEvents } from '@/lib/eventsStore';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://vexilon-esport.fr';

// Le plan du site est régénéré à chaque requête pour inclure les nouveaux événements
export const dynamic = 'force-dynamic';

export default function sitemap(): MetadataRoute.Sitemap {
  // Une entrée par fiche événement
  const eventPages: MetadataRoute.Sitemap = getAllEvents().map((event) => ({
    url: `${siteUrl}/evenements/${event.slug}`,
    lastModified: new Date(event.updatedAt || event.startDate),
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  return [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${siteUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${siteUrl}/evenements`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${siteUrl}/membres`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${siteUrl}/mentions-legales`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${siteUrl}/confidentialite`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    ...eventPages,
  ];
}
