import { getTransactions } from './transaction.service';
import { buildPdfBuffer } from '../utils/pdf';
import { buildXlsxBuffer } from '../utils/xlsx';
import { writeActionLog } from '../utils/logger';

export const exportOperationsReport = async (
  userId: string,
  format: 'xlsx' | 'pdf',
  filters: any
) => {
  const transactions = await getTransactions(userId, filters);

  const rows = transactions.map((item: any) => ({
    id: item.id,
    type: item.type,
    amount: item.amount,
    description: item.description,
    transaction_date: item.transaction_date,
  }));

  await writeActionLog({
    userId,
    action: 'EXPORT_REPORT',
    entityType: 'report',
    metadata: { format },
  });

  if (format === 'xlsx') {
    return {
      fileName: 'operations-report.xlsx',
      contentType:
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      buffer: buildXlsxBuffer(rows),
    };
  }

  return {
    fileName: 'operations-report.pdf',
    contentType: 'application/pdf',
    buffer: await buildPdfBuffer('Operations Report', rows),
  };
};