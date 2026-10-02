import './styles.scss';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../shared/themeContext/useTheme';

const ThemeToggle = () => {
  const { isDark, toggleTheme } = useTheme();
  const Icon = isDark ? Sun : Moon;
  const label = isDark ? `Switch to light mode` : `Switch to dark mode`;

  return (
    <button
      type={`button`}
      title={label}
      id={`header-theme-toggle`}
      aria-label={label}
      aria-pressed={isDark}
      onClick={toggleTheme}
      className={`header-theme-toggle`}
    >
      <Icon
        size={18}
        aria-hidden={`true`}
        id={`header-theme-toggle-icon`}
        className={`header-theme-toggle-icon`}
      />
    </button>
  );
};

export default ThemeToggle;
