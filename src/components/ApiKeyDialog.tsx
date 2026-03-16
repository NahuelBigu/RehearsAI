import React, { useEffect, useState } from 'react';
import { Key } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function ApiKeyDialog({ children }: { children: React.ReactNode }) {
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    const checkKey = async () => {
      // If an API key is already provided via environment variables,
      // skip the selection dialog entirely.
      if (process.env.GEMINI_API_KEY) {
        setHasKey(true);
        return;
      }

      try {
        // @ts-ignore
        const isSelected = await window.aistudio?.hasSelectedApiKey();
        setHasKey(!!isSelected);
      } catch (e) {
        // Fallback if not running in AI Studio or API is unavailable
        setHasKey(true);
      }
    };
    checkKey();
  }, []);

  const handleConnect = async () => {
    try {
      // @ts-ignore
      await window.aistudio?.openSelectKey();
      // Assume success after triggering the dialog to avoid race conditions
      setHasKey(true);
    } catch (e) {
      console.error('Failed to open key selector:', e);
      // Reset state if it fails with "Requested entity was not found."
      if (e instanceof Error && e.message.includes('Requested entity was not found')) {
        setHasKey(false);
      }
    }
  };

  if (hasKey === null) {
    return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-400">{t('api.loading')}</div>;
  }

  if (!hasKey) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center shadow-2xl">
          <div className="w-16 h-16 bg-indigo-500/10 text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-6">
            <Key className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-semibold text-zinc-100 mb-3">{t('api.connect')}</h1>
          <p className="text-zinc-400 mb-8 leading-relaxed">
            {t('api.desc')}
            <br /><br />
            <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline">
              {t('api.billingInfo')}
            </a>
          </p>
          <button
            onClick={handleConnect}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3 px-4 rounded-xl transition-colors"
          >
            {t('api.selectKey')}
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
