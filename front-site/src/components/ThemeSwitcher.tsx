import React, { useState, useEffect } from 'react';
import { Button } from 'react-bootstrap';

const ThemeSwitcher: React.FC = () => {
  const [theme, setTheme] = useState<string>(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) return savedTheme;
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-bs-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => (prev === 'light' ? 'dark' : 'light'));

  return (
    <Button
      variant={theme === 'light' ? 'dark' : 'light'}
      onClick={toggleTheme}
      className="position-fixed rounded-circle d-flex align-items-center justify-content-center"
      style={{ bottom: '20px', right: '20px', width: '50px', height: '50px', zIndex: 1050, boxShadow: '0 2px 8px rgba(0,0,0,0.2)', padding: 0 }}
      aria-label={`Cambiar a modo ${theme === 'light' ? 'oscuro' : 'claro'}`}
      title={`Cambiar a modo ${theme === 'light' ? 'oscuro' : 'claro'}`}
    >
      <i className={`fas ${theme === 'light' ? 'fa-moon' : 'fa-sun'}`} style={{ fontSize: '20px' }}></i>
    </Button>
  );
};

export default ThemeSwitcher;
