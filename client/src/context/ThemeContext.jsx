import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [highContrast, setHighContrast] = useState(localStorage.getItem('highContrast') === 'true');

  useEffect(() => {
    const root = window.document.documentElement;
    
    // Manage Dark Mode
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Manage High Contrast
    if (highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    localStorage.setItem('theme', theme);
    localStorage.setItem('highContrast', highContrast);
  }, [theme, highContrast]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');
  const toggleHighContrast = () => setHighContrast(prev => !prev);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, highContrast, toggleHighContrast, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
