import type { featureDefinitions } from '../features';

export interface FeatureDetailsProps {
  onClose: () => void;
  feature: typeof featureDefinitions[number];
  roles: {
    error: string;
    ready: boolean;
    saving: boolean;
    disabled: boolean;
    selected: readonly string[] | null;
    onToggle: (value: string) => void;
    options: readonly { value: string; label: string }[];
  };
}
