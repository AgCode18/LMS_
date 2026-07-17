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

// export interface ExportColumn {
//   key: string;
//   header: string;
//   width?: number;
//   numeric?: boolean;
// }

// export interface ExportRow {
//   [key: string]: any;
// }

// export interface PdfOptions {
//   subtitle?: string;
// }

// export interface ExportData {
//   columns: ExportColumn[];
//   rows: ExportRow[];
// }

// // ============================================================================
// // Service Functions
// // ============================================================================

// /**
//  * Turns any report's { columns, rows } shape into a downloadable .xlsx buffer.
//  */
// export async function toXlsxBuffer(
//   title: string,
//   columns: ExportColumn[],
//   rows: ExportRow[]
// ): Promise<Buffer> {
//   const workbook = new ExcelJS.Workbook();
//   workbook.creator = 'AZZUNIQUE LMS — Accounting Engine';
//   workbook.created = new Date();

//   const sheet = workbook.addWorksheet(title.slice(0, 31)); // Excel sheet-name length limit

//   sheet.columns = columns.map((c) => ({
//     header: c.header,
//     key: c.key,
//     width: c.width ?? 20,
//   }));
  
//   sheet.getRow(1).font = { bold: true };
  
//   rows.forEach((row) => sheet.addRow(row));

//   // Light formatting so it reads like a ledger, not a raw data dump.
//   columns.forEach((c, i) => {
//     if (c.numeric) {
//       sheet.getColumn(i + 1).numFmt = '#,##0.00';
//     }
//   });

//   return workbook.xlsx.writeBuffer() as Promise<Buffer>;
// }

// /**
//  * Turns the same { columns, rows } shape into a simple tabular PDF buffer.
//  * Not trying to be fancy — just legible rows with a header, suitable for
//  * printing or attaching to an audit email.
//  */
// export function toPdfBuffer(
//   title: string,
//   columns: ExportColumn[],
//   rows: ExportRow[],
//   options: PdfOptions = {}
// ): Promise<Buffer> {
//   const { subtitle } = options;
  
//   return new Promise((resolve, reject) => {
//     const doc = new PDFDocument({
//       margin: 40,
//       size: 'A4',
//       layout: columns.length > 5 ? 'landscape' : 'portrait',
//     });
    
//     const chunks: Buffer[] = [];
//     doc.on('data', (chunk: Buffer) => chunks.push(chunk));
//     doc.on('end', () => resolve(Buffer.concat(chunks)));
//     doc.on('error', reject);

//     // Title
//     doc.font('Helvetica-Bold').fontSize(16).text(title);
    
//     // Subtitle
//     if (subtitle) {
//       doc.font('Helvetica').fontSize(9).fillColor('#555').text(subtitle);
//     }
    
//     doc.moveDown(0.8);

//     const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
//     const colWidth = pageWidth / columns.length;
//     const startX = doc.page.margins.left;
//     let y = doc.y;

//     const drawRow = (values: any[], { bold = false } = {}): void => {
//       doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(9).fillColor('#000');
      
//       values.forEach((val, i) => {
//         doc.text(String(val ?? ''), startX + i * colWidth, y, {
//           width: colWidth - 6,
//           align: columns[i].numeric ? 'right' : 'left',
//         });
//       });
      
//       y += 16;
      
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
//     doc
//       .moveTo(startX, y - 4)
//       .lineTo(startX + pageWidth, y - 4)
//       .strokeColor('#999')
//       .stroke();

//     // Draw data rows
//     rows.forEach((row) => drawRow(columns.map((c) => row[c.key])));

//     doc.end();
//   });
// }

// // ============================================================================
// // Additional Utility Functions
// // ============================================================================

// /**
//  * Formats a date for export
//  */
// export function formatDateForExport(date: Date | string): string {
//   const d = typeof date === 'string' ? new Date(date) : date;
//   return d.toLocaleDateString('en-IN', {
//     day: '2-digit',
//     month: '2-digit',
//     year: 'numeric',
//   });
// }

// /**
//  * Formats a number for export with proper decimal places
//  */
// export function formatNumberForExport(value: number, decimals: number = 2): string {
//   return value.toFixed(decimals);
// }

// /**
//  * Generates a filename with timestamp
//  */
// export function generateExportFilename(baseName: string, extension: 'xlsx' | 'pdf'): string {
//   const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
//   return `${baseName}-${timestamp}.${extension}`;
// }

