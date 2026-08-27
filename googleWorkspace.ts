import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  browserLocalPersistence,
  setPersistence,
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut,
  User 
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App safely (singleton)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

// Complete Google Workspace Provider configured with requested scopes
export const provider = new GoogleAuthProvider();
const ownerProvider = new GoogleAuthProvider();
ownerProvider.setCustomParameters({ prompt: 'select_account' });

export const WORKSPACE_SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/spreadsheets.readonly',
  'https://www.googleapis.com/auth/classroom.courses',
  'https://www.googleapis.com/auth/classroom.courses.readonly',
  'https://www.googleapis.com/auth/classroom.announcements',
  'https://www.googleapis.com/auth/classroom.coursework.me',
  'https://www.googleapis.com/auth/classroom.courseworkmaterials',
  'https://www.googleapis.com/auth/classroom.rosters',
  'https://www.googleapis.com/auth/classroom.topics',
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar.readonly'
];

WORKSPACE_SCOPES.forEach(scope => provider.addScope(scope));

// In-Memory Token Cache (never in localStorage to respect security directives)
let cachedAccessToken: string | null = null;
let isSigningIn = false;

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('فشل الحصول على رمز الدخول من Firebase Auth');
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Google Workspace Sign-in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

// Human readable Arabic messages for the Firebase Auth error codes that actually
// surface on a custom domain. Silent failures were the reason the owner could no
// longer reach the dashboard, so every failure path now says exactly what to fix.
export const describeAuthError = (error: any): string => {
  const code = String(error?.code || '');
  switch (code) {
    case 'auth/unauthorized-domain':
      return 'نطاق الموقع غير مُصرَّح به في Firebase Authentication. أضيفي yousrasmile.com و www.yousrasmile.com إلى Authorized domains ثم أعيدي المحاولة.';
    case 'auth/popup-blocked':
      return 'المتصفح منع النافذة المنبثقة. اسمحي بالنوافذ المنبثقة لهذا الموقع أو أعيدي المحاولة.';
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return 'تم إغلاق نافذة تسجيل الدخول قبل إتمامها. أعيدي المحاولة.';
    case 'auth/operation-not-allowed':
      return 'مزوّد الدخول بحساب Google غير مُفعَّل في Firebase Authentication. فعّليه من Sign-in method.';
    case 'auth/network-request-failed':
      return 'تعذر الاتصال بخوادم Firebase. تحققي من الاتصال بالإنترنت وأعيدي المحاولة.';
    default:
      return error?.message || 'تعذر تسجيل الدخول بحساب Google.';
  }
};

const POPUP_FALLBACK_CODES = new Set([
  'auth/popup-blocked',
  'auth/cancelled-popup-request',
  'auth/operation-not-supported-in-this-environment',
  'auth/web-storage-unsupported'
]);

// Lightweight owner login. It deliberately avoids Drive/Sheets/Calendar scopes,
// so opening the private admin area does not trigger a large permissions prompt.
//
// A popup is used as the primary flow: signInWithRedirect no longer completes on a
// custom domain (yousrasmile.com) whose Firebase authDomain lives on
// *.firebaseapp.com, because browsers now partition third-party storage and the
// session is lost on the way back. The redirect flow is kept only as a fallback for
// browsers that block popups outright.
export const ownerGoogleSignIn = async (): Promise<User | null> => {
  await setPersistence(auth, browserLocalPersistence).catch(() => undefined);
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, ownerProvider);
    return result.user;
  } catch (error: any) {
    if (POPUP_FALLBACK_CODES.has(String(error?.code))) {
      await signInWithRedirect(auth, ownerProvider);
      return null;
    }
    throw error;
  } finally {
    isSigningIn = false;
  }
};

