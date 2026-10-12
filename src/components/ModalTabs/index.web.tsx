import './styles.scss';
import type { ModalTabsProps } from './types';
import { useModalTabs } from './useModalTabs';

const ModalTabs = <Tab extends string,>({ id, value, label, options, onChange, disabled = false, autoFocus = false }: ModalTabsProps<Tab>) => {
  const tabs = useModalTabs({ id, value, label, options, onChange, disabled });

  return (
    <div id={`${id}-tabs`} role={`tablist`} aria-label={label} className={`modal-tabs`}>
      {options.map(({ id: tab, label: tabLabel, Icon, count }) => (
        <button
          key={tab}
          role={`tab`}
          type={`button`}
          disabled={disabled}
          id={`${id}-tab-${tab}`}
          aria-selected={value === tab}
          tabIndex={value === tab ? 0 : -1}
          aria-controls={`${id}-panel-${tab}`}
          ref={button => tabs.setButton(tab, button)}
          data-autofocus={autoFocus && value === tab && !disabled || undefined}
          onKeyDown={event => tabs.onKeyDown(event, tab)}
          onClick={() => { if (value !== tab) onChange(tab); }}
          className={`modal-tab${value === tab ? ` modal-tab-active` : ``}`}
        >
          <Icon size={15} aria-hidden={`true`} id={`${id}-tab-${tab}-icon`} className={`modal-tab-icon`} />
          <span id={`${id}-tab-${tab}-text`} className={`modal-tab-text`}>{tabLabel}</span>
          {count !== undefined && <span id={`${id}-tab-${tab}-count`} className={`modal-tab-count`}>{count}</span>}
        </button>
      ))}
    </div>
  );
};

export default ModalTabs;
