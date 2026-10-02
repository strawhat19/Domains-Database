export const getCsvFile = (files: readonly File[]): File => {
  if (files.length !== 1) throw new Error(`Choose one CSV file at a time.`);
  const file = files[0];
  if (!file || !/\.csv$/i.test(file.name)) throw new Error(`Choose a file ending in .csv.`);
  if (file.size > 5 * 1024 * 1024) throw new Error(`Choose a CSV up to 5 MB.`);
  return file;
};
