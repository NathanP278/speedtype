import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import { supabase } from './lib/supabase.ts';
import './index.css';

const isOAuthPopup =
  typeof window !== 'undefined' &&
  (window.name === 'speedtype_google_oauth' ||
    (Boolean(window.opener) && window.name === 'speedtype_google_oauth'));

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

      let session = null;
      if (code) {
        // Exchange PKCE authorization code for session tokens
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          console.warn('[OAuthPopup] Code exchange note:', error.message);
          const { data: sData } = await supabase.auth.getSession();
          session = sData?.session || null;
        } else {
          session = data?.session || null;
        }
      }

      if (!session) {
        const { data: sData } = await supabase.auth.getSession();
        session = sData?.session || null;
      }

      if (!session) {
        // Retry briefly in case GoTrueClient internal detectSessionInUrl is finishing
        await new Promise((resolve) => setTimeout(resolve, 600));
        const { data: retryData } = await supabase.auth.getSession();
        session = retryData?.session || null;
      }

      if (!session) {
        root.render(
          <div className="h-screen w-screen flex flex-col items-center justify-center bg-black text-red-400 font-mono p-6 text-center select-none">
            <span className="text-3xl mb-2">⚠️</span>
            <p className="font-bold text-sm">AUTHENTICATION INCOMPLETE</p>
            <p className="text-xs text-zinc-400 mt-2">
              Could not retrieve session tokens. Please close this window and retry.
            </p>
          </div>
        );
        return;
      }

      const authPayload = {
        type: 'SPEEDTYPE_OAUTH_SUCCESS',
        session: {
          access_token: session.access_token,
          refresh_token: session.refresh_token,
        },
      };

      // 1. BroadcastChannel (cross-window reliable)
      try {
        if (typeof BroadcastChannel !== 'undefined') {
          const bc = new BroadcastChannel('speedtype_auth_channel');
          bc.postMessage(authPayload);
          bc.close();
        }
      } catch (e) {
        console.warn('[OAuthPopup] BroadcastChannel dispatch failed:', e);
      }

      // 2. window.opener postMessage
      try {
        if (window.opener) {
          window.opener.postMessage(authPayload, '*');
        }
      } catch (e) {
        console.warn('[OAuthPopup] postMessage to opener failed:', e);
      }

      // 3. localStorage session bridge (survives tab disconnects)
      try {
        localStorage.setItem(
          'speedtype_oauth_session_bridge',
          JSON.stringify({
            access_token: session.access_token,
            refresh_token: session.refresh_token,
            timestamp: Date.now(),
          })
        );
      } catch (e) {
        console.warn('[OAuthPopup] localStorage bridge write failed:', e);
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
