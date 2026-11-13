import type { Metadata } from 'next';
import Portfolio from '@/components/Portfolio';
import { DEFAULT_PROFILE } from '@/lib/defaults';
import { getPortfolio } from '@/lib/server-data';

// Siempre datos frescos: lo que cambies en el panel se ve al recargar.
export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const { profile } = await getPortfolio();
  const title = `${profile.name} — Editor de video`;
  const description = profile.tagline;
  // Para la vista previa al compartir se usa una imagen fija (las redes no animan WebP)
  const preview = profile.photoUrl === DEFAULT_PROFILE.photoUrl ? '/perfil.png' : profile.photoUrl;
  const images = preview && !/\.svg($|\?)/i.test(preview) ? [{ url: preview }] : undefined;
  return {
    title,
    description,
    openGraph: { title, description, type: 'profile', locale: 'es_CO', siteName: profile.alias, images },
    twitter: { card: images ? 'summary_large_image' : 'summary', title, description, images: images?.map((i) => i.url) },
  };
}

export default async function Home() {
  const { profile, videos } = await getPortfolio();
  return <Portfolio profile={profile} videos={videos} />;
}
