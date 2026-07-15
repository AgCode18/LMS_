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



// typescript code  👇👇


// import ExcelJS from 'exceljs';
// import PDFDocument from 'pdfkit';

// // ============================================================================
// // Type Definitions
// // ============================================================================

// export interface ReportColumn {
//   header: string;
//   key: string;
//   width?: number;
//   numeric?: boolean;
// }

// export interface ReportRow {
//   [key: string]: any;
// }

// export interface PdfOptions {
//   subtitle?: string;
// }

// // ============================================================================
// // Excel Export
// // ============================================================================

// /**
//  * Turns any report's { columns, rows } shape into a downloadable .xlsx buffer.
//  */
// export async function toXlsxBuffer(
//   title: string,
//   columns: ReportColumn[],
//   rows: ReportRow[]
// ): Promise<Buffer> {
//   const workbook = new ExcelJS.Workbook();
//   workbook.creator = 'AZZUNIQUE LMS — Accounting Engine';
//   workbook.created = new Date();

//   // Excel sheet-name length limit is 31 characters
//   const sheet = workbook.addWorksheet(title.slice(0, 31));

//   // Set up columns with proper widths
//   sheet.columns = columns.map((c) => ({
//     header: c.header,
//     key: c.key,
//     width: c.width ?? 20,
//   }));

//   // Make header row bold
//   const headerRow = sheet.getRow(1);
//   headerRow.font = { bold: true };

//   // Add data rows
//   rows.forEach((row) => sheet.addRow(row));

//   // Apply number formatting for numeric columns
//   columns.forEach((c, index) => {
//     if (c.numeric) {
//       const columnIndex = index + 1;
//       sheet.getColumn(columnIndex).numFmt = '#,##0.00';
//     }
//   });

//   // Return the buffer
//   const buffer = await workbook.xlsx.writeBuffer();
//   return buffer as Buffer;
// }

// // ============================================================================
// // PDF Export
// // ============================================================================

// /**
//  * Turns the same { columns, rows } shape into a simple tabular PDF buffer.
//  * Not trying to be fancy — just legible rows with a header, suitable for
//  * printing or attaching to an audit email.
//  */
// export function toPdfBuffer(
//   title: string,
//   columns: ReportColumn[],
//   rows: ReportRow[],
//   { subtitle }: PdfOptions = {}
// ): Promise<Buffer> {
//   return new Promise((resolve, reject) => {
//     // Determine layout based on column count
//     const layout = columns.length > 5 ? 'landscape' : 'portrait';
    
//     const doc = new PDFDocument({
//       margin: 40,
//       size: 'A4',
//       layout: layout as 'portrait' | 'landscape',
//     });

//     const chunks: Buffer[] = [];
    
//     doc.on('data', (chunk: Buffer) => chunks.push(chunk));
//     doc.on('end', () => resolve(Buffer.concat(chunks)));
//     doc.on('error', reject);

//     // Title
//     doc.font('Helvetica-Bold')
//        .fontSize(16)
//        .text(title);

//     // Subtitle (optional)
//     if (subtitle) {
//       doc.font('Helvetica')
//          .fontSize(9)
//          .fillColor('#555')
//          .text(subtitle);
//     }
    
//     doc.moveDown(0.8);

//     // Calculate column widths
//     const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
//     const colWidth = pageWidth / columns.length;
//     const startX = doc.page.margins.left;
//     let y = doc.page.margins.top + doc.y;

//     // Helper function to draw a row
//     const drawRow = (values: any[], { bold = false } = {}) => {
//       doc.font(bold ? 'Helvetica-Bold' : 'Helvetica')
//          .fontSize(9)
//          .fillColor('#000');

//       values.forEach((val, index) => {
//         const align = columns[index]?.numeric ? 'right' : 'left';
//         doc.text(String(val ?? ''), startX + index * colWidth, y, {
//           width: colWidth - 6,
//           align: align as 'left' | 'right' | 'center' | 'justify',
//         });
//       });

//       y += 16;

//       // Check if we need a new page
//       if (y > doc.page.height - doc.page.margins.bottom - 20) {
//         doc.addPage();
//         y = doc.page.margins.top;
//       }
//     };

//     // Draw header row
//     drawRow(
//       columns.map((c) => c.header),
//       { bold: true }
//     );

//     // Draw separator line
//     doc.moveTo(startX, y - 4)
//        .lineTo(startX + pageWidth, y - 4)
//        .strokeColor('#999')
//        .stroke();

//     // Draw data rows
//     rows.forEach((row) => {
//       const rowValues = columns.map((c) => row[c.key]);
//       drawRow(rowValues);
//     });

//     doc.end();
//   });
// }

// // ============================================================================
// // Optional: Export a service interface
// // ============================================================================

// export interface ReportExportService {
//   toXlsxBuffer: (title: string, columns: ReportColumn[], rows: ReportRow[]) => Promise<Buffer>;
//   toPdfBuffer: (title: string, columns: ReportColumn[], rows: ReportRow[], options?: PdfOptions) => Promise<Buffer>;
// }

// // ============================================================================
// // Additional Utility Types
// // ============================================================================

// /**
//  * Helper type for creating typed report rows
//  */
// export type CreateReportRow<T extends Record<string, any>> = {
//   [K in keyof T]: T[K];
// } & ReportRow;

// /**
//  * Helper function to create typed report rows
//  */
// export function createReportRow<T extends Record<string, any>>(
//   row: T
// ): CreateReportRow<T> {
//   return row;
// }

// /**
//  * Helper function to create typed report columns
//  */
// export function createReportColumns<T extends string>(
//   columns: Array<{
//     header: string;
//     key: T;
//     width?: number;
//     numeric?: boolean;
//   }>
// ): ReportColumn[] {
//   return columns;
// }

// // ============================================================================
// // Example Usage (commented out)
// // ============================================================================

// /*
// // Example usage with type safety
// interface LoanReportRow {
//   loanId: string;
//   customerName: string;
//   amount: number;
//   status: string;
//   date: Date;
// }

// const columns = createReportColumns<keyof LoanReportRow>([
//   { header: 'Loan ID', key: 'loanId', width: 15 },
//   { header: 'Customer', key: 'customerName', width: 25 },
//   { header: 'Amount', key: 'amount', width: 15, numeric: true },
//   { header: 'Status', key: 'status', width: 15 },
//   { header: 'Date', key: 'date', width: 15 },
// ]);

// const rows: LoanReportRow[] = [
//   { loanId: 'L001', customerName: 'John Doe', amount: 10000, status: 'Active', date: new Date() },
//   // ...
// ];

// // Export to Excel
// const excelBuffer = await toXlsxBuffer('Loan Report', columns, rows);

// // Export to PDF
// const pdfBuffer = await toPdfBuffer('Loan Report', columns, rows, {
//   subtitle: 'Generated on ' + new Date().toLocaleDateString()
// });
// */