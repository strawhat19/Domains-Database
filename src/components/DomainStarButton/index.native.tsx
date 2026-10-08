import { Alert } from 'react-native';
import StarButton from '../StarButton/index.native';
import { useDomainStar } from './useDomainStar';
import type { DomainStarButtonProps } from './types';

const DomainStarButton = ({ id, size, domainId, disabled, domainName }: DomainStarButtonProps) => {
  const star = useDomainStar(domainId, disabled);
  const toggle = async () => {
    const error = await star.toggle();
    if (error) Alert.alert(`Unable To Update Star`, error);
  };

  return (
    <StarButton
      id={id}
      size={size}
      starred={star.starred}
      disabled={star.disabled}
      onPress={() => void toggle()}
      label={`${star.starred ? `Unstar` : `Star`} ${domainName}`}
    />
  );
};

export default DomainStarButton;
