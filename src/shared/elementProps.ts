import { Platform } from 'react-native';

export const elementProps = (className: string, suffix?: string) => ({
  testID: suffix ? `${className}-${suffix}` : className,
  nativeID: suffix ? `${className}-${suffix}` : className,
  ...(Platform.OS === `web` ? { className, dataSet: { class: className } } : {}),
});

export const decorativeIconProps = Platform.OS === `web` ? { 'aria-hidden': true as const } : { accessible: false };
