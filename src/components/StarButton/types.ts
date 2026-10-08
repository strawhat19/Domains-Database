export interface StarButtonProps {
  id: string;
  label: string;
  size?: number;
  starred: boolean;
  disabled?: boolean;
  onPress: () => void;
}
