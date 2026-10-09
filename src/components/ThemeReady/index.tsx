import type { PropsWithChildren } from 'react';
import { useTheme } from '../../shared/themeContext/useTheme';
import { useAfterPaint } from '../../shared/common/useAfterPaint';

const ThemeReady = ({ children }: PropsWithChildren) => {
  const { ready } = useTheme();
  const painted = useAfterPaint(ready);
  return painted ? <>{children}</> : null;
};

export default ThemeReady;
