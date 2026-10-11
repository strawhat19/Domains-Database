import { Platform, Share } from 'react-native';

export const exportReport = async (name: string, report: unknown) => {
  const content = JSON.stringify(report, null, 2);
  if (Platform.OS !== `web` || typeof document === `undefined`) {
    await Share.share({ title: name, message: content });
    return;
  }
  const url = URL.createObjectURL(new Blob([content], { type: `application/json` }));
  const anchor = document.createElement(`a`);
  try {
    anchor.href = url;
    anchor.download = `${name}.json`;
    anchor.click();
  } finally { setTimeout(() => URL.revokeObjectURL(url), 0); }
};
