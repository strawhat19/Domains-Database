import './styles.scss';
import { ChevronUp } from 'lucide-react';
import type { ScrollToTopProps } from './types';

const ScrollToTop = ({ visible, onPress, rightInset = 20, bottomInset = 0 }: ScrollToTopProps) => (
  <button
    type={`button`}
    onClick={onPress}
    disabled={!visible}
    id={`scroll-to-top`}
    title={`Scroll To Top`}
    aria-hidden={!visible}
    tabIndex={visible ? 0 : -1}
    aria-label={`Scroll To Top`}
    className={`scroll-to-top${visible ? ` is-visible` : ``}`}
    style={{
      right: `max(${rightInset}px, env(safe-area-inset-right, 0px))`,
      bottom: `calc(20px + ${bottomInset}px + env(safe-area-inset-bottom, 0px))`,
    }}
  >
    <ChevronUp
      size={19}
      aria-hidden={`true`}
      id={`scroll-to-top-icon`}
      className={`scroll-to-top-icon`}
    />
  </button>
);

export default ScrollToTop;
