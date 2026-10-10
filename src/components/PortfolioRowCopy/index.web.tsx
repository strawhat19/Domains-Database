import './styles.scss';
import { createPortal } from 'react-dom';
import { Copy, Check } from 'lucide-react';
import PortfolioCopyOptions from '../PortfolioCopyOptions/index.web';
import { usePortfolioRowCopy, type PortfolioRowCopyProps } from './usePortfolioRowCopy';

const PortfolioRowCopy = (props: PortfolioRowCopyProps) => {
  const state = usePortfolioRowCopy(props);
  const { id, label, focusFallbackId, iconSize = 14, treeAvailable = true } = props;
  const CopyIcon = state.copied ? Check : Copy;
  const buttonLabel = state.copying ? `Copying ${label}…` : state.copied ? `Copied ${label}` : `Copy ${label}`;

  return (
    <>
      <button
        id={id}
        type={`button`}
        title={buttonLabel}
        ref={state.buttonRef}
        draggable={false}
        aria-label={buttonLabel}
        aria-busy={state.copying}
        aria-expanded={state.open}
        aria-haspopup={`dialog`}
        data-focus-fallback={focusFallbackId}
        aria-controls={`${id}-options-dialog`}
        disabled={state.unavailable || state.copying}
        onMouseDown={event => event.stopPropagation()}
        onPointerDown={event => event.stopPropagation()}
        onKeyDown={event => event.stopPropagation()}
        onClick={event => { event.stopPropagation(); state.openCopyOptions(); }}
        onDragStart={event => { event.preventDefault(); event.stopPropagation(); }}
        onContextMenu={event => { event.preventDefault(); event.stopPropagation(); }}
        className={`portfolio-row-copy-action${state.copied ? ` portfolio-row-copy-action-copied` : ``}`}
      >
        <CopyIcon size={iconSize} aria-hidden={`true`} id={`${id}-icon`} className={`portfolio-row-copy-icon`} />
      </button>
      <span role={`status`} aria-live={`polite`} aria-atomic={`true`} id={`${id}-status`} className={`portfolio-row-copy-status`}>
        {state.copied ? state.copyMessage : ``}
      </span>
      {state.open && typeof document !== `undefined` && createPortal(
        <div
          id={`${id}-portal`}
          className={`portfolio-row-copy-modal`}
          onClick={event => event.stopPropagation()}
          onDrop={event => event.stopPropagation()}
          onDragEnd={event => event.stopPropagation()}
          onDragOver={event => event.stopPropagation()}
          onDragStart={event => event.stopPropagation()}
          onDragLeave={event => event.stopPropagation()}
          onMouseDown={event => event.stopPropagation()}
          onPointerDown={event => event.stopPropagation()}
          onContextMenu={event => event.stopPropagation()}
        >
          <PortfolioCopyOptions
            label={label}
            idPrefix={id}
            count={state.count}
            busy={state.copying}
            onCopy={state.copyDomains}
            treeAvailable={treeAvailable}
            onClose={state.closeCopyOptions}
            error={state.copyError ? state.copyMessage : undefined}
            hiddenOptions={state.showHiddenOptions ? { included: state.includeHidden, onChange: state.changeIncludeHidden } : undefined}
          />
        </div>, document.body,
      )}
    </>
  );
};

export default PortfolioRowCopy;
