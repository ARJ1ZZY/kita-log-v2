import React, { createContext, useContext, useState } from 'react';
import { getTheme } from '../styles/designSystem';

const ThemeContext = createContext({
  darkMode: false,
  toggleDarkMode: () => {},
  t: getTheme(false),
});

export const ThemeProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(false);
  const toggleDarkMode = () => setDarkMode(prev => !prev);
  const t = getTheme(darkMode);

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode, t }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);