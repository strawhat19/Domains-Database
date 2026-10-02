import './styles.scss';
import { Upload } from 'lucide-react';
import { useCsvDropZone, type CsvDropZoneOptions } from './useCsvDropZone';

export interface CsvDropZoneProps extends CsvDropZoneOptions {
  id: string;
  onBrowse: () => void;
}

const CsvDropZone = ({ id, disabled, importing, onBrowse, onFiles }: CsvDropZoneProps) => {
  const { blocked, dragging, onDrop, onDragOver, onDragLeave, onDragEnter } = useCsvDropZone({
    onFiles,
    disabled,
    importing,
  });
  const className = `csv-drop-zone${dragging ? ` csv-drop-zone-active` : ``}${blocked ? ` csv-drop-zone-disabled` : ``}${importing ? ` csv-drop-zone-importing` : ``}`;
  const title = importing ? `Importing CSV…` : dragging ? `Release to import CSV` : `Drop a CSV here`;

  return (
    <section
      id={id}
      onDrop={onDrop}
      className={className}
      aria-busy={importing}
      aria-disabled={blocked}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDragEnter={onDragEnter}
      aria-label={`Import domain CSV`}
      aria-describedby={`${id}-description`}
    >
      <span id={`${id}-symbol`} className={`csv-drop-zone-symbol`}>
        <Upload
          size={32}
          id={`${id}-icon`}
          aria-hidden={`true`}
          className={`csv-drop-zone-icon`}
        />
      </span>
      <div id={`${id}-copy`} className={`csv-drop-zone-copy`}>
        <p
          role={`status`}
          id={`${id}-title`}
          aria-live={`polite`}
          className={`csv-drop-zone-title`}
        >
          {title}
        </p>
        <p id={`${id}-description`} className={`csv-drop-zone-description`}>
          {`GoDaddy, Namecheap, or Hostinger exports · One CSV up to 5 MB`}
        </p>
      </div>
      <button
        type={`button`}
        disabled={blocked}
        id={`${id}-browse`}
        onClick={onBrowse}
        className={`csv-drop-zone-browse`}
      >
        <Upload
          size={14}
          aria-hidden={`true`}
          id={`${id}-browse-icon`}
          className={`csv-drop-zone-browse-icon`}
        />
        <span id={`${id}-browse-text`} className={`csv-drop-zone-browse-text`}>
          {`Browse CSV`}
        </span>
      </button>
    </section>
  );
};

export default CsvDropZone;
