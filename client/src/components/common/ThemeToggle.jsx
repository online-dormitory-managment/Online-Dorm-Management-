import React from 'react';
import { FaMoon, FaSun } from 'react-icons/fa';
import { useTheme } from '../../context/ThemeContext';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 border-2"
      style={{
        background: isDark
          ? 'linear-gradient(135deg, #1e293b, #334155)'
          : 'linear-gradient(135deg, #ffffff, #f1f5f9)',
        borderColor: isDark ? '#475569' : '#e2e8f0',
      }}
    >
      {isDark ? (
        <FaSun className="w-5 h-5 text-amber-400" />
      ) : (
        <FaMoon className="w-5 h-5 text-indigo-600" />
      )}
    </button>
  );
}
