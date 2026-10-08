import './styles.scss';
import StarButton from '../StarButton/index.web';
import { useDomainStar } from './useDomainStar';
import type { DomainStarButtonProps } from './types';

const DomainStarButton = ({ id, size, domainId, disabled, domainName }: DomainStarButtonProps) => {
  const star = useDomainStar(domainId, disabled);

  return (
    <span id={`${id}-control`} className={`domain-star-control`}>
      <StarButton
        id={id}
        size={size}
        starred={star.starred}
        disabled={star.disabled}
        onPress={() => void star.toggle()}
        label={`${star.starred ? `Unstar` : `Star`} ${domainName}`}
      />
      {star.error && (
        <span role={`alert`} id={`${id}-error`} className={`domain-star-error`}>
          {star.error}
        </span>
      )}
    </span>
  );
};

export default DomainStarButton;
