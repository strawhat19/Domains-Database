import './styles.scss';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../shared/themeContext/useTheme';

const ProfileThemePreference = () => {
  const { theme, ready, error, setThemePreference } = useTheme();
  return <section id={`profile-theme-preference`} className={`profile-theme-preference`} aria-labelledby={`profile-theme-title`}>
    <h3 id={`profile-theme-title`} className={`profile-theme-title`}>{`Theme`}</h3>
    <div id={`profile-theme-value`} className={`profile-theme-value`}>
      <div role={`group`} id={`profile-theme-options`} className={`profile-theme-options`} aria-labelledby={`profile-theme-title`}>
        {[{ value: `light`, label: `Light`, Icon: Sun }, { value: `dark`, label: `Dark`, Icon: Moon }].map(({ value, label, Icon }) => <button key={value} type={`button`} disabled={!ready} id={`profile-theme-option-${value}`} className={`profile-theme-option`} aria-pressed={theme === value} onClick={() => setThemePreference(value as `light` | `dark`)}><Icon size={16} aria-hidden id={`profile-theme-icon-${value}`} className={`profile-theme-icon`} />{label}</button>)}
      </div>
      {error && <p role={`alert`} id={`profile-theme-error`} className={`profile-theme-notice`}>{error}</p>}
    </div>
  </section>;
};

export default ProfileThemePreference;
