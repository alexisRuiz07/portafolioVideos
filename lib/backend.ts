import type { Category, Profile, Video } from './types';

export type ProfileInput = Omit<Profile, 'photoUrl'>;

export type NewVideoBase = { title: string; description: string; category: Category; featured: boolean };

/** Lo que el panel necesita del "servidor". Hay dos versiones: Supabase y local (navegador). */
export interface Backend {
  kind: 'supabase' | 'local';
  hasSession(): Promise<boolean>;
  signIn(email: string, password: string): Promise<void>;
  signOut(): Promise<void>;
  onSignedOut(cb: () => void): () => void;
  load(): Promise<{ profile: Profile; videos: Video[] }>;
  addYouTube(input: NewVideoBase & { youtubeId: string }): Promise<Video>;
  uploadFile(input: NewVideoBase & { file: File }, onProgress: (f: number) => void): Promise<Video>;
  setFeatured(id: string): Promise<void>;
  remove(video: Video): Promise<void>;
  /** Devuelve la URL de la foto nueva */
  uploadPhoto(file: File, oldUrl: string | null): Promise<string>;
  saveProfile(p: ProfileInput): Promise<void>;
}

export function sortVideos<T extends { sortOrder: number; createdAt: string }>(list: T[]) {
  return [...list].sort((a, b) => a.sortOrder - b.sortOrder || b.createdAt.localeCompare(a.createdAt));
}
