export interface EnvironmentFilePickerProps {
  scope: string;
  reading: boolean;
  disabled: boolean;
  onFiles: (files: File[]) => void;
}

export interface ConnectionEnvironmentImportProps {
  scope: string;
  error: string;
  contents: string;
  reading: boolean;
  disabled: boolean;
  canImportServer: boolean;
  onLoad: () => void;
  onClose: () => void;
  onServer: () => void;
  onFiles: (files: File[]) => void;
  onChange: (contents: string) => void;
}
