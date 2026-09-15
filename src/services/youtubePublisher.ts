type GoogleTokenResponse = {
  access_token?: string;
  error?: string;
  error_description?: string;
};

declare global {
  interface Window {
    google?: {
      accounts?: {
        oauth2?: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: GoogleTokenResponse) => void;
          }) => { requestAccessToken: (options?: { prompt?: string }) => void };
        };
      };
    };
  }
}

let gisPromise: Promise<void> | null = null;

const loadGoogleIdentityServices = (): Promise<void> => {
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  if (gisPromise) return gisPromise;
  gisPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-yousra-gis="true"]');
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('تعذر تحميل خدمة تسجيل الدخول من Google.')), { once: true });
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.dataset.yousraGis = 'true';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('تعذر تحميل خدمة تسجيل الدخول من Google.'));
    document.head.appendChild(script);
  });
  return gisPromise;
};

const requestYouTubeAccessToken = async (clientId: string): Promise<string> => {
  await loadGoogleIdentityServices();
  const oauth2 = window.google?.accounts?.oauth2;
  if (!oauth2) throw new Error('خدمة Google OAuth غير متاحة حالياً.');

  return new Promise((resolve, reject) => {
    const tokenClient = oauth2.initTokenClient({
      client_id: clientId,
      scope: 'https://www.googleapis.com/auth/youtube.upload',
      callback: response => {
        if (response.access_token) resolve(response.access_token);
        else reject(new Error(response.error_description || response.error || 'لم تتم الموافقة على ربط YouTube.'));
      },
    });
    tokenClient.requestAccessToken({ prompt: 'consent' });
  });
};

const resolveVideoUrl = (videoUrl: string): string => {
  if (!videoUrl) throw new Error('هذا الفيديو لا يحتوي رابط ملف يمكن رفعه إلى YouTube.');
  const resolved = new URL(videoUrl, window.location.origin).toString();
  if (/youtube\.com\/watch|youtu\.be\//i.test(resolved)) {
    throw new Error('هذا السجل يشير إلى فيديو موجود أصلاً على YouTube، وليس ملف فيديو من الموقع لإعادة رفعه.');
  }
  return resolved;
};

export interface YouTubePublishInput {
  clientId: string;
  videoUrl: string;
  title: string;
  description: string;
  tags?: string[];
  privacyStatus?: 'public' | 'unlisted' | 'private';
  onProgress?: (message: string) => void;
}

export interface YouTubePublishResult {
  id: string;
  url: string;
}

export async function publishVideoToYouTube(input: YouTubePublishInput): Promise<YouTubePublishResult> {
  const clientId = input.clientId.trim();
  if (!clientId) throw new Error('أضيفي YouTube OAuth Client ID في الإعدادات العامة أولاً.');

  const videoUrl = resolveVideoUrl(input.videoUrl);
  input.onProgress?.('جاري ربط حساب YouTube...');
  const accessToken = await requestYouTubeAccessToken(clientId);

  input.onProgress?.('جاري جلب ملف الفيديو من Yousra Smile...');
  const videoResponse = await fetch(videoUrl, { mode: 'cors' });
  if (!videoResponse.ok) throw new Error(`تعذر قراءة ملف الفيديو من الموقع (${videoResponse.status}).`);
  const videoBlob = await videoResponse.blob();
  if (!videoBlob.size) throw new Error('ملف الفيديو فارغ أو غير متاح.');

  const contentType = videoBlob.type || 'video/mp4';
  const metadata = {
    snippet: {
      title: (input.title || 'Yousra Smile Review').slice(0, 100),
      description: (input.description || '').slice(0, 5000),
      tags: (input.tags || []).map(tag => tag.replace(/^#/, '')).filter(Boolean).slice(0, 25),
      categoryId: '26',
    },
    status: {
      privacyStatus: input.privacyStatus || 'public',
      selfDeclaredMadeForKids: false,
    },
  };

  input.onProgress?.('جاري إنشاء جلسة رفع الفيديو على YouTube...');
  const initResponse = await fetch('https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json; charset=UTF-8',
      'X-Upload-Content-Length': String(videoBlob.size),
      'X-Upload-Content-Type': contentType,
    },
    body: JSON.stringify(metadata),
  });

  if (!initResponse.ok) {
    const detail = await initResponse.text().catch(() => '');
    throw new Error(`YouTube رفض بدء الرفع (${initResponse.status}). ${detail.slice(0, 240)}`);
  }

  const uploadUrl = initResponse.headers.get('Location');
  if (!uploadUrl) throw new Error('YouTube لم يُرجع رابط جلسة الرفع.');

  input.onProgress?.('جاري رفع الفيديو مباشرة إلى قناتك...');
  const uploadResponse = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': contentType },
    body: videoBlob,
  });

  if (!uploadResponse.ok) {
    const detail = await uploadResponse.text().catch(() => '');
    throw new Error(`فشل رفع الفيديو إلى YouTube (${uploadResponse.status}). ${detail.slice(0, 240)}`);
  }

  const result = await uploadResponse.json();
  if (!result?.id) throw new Error('تم الرفع لكن YouTube لم يُرجع معرّف الفيديو.');
  return { id: String(result.id), url: `https://www.youtube.com/watch?v=${result.id}` };
}
