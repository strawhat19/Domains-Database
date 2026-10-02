import { useEffect, useState } from 'react';
import { Save, Trash2 } from 'lucide-react';
import type { CustomPortfolioGroup } from '../../shared/portfolioPreferences/types';

interface GroupEditorProps {
  count: number;
  group: CustomPortfolioGroup;
  onDelete: (id: string) => void;
  onRename: (id: string, name: string) => boolean;
}

const GroupEditor = ({ count, group, onDelete, onRename }: GroupEditorProps) => {
  const [name, setName] = useState(group.name);
  const [error, setError] = useState(``);
  const scope = `portfolio-custom-group-${group.id}`;
  useEffect(() => { setName(group.name); }, [group.name]);

  return (
    <form
      id={scope}
      className={`group-editor`}
      onSubmit={event => {
        event.preventDefault();
        setError(onRename(group.id, name) ? `` : `Enter a unique group name.`);
      }}
    >
      <label id={`${scope}-label`} htmlFor={`${scope}-name`} className={`group-editor-name-label`}>
        <span id={`${scope}-label-text`} className={`group-editor-label-text`}>
          {`Group name`}
        </span>
        <input
          value={name}
          maxLength={80}
          id={`${scope}-name`}
          aria-invalid={Boolean(error)}
          className={`group-editor-name-input`}
          onChange={event => setName(event.target.value)}
          aria-describedby={error ? `${scope}-error` : undefined}
        />
      </label>
      <span id={`${scope}-count`} className={`group-editor-count`}>
        {`${count} ${count === 1 ? `domain` : `domains`}`}
      </span>
      <button
        type={`submit`}
        id={`${scope}-save`}
        aria-label={`Rename ${group.name}`}
        className={`portfolio-button portfolio-button-quiet group-editor-button`}
      >
        <Save size={14} aria-hidden={`true`} id={`${scope}-save-icon`} className={`portfolio-button-icon`} />
        <span id={`${scope}-save-text`} className={`portfolio-button-text`}>
          {`Save`}
        </span>
      </button>
      <button
        type={`button`}
        id={`${scope}-delete`}
        onClick={() => onDelete(group.id)}
        aria-label={`Delete ${group.name}; domains become ungrouped`}
        className={`portfolio-button portfolio-button-quiet group-editor-delete group-editor-button`}
      >
        <Trash2 size={14} aria-hidden={`true`} id={`${scope}-delete-icon`} className={`portfolio-button-icon`} />
      </button>
      {error && (
        <p role={`alert`} id={`${scope}-error`} className={`group-controls-error`}>
          {error}
        </p>
      )}
    </form>
  );
};

export default GroupEditor;
