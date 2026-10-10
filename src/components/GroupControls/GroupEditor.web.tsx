import { useEffect, useState } from 'react';
import { Save, Trash2 } from 'lucide-react';
import type { CustomPortfolioGroup } from '../../shared/portfolioPreferences/types';
import { usePortfolioPreferences } from '../../shared/portfolioPreferences/usePortfolioPreferences';
import { normalizePortfolioName, isPortfolioNameTaken } from '../../shared/portfolioPreferences/names';

interface GroupEditorProps {
  count: number;
  group: CustomPortfolioGroup;
  onDelete: (id: string) => boolean;
  onRename: (id: string, name: string) => boolean;
}

const GroupEditor = ({ count, group, onDelete, onRename }: GroupEditorProps) => {
  const preferences = usePortfolioPreferences();
  const [name, setName] = useState(group.name);
  const [error, setError] = useState(``);
  const scope = `portfolio-custom-group-${group.id}`;
  const deleteDestination = preferences.collections.find(collection => collection.id === group.collectionId)?.name ?? `Database`;
  useEffect(() => { setName(group.name); }, [group.name]);

  return (
    <form
      id={scope}
      className={`group-editor`}
      onSubmit={event => {
        event.preventDefault();
        if (preferences.loading) { setError(`Portfolio Is Loading — Try Again Shortly`); return; }
        const trimmedName = name.trim();
        if (!trimmedName) { setError(`Enter A Group Name`); return; }
        if (trimmedName.length > 80) { setError(`Group Name Must Be 80 Characters Or Fewer`); return; }
        if (normalizePortfolioName(trimmedName) === `ungrouped`) { setError(`Ungrouped Is A Reserved Group Name`); return; }
        if (isPortfolioNameTaken(preferences, trimmedName, { groupId: group.id })) {
          setError(`A Collection Or Group With This Name Already Exists`);
          return;
        }
        setError(onRename(group.id, trimmedName) ? `` : `Could Not Rename Group`);
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
          onChange={event => { setName(event.target.value); setError(``); }}
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
      {!group.isApp && (
        <button
          type={`button`}
          id={`${scope}-delete`}
          disabled={preferences.loading}
          onClick={() => setError(onDelete(group.id) ? `` : `Could Not Delete Group`)}
          aria-label={`Delete ${group.name}; Domains Move To ${deleteDestination}`}
          className={`portfolio-button portfolio-button-quiet group-editor-delete group-editor-button`}
        >
          <Trash2 size={14} aria-hidden={`true`} id={`${scope}-delete-icon`} className={`portfolio-button-icon`} />
        </button>
      )}
      {error && (
        <p role={`alert`} id={`${scope}-error`} className={`group-controls-error`}>
          {error}
        </p>
      )}
    </form>
  );
};

export default GroupEditor;
