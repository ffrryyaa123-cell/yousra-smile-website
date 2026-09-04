import React, { useEffect, useState } from 'react';
import {
  Key,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Eye,
  EyeOff,
  Zap,
  RotateCcw
} from 'lucide-react';
import { supabase } from '../services/adminAccount';

interface KeyStatus {
  hasKey: boolean;
  source: string;
  maskedKey: string;
  model?: string;
  canManageKey?: boolean;
}

interface TestResult {
  success: boolean;
  message?: string;
  error?: string;
  latencyMs?: number;
  model?: string;
}

interface GeminiApiKeyManagerProps {
  compact?: boolean;
  onKeyUpdated?: () => void;
}

const invokeAiMedia = async (body: Record<string, unknown>) => {
  const { data, error } = await supabase.functions.invoke('ai-product-media', { body });
  if (error) {
    let detail = error.message || '';
    try {
      const response = (error as any)?.context;
      if (response && typeof response.json === 'function') {
        const parsed = await response.json();
        detail = parsed?.error || parsed?.message || detail;
      }
    } catch {
      // keep connector error
    }
    throw new Error(detail || 'تعذر الوصول إلى خدمة الذكاء الاصطناعي.');
  }
  if (data?.error) throw new Error(data.error);
  return data;
};

export const GeminiApiKeyManager: React.FC<GeminiApiKeyManagerProps> = ({
  compact = false,
  onKeyUpdated
}) => {
  const [keyStatus, setKeyStatus] = useState<KeyStatus | null>(null);
  const [inputKey, setInputKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchStatus = async () => {
    setIsLoadingStatus(true);
    try {
      const data = await invokeAiMedia({ action: 'status' });
      setKeyStatus({
        hasKey: Boolean(data?.hasKey),
        source: data?.source || 'none',
        maskedKey: data?.maskedKey || '',
        model: data?.model || 'gemini-3.1-flash-image',
        canManageKey: Boolean(data?.canManageKey)
      });
    } catch (error: any) {
      setActionMessage({ type: 'error', text: error?.message || 'تعذر قراءة حالة Gemini.' });
    } finally {
      setIsLoadingStatus(false);
    }
  };

  useEffect(() => {
    void fetchStatus();
  }, []);

  const handleSaveKey = async () => {
    const key = inputKey.trim();
    if (!key) {
      setActionMessage({ type: 'error', text: 'أدخلي مفتاح Gemini API أولاً.' });
      return;
    }
    setIsSaving(true);
    setActionMessage(null);
    setTestResult(null);
    try {
      const data = await invokeAiMedia({ action: 'save_key', apiKey: key });
      setInputKey('');
      setActionMessage({ type: 'success', text: data?.message || 'تم حفظ مفتاح Gemini بشكل آمن.' });
      await fetchStatus();
      onKeyUpdated?.();
    } catch (error: any) {
      setActionMessage({ type: 'error', text: error?.message || 'فشل حفظ المفتاح.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    setIsSaving(true);
    setActionMessage(null);
    try {
      await invokeAiMedia({ action: 'reset_key' });
      setActionMessage({ type: 'success', text: 'تم حذف المفتاح المحفوظ من الإعدادات الآمنة.' });
      setTestResult(null);
      await fetchStatus();
      onKeyUpdated?.();
    } catch (error: any) {
      setActionMessage({ type: 'error', text: error?.message || 'تعذر حذف المفتاح.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTest = async () => {
    setIsTesting(true);
    setActionMessage(null);
    setTestResult(null);
    try {
      const data = await invokeAiMedia({ action: 'test' });
      setTestResult({
        success: Boolean(data?.success),
        message: data?.message,
        error: data?.error,
        latencyMs: data?.latencyMs,
        model: data?.model
      });
      await fetchStatus();
    } catch (error: any) {
      setTestResult({ success: false, error: error?.message || 'تعذر اختبار اتصال Gemini.' });
    } finally {
      setIsTesting(false);
    }
  };

  if (compact) {
    return (
      <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-4 shadow-lg text-white">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${keyStatus?.hasKey ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            <div>
              <div className="text-xs font-black">Gemini AI</div>
              <div className="text-[10px] text-slate-400">{keyStatus?.hasKey ? 'متصل وآمن' : 'المفتاح غير محفوظ'}</div>
            </div>
          </div>
          <button
            onClick={() => void handleTest()}
            disabled={isTesting || !keyStatus?.hasKey}
            className="px-2.5 py-1 bg-purple-600 hover:bg-purple-500 rounded-lg text-[11px] font-bold flex items-center gap-1 disabled:opacity-40"
          >
            {isTesting ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
            اختبار
          </button>
        </div>
        {testResult && (
          <div className={`mt-3 p-2 rounded-xl text-[11px] ${testResult.success ? 'bg-emerald-950 text-emerald-300' : 'bg-red-950 text-red-300'}`}>
            {testResult.success ? testResult.message : testResult.error}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-7 space-y-5 shadow-xl text-white">
      <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-purple-600 flex items-center justify-center">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-black">Gemini AI — إعدادات آمنة</h3>
            <p className="text-xs text-slate-400">المفتاح يُحفظ مشفّرًا على Supabase ولا يظهر في GitHub أو المتصفح.</p>
          </div>
        </div>
        <button onClick={() => void fetchStatus()} disabled={isLoadingStatus} className="p-2 rounded-xl bg-slate-800 disabled:opacity-40">
          <RefreshCw className={`w-4 h-4 ${isLoadingStatus ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="rounded-2xl border border-slate-700 bg-slate-950/70 p-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <ShieldCheck className={`w-5 h-5 ${keyStatus?.hasKey ? 'text-emerald-400' : 'text-amber-400'}`} />
          <div>
            <div className="text-sm font-bold">{keyStatus?.hasKey ? 'Gemini متصل' : 'Gemini غير مهيأ'}</div>
            <div className="text-[11px] text-slate-400">
              {keyStatus?.hasKey ? `${keyStatus.maskedKey} • ${keyStatus.model}` : 'أضيفي المفتاح مرة واحدة من حساب المالك.'}
            </div>
          </div>
        </div>
        {keyStatus?.hasKey && (
          <button onClick={() => void handleTest()} disabled={isTesting} className="px-3 py-2 rounded-xl bg-purple-600 text-xs font-bold disabled:opacity-40">
            {isTesting ? 'جاري الاختبار...' : 'اختبار الاتصال'}
          </button>
        )}
      </div>

      {keyStatus?.canManageKey && (
        <div className="space-y-3">
          <label className="text-xs font-bold text-slate-300">Gemini API Key</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type={showKey ? 'text' : 'password'}
                value={inputKey}
                onChange={e => setInputKey(e.target.value)}
                placeholder="Paste Gemini API key"
                autoComplete="off"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-3 pr-10 text-sm outline-none focus:border-purple-500"
              />
              <button type="button" onClick={() => setShowKey(v => !v)} className="absolute right-3 top-3 text-slate-400">
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <button
              onClick={() => void handleSaveKey()}
              disabled={isSaving || !inputKey.trim()}
              className="px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-black disabled:opacity-40"
            >
              {isSaving ? 'حفظ...' : 'حفظ وتفعيل'}
            </button>
          </div>

          {keyStatus?.hasKey && keyStatus.source === 'secure_database' && (
            <button
              onClick={() => void handleReset()}
              disabled={isSaving}
              className="text-xs text-amber-300 flex items-center gap-1.5 disabled:opacity-40"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              حذف المفتاح المحفوظ
            </button>
          )}
        </div>
      )}

      {actionMessage && (
        <div className={`p-3 rounded-xl text-xs flex items-start gap-2 ${actionMessage.type === 'success' ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-800' : 'bg-red-950/70 text-red-300 border border-red-800'}`}>
          {actionMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {testResult && (
        <div className={`p-3 rounded-xl text-xs ${testResult.success ? 'bg-emerald-950/60 text-emerald-300' : 'bg-red-950/60 text-red-300'}`}>
          <div className="font-bold">{testResult.success ? 'الاتصال يعمل' : 'فشل الاتصال'}</div>
          <div className="mt-1">{testResult.message || testResult.error}</div>
          {testResult.latencyMs !== undefined && <div className="mt-1 text-[10px] opacity-80">{testResult.latencyMs}ms • {testResult.model}</div>}
        </div>
      )}
    </div>
  );
};
