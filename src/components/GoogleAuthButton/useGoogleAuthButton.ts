import { useState } from 'react';
import type { GoogleAuthButtonProps, GoogleAuthMode } from './types';

export const useGoogleAuthButton = ({ mode, onPress, disabled = false }: GoogleAuthButtonProps) => {
  const [noticeMode, setNoticeMode] = useState<GoogleAuthMode | null>(null);
  const label = mode === `signup` ? `Sign up with Google` : `Sign in with Google`;
  const message = noticeMode === mode ? `Google Sign-In Is Not Connected` : ``;
  const press = () => {
    if (disabled) return;
    if (onPress) { setNoticeMode(null); void onPress(); }
    else setNoticeMode(mode);
  };
  return { label, press, message, dismissNotice: () => setNoticeMode(null) };
};