// Completes a redirect based sign-in when the browser had to fall back to it.
// Returns the signed-in user, or null when there is no pending redirect.
export const consumeOwnerRedirectResult = async (): Promise<User | null> => {
  try {
    const result = await getRedirectResult(auth);
    return result?.user ?? null;
  } catch (error) {
    console.error('Owner redirect sign-in error:', error);
    return null;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const setAccessTokenInMemory = (token: string | null) => {
  cachedAccessToken = token;
};

export const logoutGoogle = async () => {
  await signOut(auth);
  cachedAccessToken = null;
};

// =========================================================================
// GOOGLE DRIVE API V3
// =========================================================================
export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  iconLink?: string;
  webViewLink?: string;
  thumbnailLink?: string;
  size?: string;
  createdTime?: string;
  modifiedTime?: string;
}

export const driveService = {
  async listFiles(query: string = ""): Promise<DriveFile[]> {
    const token = await getAccessToken();
    if (!token) throw new Error('يرجى تسجيل الدخول بحساب Google أولاً');

    let q = "trashed = false";
    if (query) {
      q += ` and name contains '${query.replace(/'/g, "\\'")}'`;
    }

    const params = new URLSearchParams({
      q,
      fields: 'files(id, name, mimeType, iconLink, webViewLink, thumbnailLink, size, createdTime, modifiedTime)',
      pageSize: '30',
      orderBy: 'modifiedTime desc'
    });

    const res = await fetch(`https://www.googleapis.com/drive/v3/files?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'فشل جلب ملفات Google Drive');
    }

    const data = await res.json();
    return data.files || [];
  },

  async createFolder(folderName: string): Promise<DriveFile> {
    const token = await getAccessToken();
    if (!token) throw new Error('يرجى تسجيل الدخول بحساب Google أولاً');

    const metadata = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder'
    };

    const res = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(metadata)
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'فشل إنشاء المجلد في Google Drive');
    }

    return await res.json();
  },

  async uploadTextFile(fileName: string, content: string, mimeType: string = 'text/plain'): Promise<DriveFile> {
    const token = await getAccessToken();
    if (!token) throw new Error('يرجى تسجيل الدخول بحساب Google أولاً');

    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const metadata = {
      name: fileName,
      mimeType: mimeType
    };

    const multipartRequestBody =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      `Content-Type: ${mimeType}\r\n\r\n` +
      content +
      closeDelimiter;

    const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`
      },
      body: multipartRequestBody
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'فشل رفع الملف إلى Google Drive');
    }

    return await res.json();
  },

  async deleteFile(fileId: string): Promise<boolean> {
    const token = await getAccessToken();
    if (!token) throw new Error('يرجى تسجيل الدخول بحساب Google أولاً');

    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok && res.status !== 204) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'فشل حذف الملف من Google Drive');
    }

    return true;
  }
};

// =========================================================================
// GOOGLE SHEETS API V4
// =========================================================================
export interface SpreadsheetInfo {
  spreadsheetId: string;
  properties: {
    title: string;
  };
  spreadsheetUrl: string;
}

export const sheetsService = {
  async createCatalogSpreadsheet(title: string, products: any[]): Promise<SpreadsheetInfo> {
    const token = await getAccessToken();
    if (!token) throw new Error('يرجى تسجيل الدخول بحساب Google أولاً');

    const resource = {
      properties: {
        title: title || 'قاعدة بيانات منتجات وعروض يسرى سمايل — Google Sheets'
      },
      sheets: [
        {
          properties: {
            title: 'المنتجات والأفلييت',
            gridProperties: {
              frozenRowCount: 1
            }
          },
          data: [
            {
              startRow: 0,
              startColumn: 0,
              rowData: [
                {
                  values: [
                    { userEnteredValue: { stringValue: 'معرف المنتج' } },
                    { userEnteredValue: { stringValue: 'اسم المنتج (عربي)' } },
                    { userEnteredValue: { stringValue: 'Product Name (EN)' } },
                    { userEnteredValue: { stringValue: 'التصنيف' } },
                    { userEnteredValue: { stringValue: 'الماركة' } },
                    { userEnteredValue: { stringValue: 'السعر الحالي (SAR)' } },
                    { userEnteredValue: { stringValue: 'السعر الأصلي (SAR)' } },
                    { userEnteredValue: { stringValue: 'نسبة الخصم' } },
                    { userEnteredValue: { stringValue: 'التقييم' } },
                    { userEnteredValue: { stringValue: 'عدد المراجعات' } },
                    { userEnteredValue: { stringValue: 'رابط الأفلييت المباشر' } },
                    { userEnteredValue: { stringValue: 'المتجر التابع' } },
                    { userEnteredValue: { stringValue: 'تاريخ آخر تحديث' } }
                  ]
                },
                ...products.map(p => ({
                  values: [
                    { userEnteredValue: { stringValue: String(p.id) } },
                    { userEnteredValue: { stringValue: p.titleAr || '' } },
                    { userEnteredValue: { stringValue: p.titleEn || '' } },
                    { userEnteredValue: { stringValue: p.category || '' } },
                    { userEnteredValue: { stringValue: p.brand || '' } },
                    { userEnteredValue: { numberValue: Number(p.price) || 0 } },
                    { userEnteredValue: { numberValue: Number(p.originalPrice) || 0 } },
                    { userEnteredValue: { stringValue: p.discount ? `${p.discount}%` : '0%' } },
                    { userEnteredValue: { numberValue: Number(p.rating) || 5.0 } },
                    { userEnteredValue: { numberValue: Number(p.reviewCount) || 0 } },
                    { userEnteredValue: { stringValue: p.affiliateUrl || '' } },
                    { userEnteredValue: { stringValue: p.merchant || 'Amazon / Noon' } },
                    { userEnteredValue: { stringValue: new Date().toISOString() } }
                  ]
                }))
              ]
            }
          ]
        }
      ]
    };

    const res = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(resource)
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'فشل إنشاء جدول Google Sheets');
    }

    return await res.json();
  },

  async appendProductRow(spreadsheetId: string, range: string, rowValues: (string | number)[]): Promise<any> {
    const token = await getAccessToken();
    if (!token) throw new Error('يرجى تسجيل الدخول بحساب Google أولاً');

    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          values: [rowValues]
        })
      }
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'فشل إضافة الصف إلى Google Sheets');
    }

    return await res.json();
  },

  async getSheetValues(spreadsheetId: string, range: string): Promise<string[][]> {
    const token = await getAccessToken();
    if (!token) throw new Error('يرجى تسجيل الدخول بحساب Google أولاً');

    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'فشل قراءة بيانات Google Sheets');
    }

    const data = await res.json();
    return data.values || [];
  }
};

