/**
 * Completely purges all browser storage, cookies, caches, and Supabase tokens
 * to reset the client to an absolute ground-zero clean state.
 */
export function purgeLocalDataAndCookies(): void {
  try {
    // 1. Explicitly clear all speedtype keys (to guarantee no residual mock/guest data)
    const keysToPurge = [
      'speedtype_user_calibration',
      'speedtype_economy_balance',
      'speedtype_economy_unlocked',
      'speedtype_economy_equipped',
      'speedtype_last_run',
      'speedtype_personal_best',
      'speedtype_rivalry_dossier',
      'speedtype_cloud_leaderboard_cache',
      'speedtype_profile',
      'speedtype_auth_local_user'
    ];
    keysToPurge.forEach(key => localStorage.removeItem(key));
    
    // Clear all localStorage as a fallback
    localStorage.clear();

    // 2. Clear all sessionStorage
    sessionStorage.clear();

    // 3. Clear all browser cookies across root paths and domains
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i];
      const eqPos = cookie.indexOf('=');
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
      
      // Expire cookie on current host, subdomains, and root path
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.${window.location.hostname}`;
    }

    console.info('[StoragePurge] Successfully cleared all localStorage, sessionStorage, and cookies.');
  } catch (err) {
    console.error('[StoragePurge] Error during purge:', err);
  }
}
