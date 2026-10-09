import './styles.scss';
import type { EnvironmentFileDropZoneProps } from './types';
import { useEnvironmentFileDropZone } from './useEnvironmentFileDropZone';

const EnvironmentFileDropZone = ({ scope, kind, disabled, onFiles, children }: EnvironmentFileDropZoneProps) => {
  const state = useEnvironmentFileDropZone({ onFiles, disabled });
  const className = `environment-file-drop environment-file-drop-${kind}${state.dragging ? ` environment-file-drop-active` : ``}${disabled ? ` environment-file-drop-disabled` : ``}`;
  return (
    <div
      onDrop={state.onDrop}
      className={className}
      aria-disabled={disabled || undefined}
      onDragOver={state.onDragOver}
      onDragLeave={state.onDragLeave}
      onDragEnter={state.onDragEnter}
      id={`environment-file-drop-${kind}-${scope}`}
    >
      {children}
    </div>
  );
};

export default EnvironmentFileDropZone;
