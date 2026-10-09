export type GoogleAuthMode = `signin` | `signup`;

export interface GoogleAuthButtonProps {
  mode: GoogleAuthMode;
  disabled?: boolean;
  onPress?: () => void | Promise<void>;
}
