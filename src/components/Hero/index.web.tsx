import './styles.scss';
import ExtensionIndex from '../ExtensionIndex';
import { ArrowUpRight } from 'lucide-react';

const Hero = () => (
  <section
    id={`landing-hero`}
    className={`landing-hero`}
    aria-labelledby={`hero-title`}
  >
    <div id={`hero-heading-group`} className={`hero-heading-group`}>
      <p id={`hero-eyebrow`} className={`hero-eyebrow`}>
        <span
          aria-hidden={`true`}
          id={`hero-eyebrow-marker`}
          className={`hero-eyebrow-marker`}
        />
        {`PERSONAL DOMAIN REGISTRY`}
      </p>
      <h1 id={`hero-title`} className={`hero-title`}>
        {`Your domains.`}
        <br id={`hero-title-break`} className={`hero-title-break`} />
        <span id={`hero-title-accent`} className={`hero-title-accent`}>
          {`Under control.`}
        </span>
      </h1>
      <p id={`hero-description`} className={`hero-description`}>
        {`Keep track of every name, registrar, and renewal. A domain portfolio you can actually keep up with.`}
      </p>
      <a
        href={`/domains`}
        id={`hero-portfolio-link`}
        className={`hero-portfolio-link`}
      >
        <span id={`hero-portfolio-text`} className={`hero-portfolio-text`}>
          {`Browse your portfolio`}
        </span>
        <ArrowUpRight
          size={18}
          aria-hidden={`true`}
          id={`hero-portfolio-icon`}
          className={`hero-portfolio-icon`}
        />
      </a>
    </div>
    <ExtensionIndex />
  </section>
);

export default Hero;
