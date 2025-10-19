import { useState, useEffect } from "react";
import { User, Save } from "lucide-react";
import { useProAlert } from "../../context/ProAlertContext";
import { apiFetch } from "../../utils/api";

interface DashboardSettingsProps {
  user: any;
  onUserUpdate: () => void;
}

const DashboardSettings = ({ user, onUserUpdate }: DashboardSettingsProps) => {
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const proAlert = useProAlert();

  useEffect(() => {
    if (user) {
      setDisplayName(user.name || "");
      setAvatarUrl(user.avatar || "");
      setIsLoading(false);
    }
  }, [user]);

  const handleSave = async () => {
    if (!displayName.trim()) {
      proAlert.error("Name cannot be empty");
      return;
    }

    try {
      setIsSaving(true);
      const res = await apiFetch("/api/auth/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: displayName, avatar: avatarUrl }),
      });

      if (res.ok) {
        const updated = await res.json();
        setDisplayName(updated.name || displayName);
        setAvatarUrl(updated.avatar || avatarUrl);
        proAlert.success("Profile updated successfully");
        onUserUpdate();
      } else {
        const error = await res.json();
        proAlert.error(error.message || "Failed to update profile");
      }
    } catch (err) {
      console.error("Error updating profile:", err);
      proAlert.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-slate-900/50 backdrop-blur-lg border border-white/10 rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-white mb-6">Profile Settings</h2>
          <div className="space-y-6">
            {/* Name Loading Skeleton */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Display Name
              </label>
              <div className="w-full h-12 bg-white/5 rounded-lg animate-pulse"></div>
            </div>

            {/* Avatar Loading Skeleton */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Avatar URL
              </label>
              <div className="w-full h-12 bg-white/5 rounded-lg animate-pulse"></div>
            </div>

            {/* Avatar Preview Loading Skeleton */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Avatar Preview
              </label>
              <div className="w-24 h-24 rounded-full bg-white/5 animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-slate-900/50 backdrop-blur-lg border border-white/10 rounded-2xl p-8">
        <h2 className="text-2xl font-bold text-white mb-6">Profile Settings</h2>
        
        <div className="space-y-6">
          {/* Display Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Display Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                placeholder="Enter your name"
              />
            </div>
          </div>

          {/* Avatar URL */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Avatar URL
            </label>
            <input
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
              placeholder="https://example.com/avatar.jpg"
            />
          </div>

          {/* Avatar Preview */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Avatar Preview
            </label>
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Avatar preview"
                className="w-24 h-24 rounded-full object-cover border-2 border-white/10"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://via.placeholder.com/96?text=Invalid";
                }}
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center text-white text-2xl font-bold">
                {displayName.charAt(0).toUpperCase() || "?"}
              </div>
            )}
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-purple-500 text-white px-6 py-3 rounded-lg hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-300 hover:scale-105 transform disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {isSaving ? (
              <>
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save size={18} />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Account Information */}
      <div className="mt-6 bg-slate-900/50 backdrop-blur-lg border border-white/10 rounded-2xl p-8">
        <h3 className="text-xl font-bold text-white mb-4">Account Information</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Email:</span>
            <span className="text-white">{user?.email || "N/A"}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Member since:</span>
            <span className="text-white">
              {user?.createdAt
                ? new Date(user.createdAt).toLocaleDateString()
                : "N/A"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardSettings;
