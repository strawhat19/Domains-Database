import { Platform } from 'react-native';

export const elementProps = (className: string, suffix?: string) => ({
  testID: suffix ? `${className}-${suffix}` : className,
  nativeID: suffix ? `${className}-${suffix}` : className,
  ...(Platform.OS === `web` ? { className, dataSet: { class: className } } : {}),
});
