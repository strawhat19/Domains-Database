import type { TextProps } from 'react-native';
import { useCallback, useState } from 'react';

export const useResponsiveDomainHeading = (forceCompact = false) => {
  const [needsShortText, setNeedsShortText] = useState(false);
  const onTextLayout = useCallback<NonNullable<TextProps['onTextLayout']>>(event => {
    setNeedsShortText(event.nativeEvent.lines.length > 1);
  }, []);

  return { onTextLayout, compact: forceCompact || needsShortText };
};
