import { supabase } from '../lib/supabase';

export async function createGameAssetsBucket() {
  try {
    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/setup-storage`;

    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return { success: false, error: 'Not authenticated' };
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();
    return result;
  } catch (err) {
    console.error('Unexpected error:', err);
    return { success: false, error: String(err) };
  }
}

export async function uploadAsset(file: File, path: string) {
  try {
    const { data, error } = await supabase.storage
      .from('game-assets')
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Error uploading file:', error);
      return { success: false, error: error.message };
    }

    const { data: urlData } = supabase.storage
      .from('game-assets')
      .getPublicUrl(path);

    return { success: true, data, publicUrl: urlData.publicUrl };
  } catch (err) {
    console.error('Unexpected error:', err);
    return { success: false, error: String(err) };
  }
}

export async function deleteAsset(path: string) {
  try {
    const { data, error } = await supabase.storage
      .from('game-assets')
      .remove([path]);

    if (error) {
      console.error('Error deleting file:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err) {
    console.error('Unexpected error:', err);
    return { success: false, error: String(err) };
  }
}

export async function listAssets(folder: string = '') {
  try {
    const { data, error } = await supabase.storage
      .from('game-assets')
      .list(folder, {
        limit: 100,
        offset: 0,
        sortBy: { column: 'name', order: 'asc' }
      });

    if (error) {
      console.error('Error listing files:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err) {
    console.error('Unexpected error:', err);
    return { success: false, error: String(err) };
  }
}

export function getAssetUrl(path: string) {
  const { data } = supabase.storage
    .from('game-assets')
    .getPublicUrl(path);

  return data.publicUrl;
}

export const ASSET_FOLDERS = {
  ICONS: 'icons',
  BACKGROUNDS: 'backgrounds',
  ISLANDS: 'islands',
  THEMES: 'themes',
  AVATARS: 'avatars',
  VIDEOS: 'videos'
} as const;
