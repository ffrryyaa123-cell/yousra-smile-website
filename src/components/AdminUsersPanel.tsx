import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ShieldCheck,
  UserPlus,
  KeyRound,
  Trash2,
  Check,
  X,
  Loader2,
  Users,
  History,
  Power,
  Save,
  AlertTriangle
} from 'lucide-react';
import {
  adminAccount,
  ActivityEntry,
  PermissionOption,
  StaffAccount
} from '../services/adminAccount';

interface AdminUsersPanelProps {
  /** Address of the signed-in account, so it cannot delete or lock itself out. */
  currentEmail: string;
  /** Owners may edit other owners; holders of `manage_users` may not. */
  isOwner: boolean;
}

const ACTION_LABELS: Record<string, string> = {
  admin_sign_in: 'تسجيل دخول',
  admin_sign_out: 'تسجيل خروج',
  own_password_changed: 'غيّر كلمة مروره',
  staff_account_created: 'أنشأ حساب موظف',
  staff_account_updated: 'عدّل حساب موظف',
  staff_account_deleted: 'حذف حساب موظف',
  staff_password_reset: 'أعاد تعيين كلمة مرور'
};

const ROLE_LABELS: Record<string, string> = {
  owner: 'مالك',
  editor: 'محرر',
  staff: 'موظف'
};

const formatDate = (value: string): string => {
  try {
    return new Date(value).toLocaleString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return value;
  }
};

