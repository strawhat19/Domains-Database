import * as Sharing from 'expo-sharing';
import { File, Paths } from 'expo-file-system';

export const saveCsvFile = async (text: string, filename: string) => {
  if (!await Sharing.isAvailableAsync()) throw new Error(`Sharing Is Unavailable On This Device`);
  const file = new File(Paths.cache, filename);
  file.create({ overwrite: true });
  file.write(text);
  await Sharing.shareAsync(file.uri, {
    mimeType: `text/csv`,
    dialogTitle: `Export Domains`,
    UTI: `public.comma-separated-values-text`,
  });
};
