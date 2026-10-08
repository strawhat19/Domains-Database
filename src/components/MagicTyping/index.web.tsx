import './styles.scss';
import { Sparkles } from 'lucide-react';
import type { MagicTypingProps } from './types';
import { useMagicTyping } from './useMagicTyping';

const MagicTyping = ({ suffix, label = `Imagine`, paused = false }: MagicTypingProps) => {
  const { text, animateCaret } = useMagicTyping(paused);

  return (
    <div id={`magic-typing-${suffix}`} className={`magic-typing`} aria-live={`off`}>
      <span id={`magic-typing-accessible-label-${suffix}`} className={`magic-typing-accessible-label`}>{`${label} a domain name`}</span>
      <span id={`magic-typing-content-${suffix}`} className={`magic-typing-content`} aria-hidden>
        <Sparkles id={`magic-typing-icon-${suffix}`} className={`magic-typing-icon`} size={12} />
        <span id={`magic-typing-label-${suffix}`} className={`magic-typing-label`}>{label}</span>
        <span id={`magic-typing-example-${suffix}`} className={`magic-typing-example`}>
          <span id={`magic-typing-domain-${suffix}`} className={`magic-typing-domain`}>{text}</span>
          <span id={`magic-typing-caret-${suffix}`} className={`magic-typing-caret${animateCaret ? ` magic-typing-caret-active` : ``}`} />
        </span>
      </span>
    </div>
  );
};

export default MagicTyping;
