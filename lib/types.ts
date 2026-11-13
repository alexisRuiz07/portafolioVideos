export type Category = 'reels' | 'youtube';

export type Profile = {
  name: string;
  alias: string;
  tagline: string;
  location: string;
  bio: string;
  /** Programas separados por coma */
  tools: string;
  services: string[];
  email: string;
  phone: string;
  x: string;
  discord: string;
  photoUrl: string | null;
};

export type VideoSource = 'file' | 'youtube';

export type Video = {
  id: string;
  title: string;
  description: string;
  category: Category;
  featured: boolean;
  source: VideoSource;
  youtubeId: string | null;
  storagePath: string | null;
  posterPath: string | null;
  /** Archivo: URL pública del video. YouTube: enlace a youtube.com */
  url: string;
  posterUrl: string | null;
  createdAt: string;
};

export type ProfileRow = {
  id: number;
  name: string | null;
  alias: string | null;
  tagline: string | null;
  location: string | null;
  bio: string | null;
  tools: string | null;
  services: string[] | null;
  email: string | null;
  phone: string | null;
  x_handle: string | null;
  discord: string | null;
  photo_url: string | null;
};

export type VideoRow = {
  id: string;
  title: string;
  description: string | null;
  category: Category;
  featured: boolean;
  source: VideoSource | null;
  youtube_id: string | null;
  storage_path: string | null;
  poster_path: string | null;
  sort_order: number;
  created_at: string;
};