// /**
//  * Sets export headers for HTTP response
//  */
// export function setExportHeaders(
//   res: any,
//   filename: string,
//   format: 'xlsx' | 'pdf'
// ): void {
//   const contentType = format === 'xlsx'
//     ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
//     : 'application/pdf';
  
//   res.setHeader('Content-Type', contentType);
//   res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
// }

// // ============================================================================
// // Validation Functions
// // ============================================================================

// export function validateExportData(data: ExportData): void {
//   if (!data.columns || data.columns.length === 0) {
//     throw new Error('Export columns are required');
//   }
  
//   if (!data.rows) {
//     throw new Error('Export rows are required');
//   }
// }

// export function validateExportColumns(columns: ExportColumn[]): void {
//   columns.forEach((col) => {
//     if (!col.key) {
//       throw new Error('Each column must have a key');
//     }
//     if (!col.header) {
//       throw new Error('Each column must have a header');
//     }
//   });
// }

// // ============================================================================
// // PDF Styling Options
// // ============================================================================

// export interface PdfStyleOptions {
//   fontSize?: number;
//   fontColor?: string;
//   bold?: boolean;
//   align?: 'left' | 'center' | 'right';
//   backgroundColor?: string;
// }

// export interface PdfDocumentOptions {
//   margins?: number | { top: number; bottom: number; left: number; right: number };
//   pageSize?: 'A4' | 'A3' | 'Legal' | 'Letter';
//   layout?: 'portrait' | 'landscape';
// }

// /**
//  * Creates a styled PDF with custom options
//  */
// export function toStyledPdfBuffer(
//   title: string,
//   columns: ExportColumn[],
//   rows: ExportRow[],
//   options: PdfOptions & PdfDocumentOptions = {}
// ): Promise<Buffer> {
//   const { subtitle, margins = 40, pageSize = 'A4', layout = 'portrait' } = options;
  
//   return new Promise((resolve, reject) => {
//     const doc = new PDFDocument({
//       margin: margins,
//       size: pageSize,
//       layout: columns.length > 5 ? 'landscape' : layout,
//     });
    
//     const chunks: Buffer[] = [];
//     doc.on('data', (chunk: Buffer) => chunks.push(chunk));
//     doc.on('end', () => resolve(Buffer.concat(chunks)));
//     doc.on('error', reject);

//     // Title with styling
//     doc.font('Helvetica-Bold').fontSize(16).text(title);
    
//     // Subtitle
//     if (subtitle) {
//       doc.font('Helvetica').fontSize(9).fillColor('#555').text(subtitle);
//     }
    
//     doc.moveDown(0.8);

//     // Table rendering
//     const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
//     const colWidth = pageWidth / columns.length;
//     const startX = doc.page.margins.left;
//     let y = doc.y;

//     // Draw header with background
//     const headerHeight = 20;
//     doc.rect(startX, y - 2, pageWidth, headerHeight)
//        .fillColor('#e0e0e0')
//        .fill();
    
//     doc.fillColor('#000');
//     doc.font('Helvetica-Bold').fontSize(10);
    
//     columns.forEach((col, i) => {
//       doc.text(col.header, startX + i * colWidth + 4, y + 2, {
//         width: colWidth - 8,
//         align: col.numeric ? 'right' : 'left',
//       });
//     });
    
//     y += headerHeight + 4;

//     // Draw rows
//     rows.forEach((row, rowIndex) => {
//       // Alternate row colors for readability
//       if (rowIndex % 2 === 0) {
//         doc.rect(startX, y - 2, pageWidth, 18)
//            .fillColor('#f8f8f8')
//            .fill();
//       }
      
//       doc.fillColor('#000');
//       doc.font('Helvetica').fontSize(9);
      
//       columns.forEach((col, i) => {
//         const value = row[col.key];
//         const formattedValue = col.numeric && typeof value === 'number'
//           ? formatNumberForExport(value)
//           : String(value ?? '');
        
//         doc.text(formattedValue, startX + i * colWidth + 4, y + 2, {
//           width: colWidth - 8,
//           align: col.numeric ? 'right' : 'left',
//         });
//       });
      
//       y += 18;
      
//       if (y > doc.page.height - doc.page.margins.bottom - 20) {
//         doc.addPage();
//         y = doc.page.margins.top;
//       }
//     });

//     doc.end();
//   });
// }