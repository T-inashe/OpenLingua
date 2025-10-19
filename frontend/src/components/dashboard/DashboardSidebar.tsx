import { Plus, LogOut } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import type { SidebarItem, User } from "../../types/dashboard.types";
import { logoutRequest } from "../../utils/logout";
import { useProAlert } from "../../context/ProAlertContext";

interface DashboardSidebarProps {
  activeTab: string;
  sidebarItems: SidebarItem[];
  user: User | null;
  isVisible: boolean;
  onTabChange: (tabId: string) => void;
  onLogoutSuccess: () => void;
}

const DashboardSidebar = ({
  activeTab,
  sidebarItems,
  user,
  isVisible,
  onTabChange,
  onLogoutSuccess,
}: DashboardSidebarProps) => {
  const navigate = useNavigate();
  const proAlert = useProAlert();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleSidebarItemClick = (itemId: string) => {
    if (itemId === "community") {
      navigate("/community");
    } else {
      onTabChange(itemId);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    const success = await logoutRequest();

    if (success) {
      onLogoutSuccess();
      navigate("/signIn");
    } else {
      proAlert.error("Unable to log out. Please try again.");
      setIsLoggingOut(false);
    }
  };

  return (
    <aside
      className={`w-64 min-h-screen bg-slate-900/50 backdrop-blur-lg border-r border-white/10 transition-all duration-1000 delay-200 ${
        isVisible ? "translate-x-0 opacity-100" : "-translate-x-full opacity-0"
      }`}
    >
      <div className="p-6">
        <nav className="space-y-2">
          {sidebarItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => handleSidebarItemClick(item.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-200 hover:bg-white/5 ${
                  activeTab === item.id
                    ? "bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-white border border-cyan-500/30"
                    : "text-gray-400 hover:text-white"
                }`}
                style={{ transitionDelay: `${index * 50}ms` }}
              >
                <Icon size={18} />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Quick Actions */}
        <div className="mt-8 p-4 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 rounded-lg border border-cyan-500/20">
          <h3 className="text-white font-semibold mb-3">Quick Actions</h3>
          {user && (
            <Link to={`/create/${user.id}`}>
              <button className="w-full flex items-center space-x-2 bg-gradient-to-r from-cyan-500 to-purple-500 text-white px-3 py-2 rounded-lg hover:shadow-lg transition-all duration-200 hover:scale-105">
                <Plus size={16} />
                <span className="text-sm font-medium">Create Course</span>
              </button>
            </Link>
          )}
        </div>
      </div>

      {/* Logout Button */}
      <div className="px-6 pb-6 mt-8">
        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}
          className={`w-full flex items-center justify-center gap-2 bg-gradient-to-r from-red-500/10 to-red-600/10 hover:from-red-500/20 hover:to-red-600/20 text-red-400 hover:text-red-300 border border-red-500/30 hover:border-red-400/50 px-4 py-3 rounded-lg transition-all duration-300 hover:scale-105 transform disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
          style={{ transitionDelay: "400ms" }}
        >
          {isLoggingOut ? (
            <>
              <svg
                className="animate-spin h-5 w-5 text-red-400"
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
              <span className="font-medium">Logging out...</span>
            </>
          ) : (
            <>
              <LogOut size={18} />
              <span className="font-medium">Log Out</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
};

export default DashboardSidebar;
