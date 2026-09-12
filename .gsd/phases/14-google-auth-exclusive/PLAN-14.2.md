---
phase: 14
plan: 2
wave: 2
depends_on:
  - 14.1
files_modified:
  - src/auth/useAuth.ts
  - src/lib/supabase.ts
  - index.html
autonomous: true
must_haves:
  truths:
    - "Google OAuth opens in a clean centered popup window instead of navigating the main application tab away"
    - "OAuth request includes prompt: 'select_account' so Google always shows the account chooser and never silently auto-selects without user consent"
    - "Popup window cleanly communicates session establishment back to the parent window and closes automatically"
    - "Graceful fallback to full-page redirect is preserved if the browser aggressively blocks popups"
  artifacts:
    - "src/auth/useAuth.ts with robust popup OAuth trigger and cross-window sync"
    - "index.html with popup completion detector that closes the child window and notifies parent"
---

# Plan 14.2: Google OAuth Popup Handshake & Account Selection

<objective>
Fix the broken Google login experience where the page abruptly redirected or automatically bounced without showing a Google account selector popup.
1. Configure `signInWithGoogle` to use `skipBrowserRedirect: true` and open a centered popup window (`window.open`) targeting the Google OAuth consent flow.
2. Force Google account selection by passing `queryParams: { prompt: 'select_account', access_type: 'offline' }`, preventing silent automatic bypass on machines with active Google sessions.
3. Handle popup lifecycle: detect when OAuth completes, synchronize the session via Supabase's `onAuthStateChange` / `localStorage` listener, and close the popup window automatically.
4. Provide fallback to direct redirect if `window.open` is blocked by the browser.

Purpose: Deliver the expected, modern Google Sign-In popup experience where the user explicitly chooses their Google account.
Output: Responsive, popup-driven Google OAuth handshake.
</objective>

<context>
Load for context:
- src/auth/useAuth.ts
- src/lib/supabase.ts
- index.html
</context>

<tasks>

<task type="auto">
  <name>Implement Google OAuth popup flow with forced account selection in useAuth</name>
  <files>src/auth/useAuth.ts</files>
  <action>
    1. In `src/auth/useAuth.ts`:
       - Refactor `signInWithGoogle`:
         Call `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin, skipBrowserRedirect: true, queryParams: { prompt: 'select_account', access_type: 'offline' } } })`.
       - If `data?.url` is returned:
         Calculate centered coordinates (`width = 520`, `height = 640`, calculate `top` and `left` from `window.screen`).
         Open popup: `const popup = window.open(data.url, 'google_oauth_popup', 'width=520,height=640,top=...,left=...,status=no,menubar=no,toolbar=no')`.
       - If popup is blocked (`popup === null` or `popup.closed`):
         Fall back to `window.location.assign(data.url)`.
       - Set an interval to poll `popup.closed` or listen for postMessage/storage event to re-check active session.
       - AVOID any mock user fallback when offline; if Supabase fails or is not configured, return explicit error message.
  </action>
  <verify>npx tsc --noEmit</verify>
  <done>signInWithGoogle launches centered popup with prompt: 'select_account' and listens for session resolution.</done>
</task>

<task type="auto">
  <name>Add popup return handshake handler to notify parent and auto-close</name>
  <files>index.html, src/auth/useAuth.ts</files>
  <action>
    1. In `index.html` or early initialization script:
       - Check if `window.opener && window.name === 'google_oauth_popup'`.
       - If OAuth code or hash tokens are present in the URL, wait briefly for Supabase client to parse them or postMessage `{ type: 'SPEEDTYPE_AUTH_SUCCESS' }` to `window.opener`.
       - Call `window.close()` to close the popup automatically upon return.
    2. In `src/auth/useAuth.ts`:
       - Listen for `'message'` event for `SPEEDTYPE_AUTH_SUCCESS` to trigger immediate `getSession()` and profile fetch.
  </action>
  <verify>npx tsc --noEmit</verify>
  <done>Popup closes automatically after Google OAuth handshake and updates parent session state instantly.</done>
</task>

</tasks>

<verification>
After all tasks, verify:
- [ ] signInWithGoogle uses skipBrowserRedirect: true
- [ ] prompt: 'select_account' is included in queryParams
- [ ] Popup auto-close and parent communication handlers are in place
- [ ] npx tsc --noEmit passes with 0 errors
</verification>

<success_criteria>
- [ ] Google OAuth launches in a popup window
- [ ] Account selection is guaranteed
- [ ] Parent window receives authenticated session without page reload
</success_criteria>
