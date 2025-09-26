import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  const buttonClass = isDark
    ? 'flex items-center gap-1 px-3 py-2 rounded-full border border-white/15 bg-white/10 text-white text-sm font-medium transition-all duration-200 hover:bg-white/20'
    : 'flex items-center gap-1 px-3 py-2 rounded-full border border-slate-300 bg-slate-200 text-slate-800 text-sm font-medium transition-all duration-200 hover:bg-slate-300';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className={buttonClass}
    >
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
      <span>{isDark ? 'Light' : 'Dark'} mode</span>
    </button>
  );
}
