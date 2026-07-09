import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';

/**
 * Turns any report's { columns, rows } shape into a downloadable .xlsx buffer.
 */
export async function toXlsxBuffer(title, columns, rows) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'AZZUNIQUE LMS — Accounting Engine';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet(title.slice(0, 31)); // Excel sheet-name length limit

  sheet.columns = columns.map((c) => ({ header: c.header, key: c.key, width: c.width ?? 20 }));
  sheet.getRow(1).font = { bold: true };
  rows.forEach((row) => sheet.addRow(row));

  // Light formatting so it reads like a ledger, not a raw data dump.
  columns.forEach((c, i) => {
    if (c.numeric) sheet.getColumn(i + 1).numFmt = '#,##0.00';
  });

  return workbook.xlsx.writeBuffer();
}

/**
 * Turns the same { columns, rows } shape into a simple tabular PDF buffer.
 * Not trying to be fancy — just legible rows with a header, suitable for
 * printing or attaching to an audit email.
 */
export function toPdfBuffer(title, columns, rows, { subtitle } = {}) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: 'A4', layout: columns.length > 5 ? 'landscape' : 'portrait' });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.font('Helvetica-Bold').fontSize(16).text(title);
    if (subtitle) doc.font('Helvetica').fontSize(9).fillColor('#555').text(subtitle);
    doc.moveDown(0.8);

    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const colWidth = pageWidth / columns.length;
    const startX = doc.page.margins.left;
    let y = doc.y;

    const drawRow = (values, { bold = false } = {}) => {
      doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(9).fillColor('#000');
      values.forEach((val, i) => {
        doc.text(String(val ?? ''), startX + i * colWidth, y, {
          width: colWidth - 6,
          align: columns[i].numeric ? 'right' : 'left',
        });
      });
      y += 16;
      if (y > doc.page.height - doc.page.margins.bottom - 20) {
        doc.addPage();
        y = doc.page.margins.top;
      }
    };

    drawRow(
      columns.map((c) => c.header),
      { bold: true }
    );
    doc
      .moveTo(startX, y - 4)
      .lineTo(startX + pageWidth, y - 4)
      .strokeColor('#999')
      .stroke();

    rows.forEach((row) => drawRow(columns.map((c) => row[c.key])));

    doc.end();
  });
}
