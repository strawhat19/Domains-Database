import './styles.scss';
import type { HeaderCountBadgeProps } from './types';

const HeaderCountBadge = ({ id, count, loading, className }: HeaderCountBadgeProps) => (
  <span id={id} aria-hidden className={`header-count-badge${loading ? ` header-count-badge-loading` : ``}${className ? ` ${className}` : ``}`}>
    {loading ? null : count}
  </span>
);

export default HeaderCountBadge;
