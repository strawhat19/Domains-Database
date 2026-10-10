import './styles.scss';
import { Eye, EyeOff } from 'lucide-react';
import { useDomainVisibilityButton } from './useDomainVisibilityButton';

interface DomainVisibilityButtonProps {
  id: string;
  domainId: string;
  disabled?: boolean;
  domainName: string;
}

const DomainVisibilityButton = ({ id, domainId, disabled, domainName }: DomainVisibilityButtonProps) => {
  const visibility = useDomainVisibilityButton(domainId, disabled);
  const VisibilityIcon = visibility.hidden ? EyeOff : Eye;
  const label = `${visibility.hidden ? `Show` : `Hide`} ${domainName}`;

  return (
    <button
      id={id}
      type={`button`}
      title={label}
      draggable={false}
      aria-label={label}
      onClick={visibility.toggle}
      disabled={visibility.disabled}
      aria-pressed={!visibility.hidden}
      className={`domain-visibility-toggle`}
    >
      <VisibilityIcon size={14} aria-hidden={`true`} id={`${id}-icon`} className={`domain-visibility-toggle-icon`} />
    </button>
  );
};

export default DomainVisibilityButton;
