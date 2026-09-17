import React from 'react';

interface Props {
  children?: React.ReactNode;
}

interface State {
  hasError: boolean;
  message?: string;
}

export class AppErrorBoundary extends React.Component<Props, State> {
  declare readonly props: Props;
  state: State = { hasError: false };

  static getDerivedStateFromError(error: unknown): State {
    return {
      hasError: true,
      message: error instanceof Error ? error.message : 'Unexpected application error'
    };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo) {
    console.error('Yousra Smile render error', error, info);
  }

  private reload = () => {
    window.location.reload();
  };

  private goHome = () => {
    window.history.replaceState({}, '', '/');
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    const isArabic = document.documentElement.lang !== 'en';
    return (
      <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <section className="w-full max-w-lg rounded-3xl border border-amber-500/30 bg-slate-900 p-6 shadow-2xl">
          <h1 className="text-xl font-black text-amber-300">
            {isArabic ? 'تعذر عرض هذا الجزء من الموقع' : 'This part of the site could not be displayed'}
          </h1>
          <p className="mt-3 text-sm leading-7 text-slate-300">
            {isArabic
              ? 'تم احتواء الخطأ بدل ظهور شاشة سوداء. يمكنك إعادة تحميل الصفحة أو الرجوع للرئيسية بدون فقدان بيانات المنتجات.'
              : 'The error was contained instead of showing a blank screen. Reload the page or return home without changing product data.'}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <button type="button" onClick={this.reload} className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-black text-slate-950">
              {isArabic ? 'إعادة تحميل الصفحة' : 'Reload page'}
            </button>
            <button type="button" onClick={this.goHome} className="rounded-xl border border-slate-600 bg-slate-800 px-4 py-2 text-sm font-bold text-white">
              {isArabic ? 'العودة للرئيسية' : 'Go to home'}
            </button>
          </div>
          {import.meta.env.DEV && this.state.message && (
            <pre className="mt-4 overflow-auto rounded-xl bg-black/40 p-3 text-[11px] text-red-300">{this.state.message}</pre>
          )}
        </section>
      </main>
    );
  }
}