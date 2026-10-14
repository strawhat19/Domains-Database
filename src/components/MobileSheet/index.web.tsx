import './styles.scss';
import type { useMobileSheet } from './useMobileSheet';

interface MobileSheetHandleProps {
  id: string;
  sheet: ReturnType<typeof useMobileSheet>;
}

const MobileSheetHandle = ({ id, sheet }: MobileSheetHandleProps) => (
  <button
    type={`button`}
    id={`${id}-sheet-handle`}
    {...sheet.handleProps}
    className={`mobile-sheet-handle`}
    aria-label={`Close Panel Or Drag Down To Dismiss`}
  >
    <span aria-hidden={`true`} id={`${id}-sheet-grip`} className={`mobile-sheet-grip`} />
  </button>
);

export default MobileSheetHandle;
