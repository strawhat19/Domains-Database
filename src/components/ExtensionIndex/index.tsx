import './styles.scss';
import { ArrowUpRight } from 'lucide-react';
import { extensionStacks } from './extensionIndex';

const ExtensionIndex = () => (
  <div
    aria-hidden={`true`}
    id={`extension-index`}
    className={`extension-index`}
  >
    <div id={`extension-index-header`} className={`extension-index-header`}>
      <span id={`extension-index-label`} className={`extension-index-label`}>
        {`THE EXTENSION INDEX`}
      </span>
      <ArrowUpRight
        size={17}
        id={`extension-index-arrow`}
        className={`extension-index-arrow`}
      />
    </div>
    <div id={`extension-index-stacks`} className={`extension-index-stacks`}>
      {extensionStacks.map((stack, index) => (
        <div
          key={index}
          id={`extension-index-stack-${index}`}
          className={`extension-index-stack`}
        >
          {stack.map(extension => {
            const scope = `extension-record-${extension.slice(1)}`;
            return (
              <div key={extension} id={scope} className={`extension-record`}>
                <span id={`${scope}-label`} className={`extension-record-label`}>
                  {extension}
                </span>
                <span id={`${scope}-dot`} className={`extension-record-dot`} />
              </div>
            );
          })}
        </div>
      ))}
    </div>
    <div id={`extension-index-footer`} className={`extension-index-footer`}>
      <span id={`extension-index-caption`} className={`extension-index-caption`}>
        {`EVERY ADDRESS IN ORDER.`}
      </span>
      <span id={`extension-index-symbol`} className={`extension-index-symbol`}>
        {`[ DD ]`}
      </span>
    </div>
  </div>
);

export default ExtensionIndex;