// =========================================================================
// GOOGLE CLASSROOM API V1
// =========================================================================
export interface ClassroomCourse {
  id: string;
  name: string;
  section?: string;
  descriptionHeading?: string;
  description?: string;
  room?: string;
  ownerId?: string;
  courseState?: string;
  alternateLink?: string;
}

export interface ClassroomAnnouncement {
  id: string;
  courseId: string;
  text: string;
  alternateLink?: string;
  creationTime?: string;
  updateTime?: string;
  state?: string;
}

export const classroomService = {
  async listCourses(): Promise<ClassroomCourse[]> {
    const token = await getAccessToken();
    if (!token) throw new Error('يرجى تسجيل الدخول بحساب Google أولاً');

    const res = await fetch('https://classroom.googleapis.com/v1/courses?courseStates=ACTIVE', {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'فشل جلب فصول Google Classroom');
    }

    const data = await res.json();
    return data.courses || [];
  },

  async listAnnouncements(courseId: string): Promise<ClassroomAnnouncement[]> {
    const token = await getAccessToken();
    if (!token) throw new Error('يرجى تسجيل الدخول بحساب Google أولاً');

    const res = await fetch(`https://classroom.googleapis.com/v1/courses/${courseId}/announcements`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'فشل جلب إعلانات الفصل');
    }

    const data = await res.json();
    return data.announcements || [];
  },

  async postAnnouncement(courseId: string, text: string, materials?: any[]): Promise<ClassroomAnnouncement> {
    const token = await getAccessToken();
    if (!token) throw new Error('يرجى تسجيل الدخول بحساب Google أولاً');

    const body: any = {
      text,
      state: 'PUBLISHED'
    };

    if (materials && materials.length > 0) {
      body.materials = materials;
    }

    const res = await fetch(`https://classroom.googleapis.com/v1/courses/${courseId}/announcements`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'فشل نشر الإعلان في Google Classroom');
    }

    return await res.json();
  }
};

// =========================================================================
// GOOGLE CALENDAR API V3
// =========================================================================
export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  htmlLink?: string;
  start: {
    dateTime?: string;
    date?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
  };
  colorId?: string;
}

export const calendarService = {
  async listEvents(): Promise<CalendarEvent[]> {
    const token = await getAccessToken();
    if (!token) throw new Error('يرجى تسجيل الدخول بحساب Google أولاً');

    const now = new Date();
    const pastMonth = new Date();
    pastMonth.setDate(now.getDate() - 30);

    const params = new URLSearchParams({
      timeMin: pastMonth.toISOString(),
      maxResults: '50',
      singleEvents: 'true',
      orderBy: 'startTime'
    });

    const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'فشل جلب فعاليات Google Calendar');
    }

    const data = await res.json();
    return data.items || [];
  },

  async createEvent(event: {
    summary: string;
    description?: string;
    location?: string;
    startDateTime: string;
    endDateTime: string;
  }): Promise<CalendarEvent> {
    const token = await getAccessToken();
    if (!token) throw new Error('يرجى تسجيل الدخول بحساب Google أولاً');

    const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        summary: event.summary,
        description: event.description || '',
        location: event.location || 'منصة يسرى سمايل (yousrasmile.com)',
        start: {
          dateTime: event.startDateTime,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Riyadh'
        },
        end: {
          dateTime: event.endDateTime,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Riyadh'
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'popup', minutes: 30 },
            { method: 'email', minutes: 120 }
          ]
        }
      })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'فشل إضافة الفعالية إلى تقويم Google');
    }

    return await res.json();
  },

  async deleteEvent(eventId: string): Promise<boolean> {
    const token = await getAccessToken();
    if (!token) throw new Error('يرجى تسجيل الدخول بحساب Google أولاً');

    const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok && res.status !== 204) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'فشل حذف الفعالية من تقويم Google');
    }

    return true;
  }
};
