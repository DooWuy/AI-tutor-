import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export interface ThemeToggleProps {
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '' }) => {
  const { resolvedTheme, toggleTheme } = useTheme();

  return (
    <button
      id="global-theme-toggle"
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleTheme();
      }}
      aria-label={resolvedTheme === 'dark' ? 'Chuyển sang giao diện Sáng' : 'Chuyển sang giao diện Tối'}
      title={resolvedTheme === 'dark' ? 'Chuyển sang giao diện Sáng' : 'Chuyển sang giao diện Tối'}
      className={`p-2 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-all active:scale-95 cursor-pointer flex items-center justify-center ${className}`}
    >
      {resolvedTheme === 'dark' ? (
        <Sun size={18} className="text-amber-400 stroke-[2.2]" />
      ) : (
        <Moon size={18} className="text-on-surface-variant stroke-[2.2]" />
      )}
    </button>
  );
};
