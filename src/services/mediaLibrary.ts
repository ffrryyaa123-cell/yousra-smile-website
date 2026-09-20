import { useEffect, useState } from 'react';
import { supabase } from './adminAccount';
import { SITE_BRAND_ASSETS } from '../config/siteBrand';

const BUCKET = 'product-videos';
const FOLDER = 'media-library';
const STATE_PATH = 'site-config/media-library-state.png';
const LOCAL_KEY = 'yousra-media-library-v3';
const EVENT_NAME = 'yousra-media-library-updated';
const PNG_SIGNATURE = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
const STATE_KEYWORD = 'YousraMediaLibrary';

export type MediaPlacement = 'none' | 'siteLogo' | 'heroBanner' | 'smartHomeBanner' | 'creatorAvatar';

export type MediaPlacement = 'none' | 'siteLogo' | 'heroBanner' | 'smartHomeBanner' | 'creatorAvatar';

export interface MediaLibraryItem {
  id: string;
  name: string;
  url: string;
  type: 'logo' | 'banner' | 'product' | 'other';
  storagePath?: string;
  placement?: MediaPlacement;
}

const safeFileName = (name: string) => {
  const ext = (name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
  const base = name
    .replace(/\.[^.]+$/, '')
    .normalize('NFKD')
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'image';
  return `${base}.${ext}`;
};

export async function uploadMediaLibraryImage(file: File): Promise<{ url: string; storagePath: string }> {
  if (!file || file.size === 0) throw new Error('ملف الصورة فارغ.');
  if (!file.type.startsWith('image/')) throw new Error('اختاري ملف صورة فقط.');
  if (file.size > 15 * 1024 * 1024) throw new Error('حجم الصورة أكبر من 15MB. اختاري صورة أصغر.');

  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session?.access_token) {
    throw new Error('انتهت جلسة الدخول. سجّلي الدخول إلى لوحة التحكم ثم أعيدي المحاولة.');
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const storagePath = `${FOLDER}/${stamp}-${safeFileName(file.name)}`;
  const { error } = await supabase.storage.from(BUCKET).upload(storagePath, file, {
    contentType: file.type || 'image/jpeg',
    cacheControl: '31536000',
    upsert: false,
  });
  if (error) throw new Error(`تعذر رفع الصورة: ${error.message}`);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
  return { url: data.publicUrl, storagePath };
}

export async function deleteMediaLibraryImage(storagePath?: string): Promise<void> {
  if (!storagePath) return;
  const { error } = await supabase.storage.from(BUCKET).remove([storagePath]);
  if (error) throw new Error(`تعذر حذف ملف الصورة: ${error.message}`);
}
