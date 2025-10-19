import { Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ThemeToggle from "../layout/ThemeToggle";
import type { User } from "../../types/dashboard.types";

interface DashboardHeaderProps {
  user: User | null;
  userInitials: string;
  isVisible: boolean;
}

const DashboardHeader = ({ user, userInitials, isVisible }: DashboardHeaderProps) => {
  const navigate = useNavigate();

  return (
    <header
      className={`sticky top-0 z-50 bg-slate-900/60 backdrop-blur-lg border-b border-white/10 transition-all duration-1000 ${
        isVisible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
      }`}
    >
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate("/dashboard")}
            type="button"
            className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent hover:opacity-80 transition-opacity"
          >
            OpenLingua
          </button>

          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <button className="relative p-2 text-gray-400 hover:text-white transition-colors duration-200">
              <Bell size={20} />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-500 rounded-full"></span>
            </button>
            <button className="flex items-center space-x-3 bg-white/5 rounded-full px-4 py-2 border border-white/10 hover:border-white/20 transition-all duration-200">
              {user ? (
                <img
                  src={user.avatar}
                  alt="avatar"
                  referrerPolicy="no-referrer"
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                  {userInitials || "?"}
                </div>
              )}
              {user && (
                <span className="text-white text-sm font-medium">{user.name}</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
