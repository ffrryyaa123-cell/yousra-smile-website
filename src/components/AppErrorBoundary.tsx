import React from 'react';

interface Props { children: React.ReactNode; }
interface State { hasError: boolean; }

export class AppErrorBoundary extends React.Component<Props, State> {
  declare props: Readonly<Props>;
  declare setState: React.Component<Props, State>['setState'];

  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Recovered storefront render error', error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <main className="min-h-screen bg-slate-950 text-white grid place-items-center p-6" dir="rtl">
        <section className="max-w-lg rounded-3xl border border-red-500/40 bg-slate-900 p-6 text-center space-y-4">
          <h1 className="text-xl font-black">تعذر عرض هذا الجزء من الموقع</h1>
          <p className="text-sm text-slate-300">بيانات قديمة أو ناقصة سببت خطأ، لكن الموقع لم يُغلق بالكامل. أعيدي تحميل الصفحة للمحاولة من جديد.</p>
          <button type="button" onClick={() => window.location.reload()} className="rounded-xl bg-amber-500 px-5 py-2.5 font-black text-slate-950">إعادة تحميل الصفحة</button>
        </section>
      </main>
    );
  }
}
