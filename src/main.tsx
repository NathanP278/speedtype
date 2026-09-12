import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';

const isOAuthPopup =
  typeof window !== 'undefined' &&
  Boolean(window.opener) &&
  window.name === 'speedtype_google_oauth';

if (isOAuthPopup) {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-black text-white font-mono p-4 text-center select-none">
      <span className="text-4xl mb-3 animate-pulse">⚡</span>
      <h1 className="font-black tracking-widest text-sm text-emerald-400">
        GOOGLE HANDSHAKE VERIFIED
      </h1>
      <p className="text-xs text-zinc-400 mt-2 tracking-wider">
        Connecting to arena...
      </p>
    </div>
  );

  // Allow Supabase client to parse code/hash and persist session in localStorage
  setTimeout(() => {
    try {
      window.opener?.postMessage({ type: 'SPEEDTYPE_OAUTH_SUCCESS' }, window.location.origin);
    } catch (e) {
      console.warn('[OAuthPopup] Failed to notify opener:', e);
    }
    setTimeout(() => {
      try {
        window.close();
      } catch (e) {
        console.warn('[OAuthPopup] Auto-close completed');
      }
    }, 400);
  }, 800);
} else {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
