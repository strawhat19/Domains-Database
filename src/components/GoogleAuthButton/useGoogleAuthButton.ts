import { useState } from 'react';
import type { GoogleAuthButtonProps, GoogleAuthMode } from './types';

export const useGoogleAuthButton = ({ mode, disabled = false }: GoogleAuthButtonProps) => {
  const [noticeMode, setNoticeMode] = useState<GoogleAuthMode | null>(null);
  const label = mode === `signup` ? `Sign up with Google` : `Sign in with Google`;
  const message = noticeMode === mode ? mode === `signup` ? `Google Sign-Up Is Coming Soon` : `Google Sign-In Is Coming Soon` : ``;
  const showNotice = () => { if (!disabled) setNoticeMode(mode); };
  return { label, message, showNotice, dismissNotice: () => setNoticeMode(null) };
};
