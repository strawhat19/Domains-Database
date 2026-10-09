import './styles.scss';
import { heroExtensions } from './content';
import StackPillShape from '../StackPillShape';

const HeroDomainStack = () => (
  <div aria-hidden id={`hero-domain-stack`} className={`hero-domain-stack`}>
    {heroExtensions.map(extension => (
      <div key={extension} id={`hero-extension-tile-${extension}`} className={`hero-extension-tile`}>
        <StackPillShape sharp id={`hero-extension-${extension}`} />
        <span id={`hero-extension-label-${extension}`} className={`hero-extension-label`}>{`.${extension}`}</span>
        <span id={`hero-extension-dot-${extension}`} className={`hero-extension-dot`} />
      </div>
    ))}
  </div>
);

export default HeroDomainStack;
