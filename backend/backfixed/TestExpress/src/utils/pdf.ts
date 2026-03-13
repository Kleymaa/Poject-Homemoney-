import PDFDocument from 'pdfkit';

export const buildPdfBuffer = async (title: string, rows: Record<string, any>[]) => {
  return new Promise<Buffer>((resolve) => {
    const doc = new PDFDocument({ margin: 40 });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    doc.on('end', () => resolve(Buffer.concat(chunks)));

    doc.fontSize(18).text(title);
    doc.moveDown();

    rows.forEach((row, index) => {
      doc.fontSize(12).text(`${index + 1}. ${JSON.stringify(row)}`);
      doc.moveDown(0.5);
    });

    doc.end();
  });
};