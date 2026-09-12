import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
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

  function handlePopupAuth() {
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));

      const code = searchParams.get('code');
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      const errorMsg =
        searchParams.get('error_description') ||
        searchParams.get('error') ||
        hashParams.get('error_description') ||
        hashParams.get('error');

      if (errorMsg) {
        root.render(
          <div className="h-screen w-screen flex flex-col items-center justify-center bg-black text-red-400 font-mono p-6 text-center select-none">
            <span className="text-3xl mb-2">⚠️</span>
            <p className="font-bold text-sm">AUTHENTICATION REJECTED</p>
            <p className="text-xs text-zinc-300 mt-2 max-w-sm">{errorMsg}</p>
          </div>
        );
        return;
      }

      if (code) {
        const payload = {
          type: 'SPEEDTYPE_OAUTH_CODE',
          code,
        };

        // 1. BroadcastChannel (cross-window communication)
        try {
          if (typeof BroadcastChannel !== 'undefined') {
            const bc = new BroadcastChannel('speedtype_auth_channel');
            bc.postMessage(payload);
            bc.close();
          }
        } catch (e) {
          console.warn('[OAuthPopup] BroadcastChannel dispatch failed:', e);
        }

        // 2. window.opener postMessage
        try {
          if (window.opener) {
            window.opener.postMessage(payload, '*');
          }
        } catch (e) {
          console.warn('[OAuthPopup] postMessage to opener failed:', e);
        }

        // 3. localStorage code bridge
        try {
          localStorage.setItem(
            'speedtype_oauth_code_bridge',
            JSON.stringify({
              code,
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
        }, 400);
        return;
      }

      if (accessToken && refreshToken) {
        const payload = {
          type: 'SPEEDTYPE_OAUTH_SESSION',
          session: {
            access_token: accessToken,
            refresh_token: refreshToken,
          },
        };

        try {
          if (typeof BroadcastChannel !== 'undefined') {
            const bc = new BroadcastChannel('speedtype_auth_channel');
            bc.postMessage(payload);
            bc.close();
          }
        } catch (e) {}

        try {
          if (window.opener) {
            window.opener.postMessage(payload, '*');
          }
        } catch (e) {}

        try {
          localStorage.setItem(
            'speedtype_oauth_session_bridge',
            JSON.stringify({
              access_token: accessToken,
              refresh_token: refreshToken,
              timestamp: Date.now(),
            })
          );
        } catch (e) {}

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
          } catch (e) {}
        }, 400);
        return;
      }

      root.render(
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-black text-red-400 font-mono p-6 text-center select-none">
          <span className="text-3xl mb-2">⚠️</span>
          <p className="font-bold text-sm">AUTHENTICATION INCOMPLETE</p>
          <p className="text-xs text-zinc-400 mt-2">
            No authentication code returned. Please close this window and retry.
          </p>
        </div>
      );
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
