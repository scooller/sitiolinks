import React, { useState, useEffect } from 'react';
import { Button } from 'react-bootstrap';

interface ThemeSwitcherProps {
  inline?: boolean;
  className?: string;
  showLabel?: boolean;
}

const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ inline = true, className = '', showLabel = false }) => {
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
  const isLight = theme === 'light';
  const labelText = `Modo ${isLight ? 'oscuro' : 'claro'}`;

  if (inline) {
    return (
      <Button
        variant="outline-secondary"
        onClick={toggleTheme}
        className={`d-inline-flex align-items-center justify-content-center text-white border-0 ${className}`}
        style={{ minWidth: '44px', minHeight: '44px', padding: '0.5rem' }}
        aria-label={`Cambiar a modo ${isLight ? 'oscuro' : 'claro'}`}
        title={`Cambiar a modo ${isLight ? 'oscuro' : 'claro'}`}
      >
        <i className={`fas ${isLight ? 'fa-moon' : 'fa-sun'}`} style={{ fontSize: '18px' }} aria-hidden="true"></i>
        {showLabel && <span className="ms-2">{labelText}</span>}
      </Button>
    );
  }

  return (
    <Button
      variant={isLight ? 'dark' : 'light'}
      onClick={toggleTheme}
      className={`position-fixed rounded-circle d-flex align-items-center justify-content-center ${className}`}
      style={{ bottom: '20px', right: '20px', width: '50px', height: '50px', zIndex: 1050, boxShadow: '0 2px 8px rgba(0,0,0,0.2)', padding: 0 }}
      aria-label={`Cambiar a modo ${isLight ? 'oscuro' : 'claro'}`}
      title={`Cambiar a modo ${isLight ? 'oscuro' : 'claro'}`}
    >
      <i className={`fas ${isLight ? 'fa-moon' : 'fa-sun'}`} style={{ fontSize: '20px' }}></i>
    </Button>
  );
};

export default ThemeSwitcher;
