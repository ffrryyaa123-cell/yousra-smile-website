import React from 'react';
import { Product } from '../types';

export function ProductCouponFields({ value, onChange }: {
  value: Product['coupon']; onChange: (value: NonNullable<Product['coupon']>) => void;
}) {
  const coupon = value || { label: '', code: '', terms: '', expiresOn: '', isPublic: false };
  const update = (patch: Partial<typeof coupon>) => onChange({ ...coupon, ...patch });
  return <fieldset className="space-y-3 rounded-xl border border-purple-500/40 p-4">
    <legend>كوبون المتجر</legend>
    <p className="text-xs">يُحفظ مع تعديلات المنتج. الكوبون منفصل عن السعر الحالي؛ صلاحية الخصم يحددها المتجر عند الدفع.</p>
    <label className="block">وصف الكوبون
      <input className="w-full rounded border p-2 bg-transparent" value={coupon.label} placeholder="مثال: كوبون خصم 10%" onChange={e => update({ label: e.target.value })} />
    </label>
    <label className="block">رمز الكوبون (إن وجد)
      <input className="w-full rounded border p-2 bg-transparent" value={coupon.code} onChange={e => update({ code: e.target.value })} />
    </label>
    <label className="block">الشروط وطريقة التفعيل
      <textarea className="w-full rounded border p-2 bg-transparent" value={coupon.terms} onChange={e => update({ terms: e.target.value })} />
    </label>
    <label className="block">آخر يوم للصلاحية (إن كان معروفًا)
      <input type="date" className="block rounded border p-2 bg-transparent" value={coupon.expiresOn} onChange={e => update({ expiresOn: e.target.value })} />
    </label>
    <label className="flex gap-2"><input type="checkbox" checked={coupon.isPublic}
      disabled={!coupon.label.trim() || !coupon.terms.trim()}
      onChange={e => update({ isPublic: e.target.checked })} />تأكدت أنه عرض قابل للمشاركة وأريد إظهاره للزوار</label>
    <p className="text-xs">اتركيه غير محدد إذا كان الخصم خاصًا بحسابك. لا نخصم قيمة الكوبون تلقائيًا من السعر.</p>
  </fieldset>;
}

export function ProductCouponBadge({ coupon }: { coupon: Product['coupon'] }) {
  if (!coupon?.isPublic || !coupon.label.trim() || !coupon.terms.trim()) return null;
  if (coupon.expiresOn && Date.now() > Date.parse(`${coupon.expiresOn}T23:59:59Z`)) return null;
  return <div className="rounded-lg border border-green-500/40 p-2 text-xs text-green-300">
    <strong>{coupon.label}</strong>{coupon.code && <span dir="ltr"> — {coupon.code}</span>}
    <p>{coupon.terms}</p>
    {coupon.expiresOn && <p>حتى {coupon.expiresOn}</p>}
    <p>يُطبق حسب أهلية الحساب وشروط المتجر عند الدفع.</p>
  </div>;
}
