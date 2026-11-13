import type { SupabaseClient } from '@supabase/supabase-js';
import type { Backend } from './backend';
import { fetchProfile, fetchVideos, rowToVideo } from './queries';
import type { VideoRow } from './types';
import { capturePoster, extOf, safeName, uploadWithProgress } from './upload';

export function supabaseBackend(sb: SupabaseClient): Backend {
  return {
    kind: 'supabase',

    async hasSession() {
      const { data } = await sb.auth.getSession();
      return Boolean(data.session);
    },

    async signIn(email, password) {
      const { error } = await sb.auth.signInWithPassword({ email, password });
      if (error) throw new Error(/invalid/i.test(error.message) ? 'Correo o contraseña incorrectos' : error.message);
    },

    async signOut() {
      await sb.auth.signOut();
    },

    onSignedOut(cb) {
      const { data } = sb.auth.onAuthStateChange((event) => {
        if (event === 'SIGNED_OUT') cb();
      });
      return () => data.subscription.unsubscribe();
    },

    async load() {
      const [profile, videos] = await Promise.all([fetchProfile(sb), fetchVideos(sb)]);
      return { profile, videos };
    },

    async addYouTube(i) {
      const { data, error } = await sb
        .from('videos')
        .insert({
          title: i.title,
          description: i.description,
          category: i.category,
          featured: i.featured,
          source: 'youtube',
          youtube_id: i.youtubeId,
        })
        .select()
        .single();
      if (error) throw error;
      return rowToVideo(sb, data as VideoRow);
    },

    async uploadFile(i, onProgress) {
      const { data: s } = await sb.auth.getSession();
      if (!s.session) throw new Error('Tu sesión expiró. Vuelve a entrar.');
      const base = `${Date.now()}-${safeName(i.file.name)}`;
      const path = `${base}.${extOf(i.file, 'mp4')}`;
      let posterPath: string | null = null;
      try {
        await uploadWithProgress({
          bucket: 'videos',
          path,
          file: i.file,
          contentType: i.file.type || 'video/mp4',
          accessToken: s.session.access_token,
          onProgress,
        });
        const poster = await capturePoster(i.file);
        if (poster) {
          const pp = `posters/${base}.jpg`;
          const { error } = await sb.storage
            .from('videos')
            .upload(pp, poster, { contentType: 'image/jpeg', cacheControl: '31536000' });
          if (!error) posterPath = pp;
        }
        const { data, error } = await sb
          .from('videos')
          .insert({
            title: i.title,
            description: i.description,
            category: i.category,
            featured: i.featured,
            source: 'file',
            storage_path: path,
            poster_path: posterPath,
          })
          .select()
          .single();
        if (error) throw error;
        return rowToVideo(sb, data as VideoRow);
      } catch (e) {
        await sb.storage.from('videos').remove([path, ...(posterPath ? [posterPath] : [])]);
        throw e;
      }
    },

    async setFeatured(id) {
      const { error } = await sb.rpc('set_featured_video', { video_id: id });
      if (error) throw error;
    },

    async remove(v) {
      const { error } = await sb.from('videos').delete().eq('id', v.id);
      if (error) throw error;
      const paths = [v.storagePath, v.posterPath].filter((p): p is string => Boolean(p));
      if (paths.length) await sb.storage.from('videos').remove(paths);
    },

    async uploadPhoto(file, oldUrl) {
      const path = `photo-${Date.now()}.${extOf(file, 'jpg')}`;
      const { error: upError } = await sb.storage
        .from('avatars')
        .upload(path, file, { contentType: file.type, cacheControl: '31536000' });
      if (upError) throw upError;
      const url = sb.storage.from('avatars').getPublicUrl(path).data.publicUrl;
      const { error } = await sb.from('profile').upsert({ id: 1, photo_url: url, updated_at: new Date().toISOString() });
      if (error) {
        await sb.storage.from('avatars').remove([path]);
        throw error;
      }
      const old = oldUrl?.split('/avatars/')[1];
      if (old) await sb.storage.from('avatars').remove([decodeURIComponent(old)]);
      return url;
    },

    async saveProfile(p) {
      const { error } = await sb.from('profile').upsert({
        id: 1,
        name: p.name,
        alias: p.alias,
        tagline: p.tagline,
        location: p.location,
        bio: p.bio,
        tools: p.tools,
        services: p.services,
        email: p.email,
        phone: p.phone,
        x_handle: p.x,
        discord: p.discord,
        tagline_en: p.taglineEn,
        bio_en: p.bioEn,
        services_en: p.servicesEn,
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
    },
  };
}
