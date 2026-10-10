import './styles.scss';
import { Plus } from 'lucide-react';
import Toast from '../Toast/index.web';
import { createPortal } from 'react-dom';
import { usePortfolioAddCollection, type PortfolioAddCollectionProps } from './usePortfolioAddCollection';

const PortfolioAddCollection = (props: PortfolioAddCollectionProps) => {
  const collection = usePortfolioAddCollection(props);
  const scope = `${props.idPrefix}-add-collection`;

  return (
    <div id={scope} className={`portfolio-add-collection`}>
      <form
        noValidate
        draggable={false}
        id={`${scope}-form`}
        onSubmit={collection.handleSubmit}
        onKeyDown={collection.handleKeyDown}
        onClick={event => event.stopPropagation()}
        onMouseDown={event => event.stopPropagation()}
        onPointerDown={event => event.stopPropagation()}
        className={`portfolio-add-collection-form portfolio-quick-add-row`}
        onDragStart={event => { event.preventDefault(); event.stopPropagation(); }}
      >
        <div id={`${scope}-trailing`} className={`portfolio-quick-add-trailing`}>
          <label
            id={`${scope}-label`}
            htmlFor={`${scope}-name`}
            className={`portfolio-add-collection-label portfolio-quick-add-label`}
          >
            <Plus size={12} aria-hidden={`true`} id={`${scope}-icon`} className={`portfolio-add-collection-icon`} />
            <span id={`${scope}-text`} className={`portfolio-add-collection-text`}>{`Add Collection`}</span>
          </label>
          <input
            type={`text`}
            maxLength={80}
            draggable={false}
            autoComplete={`off`}
            id={`${scope}-name`}
            value={collection.name}
            ref={collection.inputRef}
            aria-label={`Collection Name`}
            placeholder={`Collection name`}
            disabled={collection.unavailable}
            title={`Press Enter To Add Collection`}
            aria-invalid={Boolean(collection.error)}
            className={`portfolio-add-collection-input portfolio-quick-add-input`}
            aria-describedby={collection.error ? `${scope}-error` : undefined}
            onChange={event => collection.setName(event.target.value)}
          />
        </div>
      </form>
      {collection.error && typeof document !== `undefined` && createPortal(
        <div
          id={`${scope}-error`}
          className={`portfolio-add-collection-error-toast`}
          onClick={event => event.stopPropagation()}
          onKeyDown={event => event.stopPropagation()}
          onMouseDown={event => event.stopPropagation()}
          onPointerDown={event => event.stopPropagation()}
        >
          <Toast id={`${scope}-error-toast`} message={collection.error} onDismiss={() => collection.setName(collection.name)} />
        </div>,
        document.body,
        `${scope}-error-portal`,
      )}
    </div>
  );
};

export default PortfolioAddCollection;
