import './styles.scss';
import { Layers3, ArrowDownRight } from 'lucide-react';

const Hero = () => (
  <section id={`landing-hero`} className={`landing-hero`} aria-labelledby={`hero-title`}>
    <div id={`hero-heading-group`} className={`hero-heading-group`}>
      <p id={`hero-eyebrow`} className={`hero-eyebrow`}>
        <span id={`hero-eyebrow-dot`} className={`hero-eyebrow-dot`} aria-hidden />
        {`A HOME FOR EVERY DOMAIN`}
      </p>
      <h1 id={`hero-title`} className={`hero-title`}>
        {`Every domain.`}
        <br id={`hero-title-break`} className={`hero-title-break`} />
        <em id={`hero-title-accent`} className={`hero-title-accent`}>
          {`One quiet place.`}
        </em>
      </h1>
    </div>
    <div id={`hero-aside`} className={`hero-aside`}>
      <span id={`hero-index`} className={`hero-index`}>
        {`01 / A LITTLE CLARITY`}
      </span>
      <p id={`hero-description`} className={`hero-description`}>
        {`Your domains may live in different accounts. Your overview shouldn’t. Keep every name, renewal, and registrar beautifully in order.`}
      </p>
      <div id={`hero-promise`} className={`hero-promise`}>
        <Layers3 id={`hero-promise-icon`} className={`hero-promise-icon`} size={16} strokeWidth={1.5} aria-hidden />
        <span id={`hero-promise-text`} className={`hero-promise-text`}>
          {`Different registrars. One clear view.`}
        </span>
        <ArrowDownRight id={`hero-promise-arrow`} className={`hero-promise-arrow`} size={20} strokeWidth={1.3} aria-hidden />
      </div>
    </div>
  </section>
);

export default Hero;
