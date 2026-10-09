import type { EnvironmentFilePickerProps } from './types';

const EnvironmentFilePicker = ({ scope, disabled, reading, onFiles }: EnvironmentFilePickerProps) => {
  return (
    <div id={`connection-env-file-wrap-${scope}`} className={`connection-env-file-wrap`}>
      <label id={`connection-env-file-label-${scope}`} className={`connection-env-file-label`} htmlFor={`connection-env-file-${scope}`}>
        {reading ? `Reading .env File…` : `Choose A .env File`}
      </label>
      <input
        type={`file`}
        accept={`.env,.local,.development,.production,.txt,text/plain`}
        disabled={disabled || reading}
        id={`connection-env-file-${scope}`}
        className={`connection-env-file`}
        aria-describedby={`connection-env-description-${scope}`}
        onChange={event => { const files = Array.from(event.target.files ?? []); event.target.value = ``; onFiles(files); }}
      />
    </div>
  );
};
export default EnvironmentFilePicker;
