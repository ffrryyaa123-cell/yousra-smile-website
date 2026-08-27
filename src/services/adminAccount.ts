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

export interface StaffAccount {
  email: string;
  fullName: string | null;
  role: string;
  active: boolean;
  permissions: string[];
  createdAt: string;
}

export interface ActivityEntry {
  id: number;
  actorEmail: string | null;
  action: string;
  entityType: string | null;
  entityId: string | null;
  details: Record<string, unknown>;
  createdAt: string;
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

/**
 * Calls the `admin-staff` edge function with the caller's own session, and
 * turns its error payload into a readable Arabic message.
 */
async function callStaffFunction(payload: Record<string, unknown>): Promise<any> {
  const { data, error } = await supabase.functions.invoke('admin-staff', { body: payload });

  if (error) {
    // The function's own message lives in the response body, not in `error`.
    let detail = '';
    try {
      const response = (error as any)?.context;
      if (response && typeof response.json === 'function') {
        const parsed = await response.json();
        detail = parsed?.error ?? '';
      }
    } catch (_) {
      detail = '';
    }
    throw new Error(detail || error.message || 'تعذر تنفيذ العملية.');
  }

  if (data?.error) throw new Error(data.error);
  return data;
}

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
  },

  // ---------------------------------------------------------------------------
  // Account and staff management
  // ---------------------------------------------------------------------------

  /** Changes the password of the account that is currently signed in. */
  async changeOwnPassword(newPassword: string): Promise<void> {
    if (newPassword.length < 8) {
      throw new Error('كلمة المرور يجب ألا تقل عن ٨ أحرف.');
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw new Error(describeAdminAuthError(error));
    void adminAccount.logActivity('own_password_changed');
  },

  /** Every dashboard account, newest last. Readable by admins only (RLS). */
  async listStaff(): Promise<StaffAccount[]> {
    const { data, error } = await supabase
      .from('admin_users')
      .select('email, full_name, role, active, permissions, created_at')
      .order('created_at');
    if (error) throw new Error(error.message);
    return (data ?? []).map(row => ({
      email: row.email,
      fullName: row.full_name ?? null,
      role: row.role,
      active: row.active,
      permissions: Array.isArray(row.permissions) ? row.permissions : [],
      createdAt: row.created_at
    }));
  },

  /**
   * Creates a staff account. Creating the sign-in identity itself needs the
   * service role key, so this goes through the `admin-staff` edge function
   * rather than the browser.
   */
  async createStaff(input: {
    email: string;
    password: string;
    fullName?: string;
    role?: 'editor' | 'staff';
    permissions: string[];
  }): Promise<void> {
    await callStaffFunction({
      action: 'create',
      email: input.email.trim().toLowerCase(),
      password: input.password,
      fullName: input.fullName ?? null,
      role: input.role ?? 'staff',
      permissions: input.permissions
    });
  },

  /** Sets a new password for another account. */
  async setStaffPassword(email: string, password: string): Promise<void> {
    await callStaffFunction({
      action: 'set_password',
      email: email.trim().toLowerCase(),
      password
    });
  },

  /** Removes an account entirely — both the sign-in identity and its record. */
  async deleteStaff(email: string): Promise<void> {
    await callStaffFunction({ action: 'delete', email: email.trim().toLowerCase() });
  },

  /**
   * Updates name, role, active flag or permissions. This one runs straight from
   * the browser: row level security already restricts it to `manage_users`.
   */
  async updateStaff(
    email: string,
    changes: { fullName?: string | null; role?: string; active?: boolean; permissions?: string[] }
  ): Promise<void> {
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (changes.fullName !== undefined) patch.full_name = changes.fullName;
    if (changes.role !== undefined) patch.role = changes.role;
    if (changes.active !== undefined) patch.active = changes.active;
    if (changes.permissions !== undefined) patch.permissions = changes.permissions;

    const { error } = await supabase.from('admin_users').update(patch).eq('email', email);
    if (error) throw new Error(error.message);
    void adminAccount.logActivity('staff_account_updated', 'admin_user', email, changes);
  },

  /** The most recent audit entries, newest first. */
  async listActivity(limit = 50): Promise<ActivityEntry[]> {
    const { data, error } = await supabase
      .from('activity_log')
      .select('id, actor_email, action, entity_type, entity_id, details, created_at')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw new Error(error.message);
    return (data ?? []).map(row => ({
      id: row.id,
      actorEmail: row.actor_email ?? null,
      action: row.action,
      entityType: row.entity_type ?? null,
      entityId: row.entity_id ?? null,
      details: row.details ?? {},
      createdAt: row.created_at
    }));
  }
};

/** Owners implicitly hold every permission, mirroring the database rules. */
export const profileHasPermission = (profile: AdminProfile | null, key: string): boolean => {
  if (!profile || !profile.active) return false;
  if (profile.role === 'owner') return true;
  return profile.permissions.includes(key);
};
