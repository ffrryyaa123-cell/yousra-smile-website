import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<React.PropsWithChildren, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Yousra Smile render error:', error, info);
  }

  private reload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className="min-h-screen flex items-center justify-center px-6 bg-white dark:bg-slate-950 text-slate-900 dark:text-white">
        <section className="w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm text-center">
          <h1 className="text-2xl font-bold mb-3">تعذر عرض هذا الجزء من الموقع</h1>
          <p className="text-sm text-slate-600 dark:text-slate-300 mb-5">
            بياناتك لم تُحذف. حدث خطأ في العرض، ويمكن إعادة تحميل الصفحة بأمان.
          </p>
          <button
            type="button"
            onClick={this.reload}
            className="rounded-xl px-5 py-3 font-semibold bg-slate-900 text-white dark:bg-white dark:text-slate-900"
          >
            إعادة تحميل الصفحة
          </button>
        </section>
      </main>
    );
  }
}
