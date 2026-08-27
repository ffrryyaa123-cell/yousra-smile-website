import { createClient, Session, SupabaseClient } from '@supabase/supabase-js';

// Supabase powers the dashboard sign-in and the staff permission model.
//
// Why not Firebase Auth: the Firebase project behind this site was created
// automatically by Google AI Studio on the Starter Tier. Its owner is the AI
// Studio service, not us, so sign-in providers, authorized domains and user
// accounts cannot be administered — every one of those screens answers with
// "ask a project owner for the necessary permission". Email/password sign-in
// through Supabase avoids that lock entirely, and it also avoids the OAuth
// redirect problem: only Google/phone sign-in needs the site's domain to be an
// authorized OAuth domain, so a password login works on yousrasmile.com with no
// console configuration at all.
//
// The Firebase code elsewhere in this project is deliberately left in place and
// still works for Drive, Sheets and Calendar. This module only takes over the
// dashboard gate.

const SUPABASE_URL = 'https://iicvasloytbjotbgbvjt.supabase.co';

// Publishable key. It is safe in front-end code: every table is protected by
// row level security, so this key alone grants nothing beyond public reads.
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_aMazQgFRFomsVGyuZF0cKg_Fn5fhH96';

export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storageKey: 'yousra-smile-admin-session'
  }
});

export interface AdminProfile {
  email: string;
  role: 'owner' | 'editor' | 'staff';
  active: boolean;
  fullName: string | null;
  permissions: string[];
}

export interface PermissionOption {
  key: string;
  labelAr: string;
  labelEn: string;
}

const ARABIC_AUTH_ERRORS: Record<string, string> = {
  'Invalid login credentials': 'البريد الإلكتروني أو كلمة المرور غير صحيحة.',
  'Email not confirmed': 'لم يتم تأكيد هذا البريد بعد.',
  'User not found': 'لا يوجد حساب بهذا البريد الإلكتروني.'
};

export const describeAdminAuthError = (error: any): string => {
  const message = String(error?.message || '');
  for (const [needle, arabic] of Object.entries(ARABIC_AUTH_ERRORS)) {
    if (message.includes(needle)) return arabic;
  }
  if (/network|fetch/i.test(message)) {
    return 'تعذر الاتصال بالخادم. تحققي من الإنترنت وأعيدي المحاولة.';
  }
  return message || 'تعذر تسجيل الدخول.';
};

export const adminAccount = {
  /** Signs in with email and password. Throws with a readable Arabic message. */
  async signIn(email: string, password: string): Promise<Session> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password
    });
    if (error) throw new Error(describeAdminAuthError(error));
    if (!data.session) throw new Error('تعذر إنشاء جلسة الدخول.');
    return data.session;
  },

  async signOut(): Promise<void> {
    await supabase.auth.signOut();
  },

  async getSession(): Promise<Session | null> {
    const { data } = await supabase.auth.getSession();
    return data.session ?? null;
  },

  /** Fires whenever the session appears, refreshes or disappears. */
  onSessionChange(callback: (session: Session | null) => void) {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => callback(session));
    return () => data.subscription.unsubscribe();
  },

  /**
   * Reads the signed-in account's dashboard profile. Returns null when the
   * address has no admin record or has been deactivated, which is what keeps a
   * merely-authenticated visitor out of the panel.
   */
  async loadProfile(): Promise<AdminProfile | null> {
    const { data: userData } = await supabase.auth.getUser();
    const email = userData.user?.email?.toLowerCase();
    if (!email) return null;

    const { data, error } = await supabase
      .from('admin_users')
      .select('email, role, active, full_name, permissions')
      .eq('email', email)
      .maybeSingle();

    if (error || !data || !data.active) return null;
    return {
      email: data.email,
      role: data.role,
      active: data.active,
      fullName: data.full_name ?? null,
      permissions: Array.isArray(data.permissions) ? data.permissions : []
    };
  },

  /** The grantable permission list, for rendering the multi-select. */
  async listPermissions(): Promise<PermissionOption[]> {
    const { data, error } = await supabase
      .from('permissions')
      .select('key, label_ar, label_en')
      .order('sort_order');
    if (error || !data) return [];
    return data.map(row => ({ key: row.key, labelAr: row.label_ar, labelEn: row.label_en }));
  },

  /**
   * Appends to the audit trail. Deliberately never throws: a failed log entry
   * must not roll back or block the action the user actually asked for.
   */
  async logActivity(
    action: string,
    entityType?: string,
    entityId?: string,
    details: Record<string, unknown> = {}
  ): Promise<void> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      await supabase.from('activity_log').insert({
        actor_email: userData.user?.email ?? null,
        actor_id: userData.user?.id ?? null,
        action,
        entity_type: entityType ?? null,
        entity_id: entityId ?? null,
        details
      });
    } catch (error) {
      console.warn('Activity log entry skipped:', error);
    }
  }
};

/** Owners implicitly hold every permission, mirroring the database rules. */
export const profileHasPermission = (profile: AdminProfile | null, key: string): boolean => {
  if (!profile || !profile.active) return false;
  if (profile.role === 'owner') return true;
  return profile.permissions.includes(key);
};
