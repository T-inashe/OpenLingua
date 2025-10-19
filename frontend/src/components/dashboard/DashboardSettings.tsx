import { useState, useEffect } from 'react';
import ThemeToggle from '../layout/ThemeToggle';
import { useTheme } from '../../context/ThemeContext';
import { useProAlert } from '../../context/ProAlertContext';
import { apiFetch } from '../../utils/api';

export default function DashboardSettings() {
  const { theme } = useTheme();
  const proAlert = useProAlert();

  const [displayName, setDisplayName] = useState<string>('');
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [emailNotifications, setEmailNotifications] = useState<boolean>(() => {
    try {
      const raw = localStorage.getItem('pref_email_notifications');
      return raw ? JSON.parse(raw) : true;
    } catch (e) { return true; }
  });

  useEffect(() => {
    // Attempt to populate from /api/auth/me if available
    (async () => {
      try {
        const res = await apiFetch('/api/auth/me', { method: 'GET' });
        if (res.ok) {
          const data = await res.json();
          setDisplayName(data.name || '');
          setAvatarUrl(data.avatar || '');
        }
      } catch (err) {
        // ignore
      }
    })();
  }, []);

  const [languagePref, setLanguagePref] = useState<string>(() => {
    try { return localStorage.getItem('pref_language') || 'en'; } catch { return 'en'; }
  });

  const [timezone, setTimezone] = useState<string>(() => {
    try { return localStorage.getItem('pref_timezone') || Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { return 'UTC'; }
  });

  const savePreferences = async () => {
    try {
      localStorage.setItem('pref_email_notifications', JSON.stringify(emailNotifications));
      localStorage.setItem('pref_language', languagePref);
      localStorage.setItem('pref_timezone', timezone);
      proAlert.success('Preferences saved locally');
    } catch (err) {
      proAlert.error('Failed to save preferences');
    }
  };

  const saveProfile = async () => {
    try {
      // Try backend update
      const res = await apiFetch('/api/auth/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: displayName, avatar: avatarUrl })
      });

      if (res.ok) {
        const updated = await res.json();
        // keep UI in sync with server response
        setDisplayName(updated.name || displayName);
        setAvatarUrl(updated.avatar || avatarUrl);
        proAlert.success('Profile updated');
        // Notify app to refresh user data
        try { window.dispatchEvent(new CustomEvent('user:updated')); } catch (e) {}
      } else {
        // Fallback: save to localStorage and inform user
        localStorage.setItem('profile_name', displayName);
        localStorage.setItem('profile_avatar', avatarUrl);
        proAlert.info('Profile saved locally (server update not available)');
      }
    } catch (err) {
      // Fallback to local storage
      localStorage.setItem('profile_name', displayName);
      localStorage.setItem('profile_avatar', avatarUrl);
      proAlert.info('Profile saved locally (server update failed)');
    }
  };

  return (
    <div className="p-6 bg-white/5 dark:bg-white/5 rounded-lg border border-white/10">
      <h2 className="text-white font-semibold text-xl mb-4">Settings</h2>

      <section className="mb-6">
        <h3 className="text-gray-300 mb-2">Theme</h3>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <span className="text-sm text-gray-400">Current: {theme}</span>
        </div>
      </section>

      <section className="mb-6">
        <h3 className="text-gray-300 mb-2">Profile</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-center">
          <div>
            <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Display name" className="w-full px-3 py-2 rounded-lg bg-white/5 text-white" />
            <div className="text-xs text-gray-400 mt-1">Your display name shown to other users</div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center overflow-hidden">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="text-sm text-gray-400">No avatar</div>
              )}
            </div>
            <input value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="Avatar URL" className="w-full px-3 py-2 rounded-lg bg-white/5 text-white" />
          </div>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <button onClick={saveProfile} className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-lg">Save profile</button>
          <button onClick={() => { setDisplayName(''); setAvatarUrl(''); localStorage.removeItem('profile_name'); localStorage.removeItem('profile_avatar'); proAlert.info('Profile cleared locally'); }} className="px-3 py-2 bg-white/5 text-white rounded-lg">Clear</button>
        </div>
      </section>

      <section className="mb-6">
        <h3 className="text-gray-300 mb-2">Preferences & Notifications</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="flex items-center gap-3">
            <input type="checkbox" checked={emailNotifications} onChange={(e) => setEmailNotifications(e.target.checked)} className="w-4 h-4" />
            <span className="text-sm text-gray-400">Email notifications for course updates</span>
          </label>

          <div>
            <label className="text-sm text-gray-400 block mb-1">Language</label>
            <select value={languagePref} onChange={(e) => setLanguagePref(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-white/5 text-white">
              <option value="en">English</option>
              <option value="zu">Zulu</option>
              <option value="xh">isiXhosa</option>
              <option value="sn">Shona</option>
            </select>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-sm text-gray-400 block mb-1">Timezone</label>
            <input value={timezone} onChange={(e) => setTimezone(e.target.value)} placeholder="e.g., Africa/Johannesburg" className="w-full px-3 py-2 rounded-lg bg-white/5 text-white" />
          </div>
        </div>

        <div className="mt-3">
          <button onClick={savePreferences} className="px-4 py-2 bg-white/5 text-white rounded-lg">Save preferences</button>
        </div>
      </section>

      <section>
        <h3 className="text-gray-300 mb-2">Privacy</h3>
        <p className="text-sm text-gray-400">You can manage whether your profile is discoverable by others. Currently this option is local-only.</p>
      </section>
    </div>
  );
}
