import React from 'react';
import { Lock, LogIn, LogOut, ShieldCheck } from 'lucide-react';
import { isSupabaseConfigured, requireSupabase } from '../lib/supabase';

type StaffRole = 'owner' | 'admin' | 'editor';

interface AdminAuthGateProps {
  children: React.ReactNode;
}

export const AdminAuthGate: React.FC<AdminAuthGateProps> = ({ children }) => {
  const [email, setEmail] = React.useState('info@yousrasmile.com');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [signingIn, setSigningIn] = React.useState(false);
  const [role, setRole] = React.useState<StaffRole | null>(null);
  const [userEmail, setUserEmail] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const loadAccess = React.useCallback(async () => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      setRole(null);
      setUserEmail(null);
      return;
    }

    const client = requireSupabase();
    const { data: sessionData } = await client.auth.getSession();
    const user = sessionData.session?.user;

    if (!user) {
      setRole(null);
      setUserEmail(null);
      setLoading(false);
      return;
    }

    setUserEmail(user.email ?? null);

    const { data: profile, error: profileError } = await client
      .from('profiles')
      .select('role, is_active')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || profile.is_active === false) {
      setRole(null);
      setError('تعذر التحقق من صلاحيات هذا الحساب.');
      setLoading(false);
      return;
    }

    const currentRole = profile.role as StaffRole | string;
    if (currentRole === 'owner' || currentRole === 'admin' || currentRole === 'editor') {
      setRole(currentRole);
      setError(null);
    } else {
      setRole(null);
      setError('هذا الحساب لا يملك صلاحية دخول لوحة الإدارة.');
    }

    setLoading(false);
  }, []);

  React.useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    const client = requireSupabase();
    void loadAccess();

    const { data: authListener } = client.auth.onAuthStateChange(() => {
      setLoading(true);
      void loadAccess();
    });

    return () => authListener.subscription.unsubscribe();
  }, [loadAccess]);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSigningIn(true);

    try {
      const client = requireSupabase();
      const { error: signInError } = await client.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        setError('البريد الإلكتروني أو كلمة المرور غير صحيحة.');
        return;
      }

      setLoading(true);
      await loadAccess();
      setPassword('');
    } catch {
      setError('تعذر الاتصال بخدمة تسجيل الدخول.');
    } finally {
      setSigningIn(false);
    }
  };

  const handleLogout = async () => {
    if (!isSupabaseConfigured) return;
    await requireSupabase().auth.signOut();
    setRole(null);
    setUserEmail(null);
    setPassword('');
  };

  if (loading) {
    return (
      <div className="max-w-md mx-auto my-16 rounded-3xl border border-slate-700 bg-slate-950 p-8 text-center text-slate-100 shadow-xl">
        <ShieldCheck className="mx-auto mb-4 h-10 w-10 text-amber-300" />
        <p className="font-bold">جاري التحقق من صلاحية الدخول...</p>
      </div>
    );
  }

  if (!isSupabaseConfigured) {
    return (
      <div className="max-w-md mx-auto my-16 rounded-3xl border border-red-800/60 bg-slate-950 p-8 text-center text-slate-100 shadow-xl">
        <Lock className="mx-auto mb-4 h-10 w-10 text-red-300" />
        <h2 className="text-xl font-black">لوحة الإدارة غير مفعلة</h2>
        <p className="mt-3 text-sm leading-7 text-slate-300">
          إعدادات Supabase غير موجودة على هذا الجهاز أو بيئة النشر. لن يتم فتح لوحة الإدارة بدون اتصال آمن بقاعدة البيانات.
        </p>
      </div>
    );
  }

  if (!role) {
    return (
      <div className="max-w-md mx-auto my-16 rounded-3xl border border-slate-700 bg-slate-950 p-8 text-slate-100 shadow-xl">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-950 text-purple-200">
          <Lock className="h-8 w-8" />
        </div>
        <h2 className="text-center text-xl font-black">دخول إدارة Yousra Smile</h2>
        <p className="mt-2 text-center text-sm leading-6 text-slate-300">
          استخدمي حساب المالك المسجل في Supabase. لا توجد كلمة مرور افتراضية داخل الموقع.
        </p>

        <form onSubmit={handleLogin} className="mt-6 space-y-4">
          <label className="block text-sm font-bold">
            البريد الإلكتروني
            <input
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-left text-white outline-none focus:border-purple-400"
              dir="ltr"
              required
            />
          </label>

          <label className="block text-sm font-bold">
            كلمة المرور
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-left text-white outline-none focus:border-purple-400"
              dir="ltr"
              required
            />
          </label>

          {error && <p className="rounded-xl bg-red-950/70 px-4 py-3 text-sm text-red-200">{error}</p>}

          <button
            type="submit"
            disabled={signingIn}
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 py-3 font-bold text-white transition hover:bg-purple-500 disabled:cursor-wait disabled:opacity-60"
          >
            <LogIn className="h-5 w-5" />
            {signingIn ? 'جاري تسجيل الدخول...' : 'دخول آمن'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-700/40 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-100">
        <span className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4" />
          دخول موثّق: <span dir="ltr">{userEmail}</span> · {role}
        </span>
        <button
          type="button"
          onClick={handleLogout}
          className="flex min-h-10 items-center gap-2 rounded-xl border border-emerald-700/50 px-3 py-2 font-bold hover:bg-emerald-900/50"
        >
          <LogOut className="h-4 w-4" />
          تسجيل الخروج
        </button>
      </div>
      {children}
    </>
  );
};
