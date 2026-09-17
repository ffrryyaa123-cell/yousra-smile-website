import React from 'react';

export class AppErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('Yousra Smile storefront recovered from a render error.', error, info);
  }

  retry = () => {
    this.setState({ hasError: false });
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;
    const english = document.documentElement.lang === 'en';
    return (
      <main className="min-h-screen bg-[#0D0714] text-white grid place-items-center p-6" role="alert">
        <section className="w-full max-w-lg rounded-3xl border border-purple-500/40 bg-slate-950 p-8 text-center shadow-2xl">
          <div className="text-4xl mb-3" aria-hidden="true">🛠️</div>
          <h1 className="text-xl font-black mb-2">
            {english ? 'This section could not be displayed' : 'تعذر عرض هذا الجزء من الموقع'}
          </h1>
          <p className="text-sm text-slate-300 mb-6">
            {english
              ? 'Your products and saved data are safe. Reload the page to continue.'
              : 'منتجاتك وبياناتك المحفوظة بأمان. أعيدي تحميل الصفحة للمتابعة.'}
          </p>
          <button type="button" onClick={this.retry} className="rounded-xl bg-purple-600 px-5 py-3 text-sm font-bold hover:bg-purple-500">
            {english ? 'Reload Page' : 'إعادة تحميل الصفحة'}
          </button>
        </section>
      </main>
    );
  }
}
