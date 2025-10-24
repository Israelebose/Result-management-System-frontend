import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from './context/ContextProvider';

const  ModeToggle =()=> {
  const { theme, toggleTheme } = useTheme();

  return (
   <>
    <button
      onClick={toggleTheme}
      className="p-4 rounded-full bg-primary-blue hover:bg-primary-blue-hover dark:bg-textColor1 dark:text-secondary_bg dark:hover:bg-primary_bg dark:hover:text-white  text-white duration-200  w-fit top-5 z-40"
      data-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {theme === 'dark' ? (
        <Sun className="max-md:h-5 max-md:w-5" />
      ) : (
        <Moon className="max-md:h-5 max-md:w-5 " />
      )}
      
      <span className="sr-only">Toggle theme</span>
    </button>
   </>
  );
}
export default ModeToggle