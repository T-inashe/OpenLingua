import { Search } from "lucide-react";

interface CourseFiltersProps {
  searchQuery: string;
  difficultyFilter: string;
  onSearchChange: (query: string) => void;
  onDifficultyChange: (difficulty: string) => void;
  isVisible: boolean;
}

const CourseFilters = ({
  searchQuery,
  difficultyFilter,
  onSearchChange,
  onDifficultyChange,
  isVisible,
}: CourseFiltersProps) => {
  return (
    <div
      className={`mb-8 transition-all duration-1000 delay-500 ${
        isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
      }`}
    >
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={20}
          />
          <input
            type="text"
            placeholder="Search courses..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-white/5 backdrop-blur-lg border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all duration-200"
          />
        </div>

        <div className="flex space-x-3">
          <select
            value={difficultyFilter}
            onChange={(e) => onDifficultyChange(e.target.value)}
            className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50 transition-all duration-200"
          >
            <option value="">All Levels</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default CourseFilters;
