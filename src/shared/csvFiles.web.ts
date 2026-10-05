export const getCsvFile = (files: readonly File[]): File => {
  if (files.length !== 1) throw new Error(`Choose one CSV file at a time.`);
  const file = files[0];
  if (!file || !/\.csv$/i.test(file.name)) throw new Error(`Choose a file ending in .csv.`);
  if (file.size > 5 * 1024 * 1024) throw new Error(`Choose a CSV up to 5 MB.`);
  return file;
};

export const saveCsvFile = async (text: string, filename: string) => {
  const url = URL.createObjectURL(new Blob([text], { type: `text/csv;charset=utf-8;` }));
  const link = document.createElement(`a`);
  link.id = `registrar-csv-download`;
  link.className = `registrar-csv-download`;
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
};
