import { Plus, LogOut } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
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

  const handleSidebarItemClick = (itemId: string) => {
    if (itemId === "community") {
      navigate("/community");
    } else {
      onTabChange(itemId);
    }
  };

  const handleLogout = async () => {
    const success = await logoutRequest();

    if (success) {
      onLogoutSuccess();
      navigate("/signIn");
    } else {
      proAlert.error("Unable to log out. Please try again.");
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

      <button
        type="button"
        onClick={handleLogout}
        className={`bg-gradient-to-r m-16 from-cyan-500 to-purple-500 text-white px-6 py-2 rounded-full hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-300 hover:scale-105 transform flex items-center justify-center gap-2 ${
          isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        }`}
      >
        <LogOut size={18} />
        Log Out
      </button>
    </aside>
  );
};

export default DashboardSidebar;
