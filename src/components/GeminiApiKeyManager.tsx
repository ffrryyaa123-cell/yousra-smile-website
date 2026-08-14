import React, { useState, useEffect } from 'react';
import { 
  Key, 
  ShieldCheck, 
  Activity, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  ExternalLink, 
  Eye, 
  EyeOff, 
  Zap, 
  Check, 
  Copy, 
  Sparkles, 
  RotateCcw,
  Sliders
} from 'lucide-react';

interface KeyStatus {
  hasKey: boolean;
  source: 'environment' | 'custom_admin' | 'custom_override' | 'none' | 'missing';
  sourceLabel?: string;
  maskedKey: string;
  model?: string;
  hasCustomKey?: boolean;
  hasEnvKey?: boolean;
  activeModel?: string;
  status?: 'ready' | 'fallback_active' | 'active' | 'missing';
}

interface TestResult {
  success: boolean;
  message?: string;
  error?: string;
  latencyMs?: number;
  model?: string;
  replyText?: string;
  timestamp?: string;
}

interface GeminiApiKeyManagerProps {
  compact?: boolean;
  onKeyUpdated?: () => void;
}

export const GeminiApiKeyManager: React.FC<GeminiApiKeyManagerProps> = ({ 
  compact = false,
  onKeyUpdated 
}) => {
  const [keyStatus, setKeyStatus] = useState<KeyStatus | null>(null);
  const [inputKey, setInputKey] = useState<string>('');
  const [showKey, setShowKey] = useState<boolean>(false);
  const [isLoadingStatus, setIsLoadingStatus] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // Fetch current key status from server
  const fetchStatus = async () => {
    setIsLoadingStatus(true);
    try {
      const res = await fetch('/api/ai/key-status');
      if (res.ok) {
        const data = await res.json();
        setKeyStatus(data);
      }
    } catch (err) {
      console.error('Failed to fetch Gemini key status:', err);
    } finally {
      setIsLoadingStatus(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  // Save or update custom API key
  const handleSaveKey = async () => {
    if (!inputKey.trim()) {
      setActionMessage({ type: 'error', text: 'يرجى إدخال مفتاح API أولاً أو الضغط على إعادة تعيين.' });
      return;
    }

    setIsSaving(true);
    setActionMessage(null);
    setTestResult(null);

    try {
      const res = await fetch('/api/ai/key-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: inputKey.trim() })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setActionMessage({ type: 'success', text: data.message || 'تم حفظ وتفعيل مفتاح Gemini API بنجاح!' });
        setInputKey('');
        await fetchStatus();
        if (onKeyUpdated) onKeyUpdated();
        // Auto-run test connection for user convenience
        handleTestConnection(inputKey.trim());
      } else {
        throw new Error(data.error || 'فشل حفظ المفتاح');
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'حدث خطأ أثناء حفظ المفتاح.' });
    } finally {
      setIsSaving(false);
    }
  };

  // Revert back to environment key
  const handleResetToEnv = async () => {
    setIsSaving(true);
    setActionMessage(null);
    setTestResult(null);

    try {
      const res = await fetch('/api/ai/key-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset' })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setActionMessage({ type: 'success', text: 'تم إعادة التعيين لاستخدام إعدادات خادم AI Studio الافتراضية.' });
        setInputKey('');
        await fetchStatus();
        if (onKeyUpdated) onKeyUpdated();
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'حدث خطأ أثناء إعادة التعيين.' });
    } finally {
      setIsSaving(false);
    }
  };

  // Test Gemini connection with latency check
  const handleTestConnection = async (specificKey?: string) => {
    setIsTesting(true);
    setTestResult(null);
    setActionMessage(null);

    try {
      const keyToTest = specificKey || inputKey.trim() || undefined;
      const res = await fetch('/api/ai/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: keyToTest })
      });

      const data = await res.json();
      setTestResult(data);
      if (data.success) {
        await fetchStatus();
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        error: err.message || 'تعذر الوصول إلى مسار فحص الاتصال بالخادم.'
      });
    } finally {
      setIsTesting(false);
    }
  };

  const copyMasked = () => {
    if (keyStatus?.maskedKey) {
      navigator.clipboard.writeText(keyStatus.maskedKey);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  if (compact) {
    return (
      <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-4 shadow-lg text-white">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${keyStatus?.hasKey ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            <span className="text-xs font-black font-['Tajawal']">حالة Gemini AI API</span>
          </div>
          <button
            onClick={() => handleTestConnection()}
            disabled={isTesting}
            className="px-2.5 py-1 bg-purple-600/80 hover:bg-purple-500 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all disabled:opacity-50"
          >
            {isTesting ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3 text-amber-300" />}
            <span>اختبار الربط</span>
          </button>
        </div>

        {testResult && (
          <div className={`p-2.5 rounded-xl text-xs flex items-start gap-2 ${testResult.success ? 'bg-emerald-950/60 border border-emerald-700/60 text-emerald-200' : 'bg-red-950/60 border border-red-700/60 text-red-200'}`}>
            {testResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />}
            <div>
              <p className="font-bold">{testResult.success ? 'الربط شغال 100%' : 'تنبيه الاتصال'}</p>
              <p className="text-[11px] opacity-90">{testResult.message || testResult.error}</p>
              {testResult.latencyMs && (
                <span className="text-[10px] text-amber-300 font-mono mt-1 block">
                  ⚡ زمن الاستجابة: {testResult.latencyMs}ms | النموذج: {testResult.model || 'gemini-2.5-flash'}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-7 space-y-6 shadow-xl text-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-900/30">
            <Key className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black text-white font-['Tajawal']">
                إعدادات ومفاتيح Gemini AI
              </h3>
              <span className="px-2 py-0.5 bg-purple-500/20 border border-purple-500/40 text-purple-300 font-mono text-[10px] font-bold rounded-md">
                gemini-2.5-flash
              </span>
            </div>
            <p className="text-xs text-slate-300 font-medium">
              إدارة مفتاح Google Gemini API وربطه بالمولدات الذكية ووكلاء الأفلييت التلقائيين.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
          >
            <span>الحصول على مفتاح مجاني</span>
            <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
          </a>

          <button
            onClick={fetchStatus}
            disabled={isLoadingStatus}
            title="تحديث الحالة"
            className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white rounded-xl text-xs transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingStatus ? 'animate-spin text-purple-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Status Bento Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Status Indicator */}
        <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">حالة المفتاح والاتصال</span>
            <div className={`w-3 h-3 rounded-full ${keyStatus?.hasKey ? 'bg-emerald-400 shadow-md shadow-emerald-500/50 animate-pulse' : 'bg-amber-400 shadow-md shadow-amber-500/50'}`} />
          </div>
          <div className="flex items-center gap-2">
            {keyStatus?.hasKey ? (
              <span className="text-sm font-black text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>مفتاح نشط وجاهز</span>
              </span>
            ) : (
              <span className="text-sm font-black text-amber-400 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                <span>المحرك الاحتياطي نشط</span>
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-300">
            {keyStatus?.hasKey 
              ? 'يتم استخدام الذكاء الاصطناعي الحي من Google لتوليد المحتوى.' 
              : 'يعمل النظام عبر قوالب الذكاء الاصطناعي الذكية المدمجة بدون انقطاع.'}
          </p>
        </div>

        {/* Key Source */}
        <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4 space-y-2">
          <span className="text-xs font-bold text-slate-400 block">مصدر المفتاح الحالي</span>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-black text-white">
              {keyStatus?.source === 'custom_override' || keyStatus?.source === 'custom_admin'
                ? 'مفتاح مخصص (إدارة النظام)'
                : keyStatus?.source === 'environment'
                ? 'بيئة الخادم الافتراضية (.env)'
                : keyStatus?.hasKey
                ? 'مفتاح نشط'
                : 'غير معين (المحرك الاحتياطي)'}
            </span>
          </div>
          <p className="text-[11px] text-slate-300 font-mono">
            المتغير: GEMINI_API_KEY
          </p>
        </div>

        {/* Active Masked Key */}
        <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">معاينة المفتاح المشفر</span>
            {keyStatus?.maskedKey && (
              <button
                onClick={copyMasked}
                className="text-[10px] font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1 cursor-pointer"
              >
                {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{isCopied ? 'تم النسخ' : 'نسخ'}</span>
              </button>
            )}
          </div>
          <p className="font-mono text-xs font-bold text-amber-300 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-700/60 truncate">
            {keyStatus?.maskedKey || 'لم يتم إدخال مفتاح مخصص'}
          </p>
          <span className="text-[10px] text-slate-300 block">
            مشفر ومحمي في جانب الخادم فقط
          </span>
        </div>
      </div>

      {/* Input Field & Management Actions */}
      <div className="bg-slate-800/50 border border-slate-700/80 rounded-2xl p-5 space-y-4">
        <label className="block text-xs font-black text-white font-['Tajawal'] flex items-center gap-2">
          <Sliders className="w-4 h-4 text-purple-400" />
          <span>تحديث أو إدخال مفتاح Gemini API جديد</span>
        </label>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <input
              type={showKey ? 'text' : 'password'}
              value={inputKey}
              onChange={(e) => setInputKey(e.target.value)}
              placeholder="ألصق مفتاحك هنا: AIzaSy..."
              className="w-full bg-slate-900 border border-slate-600 focus:border-purple-400 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-400 font-mono focus:outline-none transition-all pr-10"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer p-1"
            >
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Save Button */}
            <button
              onClick={handleSaveKey}
              disabled={isSaving || !inputKey.trim()}
              className="px-5 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-purple-900/40 cursor-pointer transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-amber-300" />}
              <span>حفظ وتفعيل</span>
            </button>

            {/* Test Connection Button */}
            <button
              onClick={() => handleTestConnection()}
              disabled={isTesting}
              className="px-5 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
            >
              {isTesting ? (
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
              ) : (
                <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
              )}
              <span>اختبار الاتصال</span>
            </button>

            {/* Reset / Revert Button */}
            {(keyStatus?.source === 'custom_admin' || keyStatus?.source === 'custom_override' || keyStatus?.hasCustomKey) && (
              <button
                onClick={handleResetToEnv}
                disabled={isSaving}
                title="إعادة التعيين لبيئة الخادم الافتراضية"
                className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition-all cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Action / Success / Error Message Banner */}
        {actionMessage && (
          <div className={`p-3.5 rounded-xl text-xs font-bold flex items-center gap-2.5 ${actionMessage.type === 'success' ? 'bg-emerald-950/70 border border-emerald-600/60 text-emerald-200' : 'bg-red-950/70 border border-red-600/60 text-red-200'}`}>
            {actionMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />}
            <span>{actionMessage.text}</span>
          </div>
        )}

        {/* Test Result Live Report */}
        {testResult && (
          <div className={`p-4 rounded-2xl border text-xs space-y-2 transition-all ${testResult.success ? 'bg-emerald-950/40 border-emerald-600/60 text-emerald-200' : 'bg-red-950/40 border-red-600/60 text-red-200'}`}>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                {testResult.success ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-400" />
                )}
                <span className="font-black text-sm">
                  {testResult.success ? 'نجح اختبار الاتصال بـ Gemini API!' : 'فشل اختبار الاتصال'}
                </span>
              </div>

              {testResult.latencyMs && (
                <div className="flex items-center gap-2 font-mono text-[11px] bg-slate-900/80 px-3 py-1 rounded-lg border border-slate-700">
                  <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                  <span>زمن الاستجابة: <strong className="text-amber-300">{testResult.latencyMs}ms</strong></span>
                </div>
              )}
            </div>

            <p className="text-xs leading-relaxed font-medium">
              {testResult.message || testResult.error}
            </p>

            {testResult.replyText && (
              <div className="pt-2 border-t border-emerald-800/40 flex items-center justify-between text-[11px] text-emerald-300/90 font-mono">
                <span>رد النموذج التجريبي: "{testResult.replyText}"</span>
                <span>النموذج: {testResult.model}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Helpful Instructions Footer */}
      <div className="bg-gradient-to-r from-purple-950/30 to-indigo-950/30 border border-purple-900/40 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-300">
        <div className="flex items-center gap-2.5">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            <strong>نصيحة يسرى سمايل:</strong> يمكنك توليد مفتاح API فوري مجاناً عبر حساب Google الخاص بك واستخدامه مباشرة دون أي بطاقة ائتمان.
          </span>
        </div>
        <a
          href="https://aistudio.google.com/app/apikey"
          target="_blank"
          rel="noopener noreferrer"
          className="text-purple-400 hover:text-purple-300 font-bold underline flex items-center gap-1 shrink-0"
        >
          <span>فتح Google AI Studio</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
};
