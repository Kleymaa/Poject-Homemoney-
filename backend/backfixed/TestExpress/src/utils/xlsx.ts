import * as XLSX from 'xlsx';

export const buildXlsxBuffer = (rows: Record<string, any>[]) => {
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Operations');

  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
};