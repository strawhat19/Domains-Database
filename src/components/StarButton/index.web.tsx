import './styles.scss';
import { Star } from 'lucide-react';
import type { StarButtonProps } from './types';

const StarButton = ({ id, label, starred, disabled, onPress, size = 28 }: StarButtonProps) => (
  <button
    id={id}
    title={label}
    type={`button`}
    draggable={false}
    disabled={disabled}
    aria-label={label}
    aria-pressed={starred}
    style={{ width: size, height: size }}
    className={`star-button${starred ? ` star-button-starred` : ``}`}
    onMouseDown={event => event.stopPropagation()}
    onPointerDown={event => event.stopPropagation()}
    onClick={event => { event.stopPropagation(); onPress(); }}
    onDragStart={event => { event.preventDefault(); event.stopPropagation(); }}
  >
    <Star
      size={16}
      aria-hidden={`true`}
      id={`${id}-icon`}
      className={`star-button-icon`}
      fill={starred ? `currentColor` : `none`}
    />
  </button>
);

export default StarButton;
