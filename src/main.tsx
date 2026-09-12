import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import { supabase } from './lib/supabase.ts';
import './index.css';

const isOAuthPopup =
  typeof window !== 'undefined' &&
  Boolean(window.opener) &&
  window.name === 'speedtype_google_oauth';

if (isOAuthPopup) {
  const root = ReactDOM.createRoot(document.getElementById('root')!);
  root.render(
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-black text-white font-mono p-6 text-center select-none">
      <span className="text-4xl mb-3 animate-pulse">⚡</span>
      <h1 className="font-black tracking-widest text-sm text-emerald-400">
        COMPLETING AUTHENTICATION...
      </h1>
      <p className="text-xs text-zinc-400 mt-2 tracking-wider">
        Linking Google profile and establishing session...
      </p>
    </div>
  );

  async function handlePopupAuth() {
    try {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');

      if (code) {
        // Exchange PKCE authorization code for session tokens
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          console.error('[OAuthPopup] Code exchange failed:', error);
          root.render(
            <div className="h-screen w-screen flex flex-col items-center justify-center bg-black text-red-400 font-mono p-6 text-center select-none">
              <span className="text-3xl mb-2">⚠️</span>
              <p className="font-bold text-sm">AUTHENTICATION FAILED</p>
              <p className="text-xs text-zinc-400 mt-2">{error.message}</p>
            </div>
          );
          return;
        }
      } else {
        // Fallback for hash fragments or pre-parsed session
        await supabase.auth.getSession();
      }

      // Notify parent window that session is successfully written to storage
      try {
        window.opener?.postMessage({ type: 'SPEEDTYPE_OAUTH_SUCCESS' }, window.location.origin);
      } catch (e) {
        console.warn('[OAuthPopup] Failed to postMessage to opener:', e);
      }

      root.render(
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-black text-white font-mono p-6 text-center select-none">
          <span className="text-4xl mb-3">⚡</span>
          <h1 className="font-black tracking-widest text-sm text-emerald-400">
            GOOGLE HANDSHAKE VERIFIED
          </h1>
          <p className="text-xs text-zinc-400 mt-2 tracking-wider">
            Returning to arena...
          </p>
        </div>
      );

      // Close popup smoothly
      setTimeout(() => {
        try {
          window.close();
        } catch (e) {
          console.warn('[OAuthPopup] Auto-close completed');
        }
      }, 500);
    } catch (err: any) {
      console.error('[OAuthPopup] Unexpected auth error:', err);
    }
  }

  handlePopupAuth();
} else {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