export const AdminUsersPanel: React.FC<AdminUsersPanelProps> = ({ currentEmail, isOwner }) => {
  const [permissions, setPermissions] = useState<PermissionOption[]>([]);
  const [staff, setStaff] = useState<StaffAccount[]>([]);
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [notice, setNotice] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);

  // --- my own password -------------------------------------------------------
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [savingPassword, setSavingPassword] = useState<boolean>(false);

  // --- new staff form --------------------------------------------------------
  const [formOpen, setFormOpen] = useState<boolean>(false);
  const [newEmail, setNewEmail] = useState<string>('');
  const [newName, setNewName] = useState<string>('');
  const [newStaffPassword, setNewStaffPassword] = useState<string>('');
  const [newPermissions, setNewPermissions] = useState<string[]>([]);
  const [creating, setCreating] = useState<boolean>(false);

  // --- per-row editing -------------------------------------------------------
  const [editingEmail, setEditingEmail] = useState<string | null>(null);
  const [editPermissions, setEditPermissions] = useState<string[]>([]);
  const [savingRow, setSavingRow] = useState<boolean>(false);
  const [resetTarget, setResetTarget] = useState<string | null>(null);
  const [resetPassword, setResetPassword] = useState<string>('');

  const flash = useCallback((kind: 'ok' | 'error', text: string) => {
    setNotice({ kind, text });
    window.setTimeout(() => setNotice(null), 6000);
  }, []);

  const reload = useCallback(async () => {
    try {
      const [perms, accounts, log] = await Promise.all([
        adminAccount.listPermissions(),
        adminAccount.listStaff(),
        adminAccount.listActivity(40)
      ]);
      setPermissions(perms);
      setStaff(accounts);
      setActivity(log);
    } catch (error: any) {
      flash('error', error?.message || 'تعذر تحميل بيانات المستخدمين.');
    } finally {
      setLoading(false);
    }
  }, [flash]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const permissionLabel = useMemo(() => {
    const map: Record<string, string> = {};
    permissions.forEach(p => {
      map[p.key] = p.labelAr;
    });
    return map;
  }, [permissions]);

  const togglePermission = (list: string[], key: string): string[] =>
    list.includes(key) ? list.filter(k => k !== key) : [...list, key];

  // ---------------------------------------------------------------- handlers

  const handleChangeOwnPassword = async (event: React.FormEvent) => {
    event.preventDefault();
    if (newPassword !== confirmPassword) {
      flash('error', 'الكلمتان غير متطابقتين.');
      return;
    }
    setSavingPassword(true);
    try {
      await adminAccount.changeOwnPassword(newPassword);
      setNewPassword('');
      setConfirmPassword('');
      flash('ok', 'تم تغيير كلمة المرور. استخدميها في المرة القادمة.');
    } catch (error: any) {
      flash('error', error?.message || 'تعذر تغيير كلمة المرور.');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleCreateStaff = async (event: React.FormEvent) => {
    event.preventDefault();
    setCreating(true);
    try {
      await adminAccount.createStaff({
        email: newEmail,
        password: newStaffPassword,
        fullName: newName.trim() || undefined,
        role: 'staff',
        permissions: newPermissions
      });
      flash('ok', `تم إنشاء حساب ${newEmail.trim().toLowerCase()} بنجاح.`);
      setNewEmail('');
      setNewName('');
      setNewStaffPassword('');
      setNewPermissions([]);
      setFormOpen(false);
      await reload();
    } catch (error: any) {
      flash('error', error?.message || 'تعذر إنشاء الحساب.');
    } finally {
      setCreating(false);
    }
  };

  const handleSavePermissions = async (email: string) => {
    setSavingRow(true);
    try {
      await adminAccount.updateStaff(email, { permissions: editPermissions });
      flash('ok', 'تم حفظ الصلاحيات.');
      setEditingEmail(null);
      await reload();
    } catch (error: any) {
      flash('error', error?.message || 'تعذر حفظ الصلاحيات.');
    } finally {
      setSavingRow(false);
    }
  };

  const handleToggleActive = async (account: StaffAccount) => {
    try {
      await adminAccount.updateStaff(account.email, { active: !account.active });
      flash('ok', account.active ? 'تم تعطيل الحساب.' : 'تم تفعيل الحساب.');
      await reload();
    } catch (error: any) {
      flash('error', error?.message || 'تعذر تغيير حالة الحساب.');
    }
  };

  const handleResetPassword = async (email: string) => {
    try {
      await adminAccount.setStaffPassword(email, resetPassword);
      flash('ok', `تم تعيين كلمة مرور جديدة لـ ${email}.`);
      setResetTarget(null);
      setResetPassword('');
    } catch (error: any) {
      flash('error', error?.message || 'تعذر تعيين كلمة المرور.');
    }
  };

  const handleDelete = async (email: string) => {
    if (!window.confirm(`سيتم حذف حساب ${email} نهائياً. هل أنت متأكدة؟`)) return;
    try {
      await adminAccount.deleteStaff(email);
      flash('ok', 'تم حذف الحساب.');
      await reload();
    } catch (error: any) {
      flash('error', error?.message || 'تعذر حذف الحساب.');
    }
  };

  // ------------------------------------------------------------------ render

  const canEdit = (account: StaffAccount): boolean => {
    if (account.email === currentEmail) return false;
    if (account.role === 'owner' && !isOwner) return false;
    return true;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-3 py-20 text-slate-300">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-sm font-bold">جاري تحميل المستخدمين والصلاحيات...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {notice && (
        <div
          className={`rounded-2xl px-4 py-3 text-sm font-bold border ${
            notice.kind === 'ok'
              ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
              : 'bg-red-500/10 border-red-500/40 text-red-300'
          }`}
        >
          {notice.text}
        </div>
      )}

      {/* ---------------------------------------------------------- my account */}
      <section className="bg-slate-900 border border-purple-500/30 rounded-3xl p-6 space-y-4">
        <div className="flex items-center gap-2.5 text-purple-300 font-black">
          <KeyRound className="w-5 h-5" />
          <span>كلمة المرور الخاصة بي</span>
        </div>
        <p className="text-xs text-slate-400">
          الحساب الحالي: <span className="font-mono text-slate-200" dir="ltr">{currentEmail}</span>
        </p>

        <form onSubmit={handleChangeOwnPassword} className="grid gap-3 sm:grid-cols-3">
          <input
            type="password"
            dir="ltr"
            required
            minLength={8}
            autoComplete="new-password"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            placeholder="كلمة المرور الجديدة"
            className="px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <input
            type="password"
            dir="ltr"
            required
            minLength={8}
            autoComplete="new-password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            placeholder="تأكيد كلمة المرور"
            className="px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button
            type="submit"
            disabled={savingPassword}
            className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white font-bold text-sm flex items-center justify-center gap-2"
          >
            {savingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            حفظ كلمة المرور
          </button>
        </form>
        <p className="text-[11px] text-slate-500">٨ أحرف على الأقل. يُفضل مزج حروف وأرقام ورمز.</p>
      </section>

      {/* -------------------------------------------------------- staff header */}
      <section className="bg-slate-900 border border-slate-700 rounded-3xl p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-amber-300 font-black">
            <Users className="w-5 h-5" />
            <span>حسابات الموظفين ({staff.length})</span>
          </div>
          <button
            onClick={() => setFormOpen(open => !open)}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            {formOpen ? 'إغلاق النموذج' : 'إضافة موظف جديد'}
          </button>
        </div>

        {/* new staff form */}
        {formOpen && (
          <form
            onSubmit={handleCreateStaff}
            className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5 space-y-4"
          >
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">البريد الإلكتروني</label>
                <input
                  type="email"
                  dir="ltr"
                  required
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  placeholder="staff@example.com"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">الاسم (اختياري)</label>
                <input
                  type="text"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="اسم الموظف"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">كلمة المرور</label>
                <input
                  type="text"
                  dir="ltr"
                  required
                  minLength={8}
                  value={newStaffPassword}
                  onChange={e => setNewStaffPassword(e.target.value)}
                  placeholder="8 أحرف على الأقل"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-2">
                الصلاحيات — اختاري واحدة أو أكثر
              </label>
              <div className="flex flex-wrap gap-2">
                {permissions.map(permission => {
                  const selected = newPermissions.includes(permission.key);
                  return (
                    <button
                      key={permission.key}
                      type="button"
                      onClick={() => setNewPermissions(list => togglePermission(list, permission.key))}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-colors flex items-center gap-1.5 ${
                        selected
                          ? 'bg-emerald-600 border-emerald-400 text-white'
                          : 'bg-slate-950 border-slate-700 text-slate-300 hover:border-emerald-500'
                      }`}
                    >
                      {selected && <Check className="w-3 h-3" />}
                      {permission.labelAr}
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                المحدد: {newPermissions.length} من {permissions.length}
              </p>
            </div>

            <button
              type="submit"
              disabled={creating}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold text-sm flex items-center gap-2"
            >
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              إنشاء الحساب
            </button>
            <p className="text-[11px] text-amber-300/80 flex items-start gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              احفظي كلمة المرور وأرسليها للموظف — لن تظهر مرة أخرى بعد الإنشاء.
            </p>
          </form>
        )}

        {/* staff list */}
        <div className="space-y-3">
          {staff.map(account => {
            const editable = canEdit(account);
            const isEditing = editingEmail === account.email;
            return (
              <div
                key={account.email}
                className={`rounded-2xl border p-4 space-y-3 ${
                  account.active ? 'border-slate-700 bg-slate-950/60' : 'border-red-500/30 bg-red-500/5'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-sm text-slate-100" dir="ltr">
                        {account.email}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-black ${
                          account.role === 'owner'
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-slate-700 text-slate-300'
                        }`}
                      >
                        {ROLE_LABELS[account.role] ?? account.role}
                      </span>
                      {!account.active && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-black bg-red-500/20 text-red-300">
                          معطّل
                        </span>
                      )}
                      {account.email === currentEmail && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-black bg-purple-500/20 text-purple-300">
                          أنا
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500">
                      {account.fullName ? `${account.fullName} — ` : ''}
                      أُنشئ في {formatDate(account.createdAt)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {account.role !== 'owner' && (
                      <button
                        onClick={() => {
                          setEditingEmail(isEditing ? null : account.email);
                          setEditPermissions(account.permissions);
                        }}
                        disabled={!editable}
                        className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 flex items-center gap-1.5"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        {isEditing ? 'إلغاء' : 'الصلاحيات'}
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setResetTarget(resetTarget === account.email ? null : account.email);
                        setResetPassword('');
                      }}
                      disabled={!editable}
                      className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 flex items-center gap-1.5"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      كلمة المرور
                    </button>
                    {account.role !== 'owner' && (
                      <button
                        onClick={() => handleToggleActive(account)}
                        disabled={!editable}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-bold disabled:opacity-40 flex items-center gap-1.5 ${
                          account.active
                            ? 'bg-amber-600/80 hover:bg-amber-600 text-white'
                            : 'bg-emerald-600/80 hover:bg-emerald-600 text-white'
                        }`}
                      >
                        <Power className="w-3.5 h-3.5" />
                        {account.active ? 'تعطيل' : 'تفعيل'}
                      </button>
                    )}
                    {account.role !== 'owner' && (
                      <button
                        onClick={() => handleDelete(account.email)}
                        disabled={!editable}
                        className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-red-600/80 hover:bg-red-600 disabled:opacity-40 text-white flex items-center gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        حذف
                      </button>
                    )}
                  </div>
                </div>

                {/* current permissions summary */}
                {!isEditing && (
                  <div className="flex flex-wrap gap-1.5">
                    {account.role === 'owner' ? (
                      <span className="px-2 py-1 rounded-md text-[10px] font-bold bg-amber-500/15 text-amber-300">
                        جميع الصلاحيات (مالك)
                      </span>
                    ) : account.permissions.length === 0 ? (
                      <span className="text-[11px] text-slate-500">لا توجد صلاحيات ممنوحة بعد.</span>
                    ) : (
                      account.permissions.map(key => (
                        <span
                          key={key}
                          className="px-2 py-1 rounded-md text-[10px] font-bold bg-slate-800 text-slate-300"
                        >
                          {permissionLabel[key] ?? key}
                        </span>
                      ))
                    )}
                  </div>
                )}

                {/* permission editor */}
                {isEditing && (
                  <div className="rounded-xl border border-purple-500/30 bg-purple-500/5 p-4 space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {permissions.map(permission => {
                        const selected = editPermissions.includes(permission.key);
                        return (
                          <button
                            key={permission.key}
                            type="button"
                            onClick={() =>
                              setEditPermissions(list => togglePermission(list, permission.key))
                            }
                            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-colors flex items-center gap-1.5 ${
                              selected
                                ? 'bg-purple-600 border-purple-400 text-white'
                                : 'bg-slate-950 border-slate-700 text-slate-300 hover:border-purple-500'
                            }`}
                          >
                            {selected && <Check className="w-3 h-3" />}
                            {permission.labelAr}
                          </button>
                        );
                      })}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleSavePermissions(account.email)}
                        disabled={savingRow}
                        className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white font-bold text-xs flex items-center gap-1.5"
                      >
                        {savingRow ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Save className="w-3.5 h-3.5" />
                        )}
                        حفظ الصلاحيات
                      </button>
                      <button
                        onClick={() => setEditingEmail(null)}
                        className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5"
                      >
                        <X className="w-3.5 h-3.5" />
                        إلغاء
                      </button>
                    </div>
                  </div>
                )}

                {/* password reset row */}
                {resetTarget === account.email && (
                  <div className="rounded-xl border border-slate-700 bg-slate-950 p-4 flex flex-wrap items-center gap-2">
                    <input
                      type="text"
                      dir="ltr"
                      minLength={8}
                      value={resetPassword}
                      onChange={e => setResetPassword(e.target.value)}
                      placeholder="كلمة مرور جديدة (8 أحرف على الأقل)"
                      className="flex-1 min-w-[200px] px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <button
                      onClick={() => handleResetPassword(account.email)}
                      className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs"
                    >
                      تعيين
                    </button>
                    <button
                      onClick={() => setResetTarget(null)}
                      className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs"
                    >
                      إلغاء
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ------------------------------------------------------- activity log */}
      <section className="bg-slate-900 border border-slate-700 rounded-3xl p-6 space-y-4">
        <div className="flex items-center gap-2.5 text-blue-300 font-black">
          <History className="w-5 h-5" />
          <span>سجل العمليات</span>
        </div>

        {activity.length === 0 ? (
          <p className="text-xs text-slate-500">لا توجد عمليات مسجّلة بعد.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="text-slate-500 border-b border-slate-800">
                  <th className="py-2 px-2 font-bold">التاريخ</th>
                  <th className="py-2 px-2 font-bold">المستخدم</th>
                  <th className="py-2 px-2 font-bold">العملية</th>
                  <th className="py-2 px-2 font-bold">العنصر</th>
                </tr>
              </thead>
              <tbody>
                {activity.map(entry => (
                  <tr key={entry.id} className="border-b border-slate-800/60 text-slate-300">
                    <td className="py-2 px-2 whitespace-nowrap text-slate-500">
                      {formatDate(entry.createdAt)}
                    </td>
                    <td className="py-2 px-2 font-mono" dir="ltr">
                      {entry.actorEmail ?? '—'}
                    </td>
                    <td className="py-2 px-2 font-bold">
                      {ACTION_LABELS[entry.action] ?? entry.action}
                    </td>
                    <td className="py-2 px-2 font-mono text-slate-500" dir="ltr">
                      {entry.entityId ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
