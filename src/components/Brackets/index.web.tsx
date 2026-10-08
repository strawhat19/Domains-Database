import './styles.scss';
import type { BracketsProps } from './types';
import { ArrowUpRight } from 'lucide-react';
import { bracketStacks } from './brackets';

const Brackets = ({ suffix = `brackets` }: BracketsProps) => (
  <div
    aria-hidden={`true`}
    id={`brackets-${suffix}`}
    className={`brackets`}
  >
    <div id={`brackets-header-${suffix}`} className={`brackets-header`}>
      <span id={`brackets-label-${suffix}`} className={`brackets-label`}>
        {`THE EXTENSION INDEX`}
      </span>
      <ArrowUpRight
        size={17}
        className={`brackets-arrow`}
        id={`brackets-arrow-${suffix}`}
      />
    </div>
    <div id={`brackets-stacks-${suffix}`} className={`brackets-stacks`}>
      {bracketStacks.map((stack, index) => (
        <div
          key={index}
          className={`brackets-stack`}
          id={`brackets-stack-${suffix}-${index}`}
        >
          {stack.map(extension => {
            const scope = `brackets-record-${suffix}-${extension.slice(1)}`;
            return (
              <div key={extension} id={scope} className={`brackets-record`}>
                <span id={`${scope}-label`} className={`brackets-record-label`}>
                  {extension}
                </span>
                <span id={`${scope}-dot`} className={`brackets-record-dot`} />
              </div>
            );
          })}
        </div>
      ))}
    </div>
    <div id={`brackets-footer-${suffix}`} className={`brackets-footer`}>
      <span id={`brackets-caption-${suffix}`} className={`brackets-caption`}>
        {`EVERY ADDRESS IN ORDER.`}
      </span>
      <span id={`brackets-symbol-${suffix}`} className={`brackets-symbol`}>
        {`[ DD ]`}
      </span>
    </div>
  </div>
);

export type { BracketsProps } from './types';
export default Brackets;
