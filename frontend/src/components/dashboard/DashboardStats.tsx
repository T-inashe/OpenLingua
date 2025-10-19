import { BookOpen, Award, TrendingUp } from "lucide-react";
import type { UserStats } from "../../types/dashboard.types";

interface DashboardStatsProps {
  stats: UserStats;
  isVisible: boolean;
}

const DashboardStats = ({ stats, isVisible }: DashboardStatsProps) => {
  return (
    <div
      className={`grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 transition-all duration-1000 delay-400 ${
        isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
      }`}
    >
      <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10 hover:border-cyan-500/30 transition-all duration-300">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm font-medium">Courses Enrolled</p>
            <p className="text-white text-2xl font-bold">{stats.coursesEnrolled}</p>
          </div>
          <div className="w-12 h-12 bg-cyan-500/20 rounded-lg flex items-center justify-center">
            <BookOpen className="text-cyan-400" size={24} />
          </div>
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10 hover:border-purple-500/30 transition-all duration-300">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm font-medium">Courses Created</p>
            <p className="text-white text-2xl font-bold">{stats.coursesCreated}</p>
          </div>
          <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
            <Award className="text-purple-400" size={24} />
          </div>
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10 hover:border-green-500/30 transition-all duration-300">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm font-medium">Avg Progress</p>
            <p className="text-white text-2xl font-bold">{stats.avgProgress}</p>
          </div>
          <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
            <TrendingUp className="text-green-400" size={24} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardStats;
