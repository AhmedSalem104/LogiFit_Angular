import { Injectable } from '@angular/core';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Document, Packer, Paragraph, Table, TableCell, TableRow, TextRun, HeadingLevel, AlignmentType, BorderStyle, WidthType } from 'docx';
import { saveAs } from 'file-saver';

export interface ExportColumn {
  header: string;
  field: string;
  width?: number;
}

export interface ExportConfig {
  title: string;
  subtitle?: string;
  columns: ExportColumn[];
  data: any[];
  fileName: string;
  orientation?: 'portrait' | 'landscape';
  includeDate?: boolean;
  logoUrl?: string;
}

export interface ReportConfig {
  title: string;
  subtitle?: string;
  sections: ReportSection[];
  fileName: string;
  orientation?: 'portrait' | 'landscape';
}

export interface ReportSection {
  title?: string;
  type: 'table' | 'text' | 'stats' | 'chart';
  content?: string;
  columns?: ExportColumn[];
  data?: any[];
  stats?: { label: string; value: string | number }[];
}

@Injectable({
  providedIn: 'root'
})
export class ExportService {

  // Arabic font base64 (simplified - in production you'd use a proper Arabic font)
  private readonly arabicFontSupport = true;

  constructor() {}

  // ========================================
  // PDF Export
  // ========================================
  async exportToPDF(config: ExportConfig): Promise<void> {
    const doc = new jsPDF({
      orientation: config.orientation || 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Set RTL for Arabic
    doc.setR2L(true);

    // Add title
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    const pageWidth = doc.internal.pageSize.getWidth();
    doc.text(config.title, pageWidth / 2, 20, { align: 'center' });

    // Add subtitle if exists
    let yPosition = 30;
    if (config.subtitle) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(config.subtitle, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 10;
    }

    // Add date if requested
    if (config.includeDate !== false) {
      doc.setFontSize(10);
      doc.setTextColor(128, 128, 128);
      const date = new Date().toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      doc.text(`تاريخ التقرير: ${date}`, pageWidth - 15, yPosition, { align: 'right' });
      yPosition += 10;
    }

    doc.setTextColor(0, 0, 0);

    // Prepare table data
    const headers = config.columns.map(col => col.header);
    const rows = config.data.map(item =>
      config.columns.map(col => this.getNestedValue(item, col.field)?.toString() || '-')
    );

    // Add table
    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: yPosition,
      styles: {
        font: 'helvetica',
        fontSize: 10,
        cellPadding: 5,
        halign: 'right',
        valign: 'middle',
        lineColor: [200, 200, 200],
        lineWidth: 0.1
      },
      headStyles: {
        fillColor: [59, 130, 246],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'center'
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      columnStyles: this.getColumnStyles(config.columns),
      margin: { top: 10, right: 15, bottom: 20, left: 15 },
      didDrawPage: (data) => {
        // Add footer with page number
        const pageCount = doc.getNumberOfPages();
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text(
          `صفحة ${data.pageNumber} من ${pageCount}`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        );
      }
    });

    // Save the PDF
    doc.save(`${config.fileName}.pdf`);
  }

  // ========================================
  // Word (DOCX) Export
  // ========================================
  async exportToWord(config: ExportConfig): Promise<void> {
    const doc = new Document({
      sections: [{
        properties: {
          page: {
            size: {
              orientation: config.orientation === 'landscape' ? 'landscape' : 'portrait'
            }
          }
        },
        children: [
          // Title
          new Paragraph({
            children: [
              new TextRun({
                text: config.title,
                bold: true,
                size: 36,
                font: 'Arial'
              })
            ],
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 }
          }),

          // Subtitle
          ...(config.subtitle ? [
            new Paragraph({
              children: [
                new TextRun({
                  text: config.subtitle,
                  size: 24,
                  font: 'Arial'
                })
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 200 }
            })
          ] : []),

          // Date
          ...(config.includeDate !== false ? [
            new Paragraph({
              children: [
                new TextRun({
                  text: `تاريخ التقرير: ${new Date().toLocaleDateString('ar-EG')}`,
                  size: 20,
                  color: '888888',
                  font: 'Arial'
                })
              ],
              alignment: AlignmentType.RIGHT,
              spacing: { after: 400 }
            })
          ] : []),

          // Table
          this.createWordTable(config.columns, config.data)
        ]
      }]
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `${config.fileName}.docx`);
  }

  private createWordTable(columns: ExportColumn[], data: any[]): Table {
    // Header row
    const headerRow = new TableRow({
      children: columns.map(col => new TableCell({
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: col.header,
                bold: true,
                color: 'FFFFFF',
                font: 'Arial'
              })
            ],
            alignment: AlignmentType.CENTER
          })
        ],
        shading: { fill: '3B82F6' },
        width: { size: col.width || 100 / columns.length, type: WidthType.PERCENTAGE }
      })),
      tableHeader: true
    });

    // Data rows
    const dataRows = data.map((item, index) => new TableRow({
      children: columns.map(col => new TableCell({
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: this.getNestedValue(item, col.field)?.toString() || '-',
                font: 'Arial'
              })
            ],
            alignment: AlignmentType.RIGHT
          })
        ],
        shading: { fill: index % 2 === 0 ? 'FFFFFF' : 'F8FAFC' }
      }))
    }));

    return new Table({
      rows: [headerRow, ...dataRows],
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 1, color: 'E2E8F0' },
        bottom: { style: BorderStyle.SINGLE, size: 1, color: 'E2E8F0' },
        left: { style: BorderStyle.SINGLE, size: 1, color: 'E2E8F0' },
        right: { style: BorderStyle.SINGLE, size: 1, color: 'E2E8F0' },
        insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: 'E2E8F0' },
        insideVertical: { style: BorderStyle.SINGLE, size: 1, color: 'E2E8F0' }
      }
    });
  }

  // ========================================
  // Text Export
  // ========================================
  exportToText(config: ExportConfig): void {
    let content = '';

    // Title
    content += '='.repeat(60) + '\n';
    content += this.centerText(config.title, 60) + '\n';
    content += '='.repeat(60) + '\n\n';

    // Subtitle
    if (config.subtitle) {
      content += this.centerText(config.subtitle, 60) + '\n\n';
    }

    // Date
    if (config.includeDate !== false) {
      content += `تاريخ التقرير: ${new Date().toLocaleDateString('ar-EG')}\n\n`;
    }

    // Table header
    const colWidths = config.columns.map(col => Math.max(col.header.length, 15));
    content += '-'.repeat(colWidths.reduce((a, b) => a + b + 3, 0)) + '\n';
    content += '| ' + config.columns.map((col, i) => this.padText(col.header, colWidths[i])).join(' | ') + ' |\n';
    content += '-'.repeat(colWidths.reduce((a, b) => a + b + 3, 0)) + '\n';

    // Table data
    config.data.forEach(item => {
      const row = config.columns.map((col, i) => {
        const value = this.getNestedValue(item, col.field)?.toString() || '-';
        return this.padText(value, colWidths[i]);
      });
      content += '| ' + row.join(' | ') + ' |\n';
    });

    content += '-'.repeat(colWidths.reduce((a, b) => a + b + 3, 0)) + '\n';
    content += `\nإجمالي السجلات: ${config.data.length}\n`;

    // Save file
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    saveAs(blob, `${config.fileName}.txt`);
  }

  // ========================================
  // Excel/CSV Export
  // ========================================
  exportToCSV(config: ExportConfig): void {
    // BOM for UTF-8 Arabic support
    let content = '\uFEFF';

    // Headers
    content += config.columns.map(col => `"${col.header}"`).join(',') + '\n';

    // Data
    config.data.forEach(item => {
      const row = config.columns.map(col => {
        const value = this.getNestedValue(item, col.field);
        return `"${value?.toString()?.replace(/"/g, '""') || ''}"`;
      });
      content += row.join(',') + '\n';
    });

    const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
    saveAs(blob, `${config.fileName}.csv`);
  }

  // ========================================
  // Print Functionality
  // ========================================
  print(config: ExportConfig): void {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = this.generatePrintHTML(config);
    printWindow.document.write(html);
    printWindow.document.close();

    // Wait for content to load then print
    printWindow.onload = () => {
      printWindow.print();
      printWindow.onafterprint = () => printWindow.close();
    };
  }

  // Print Preview - Opens in new window without printing
  printPreview(config: ExportConfig): void {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = this.generatePrintPreviewHTML(config);
    printWindow.document.write(html);
    printWindow.document.close();
  }

  // Print with Statistics Summary
  printWithStats(config: ExportConfig, stats: { label: string; value: string | number; color?: string }[]): void {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = this.generatePrintWithStatsHTML(config, stats);
    printWindow.document.write(html);
    printWindow.document.close();

    printWindow.onload = () => {
      printWindow.print();
      printWindow.onafterprint = () => printWindow.close();
    };
  }

  private generatePrintHTML(config: ExportConfig): string {
    const rows = config.data.map(item =>
      config.columns.map(col => `<td>${this.getNestedValue(item, col.field) || '-'}</td>`).join('')
    ).join('</tr><tr>');

    return `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>${config.title}</title>
        ${this.getPrintStyles()}
      </head>
      <body>
        ${this.getPrintHeader(config)}
        ${this.getPrintMeta(config)}
        ${this.getPrintTable(config, rows)}
        ${this.getPrintFooter()}
      </body>
      </html>
    `;
  }

  private generatePrintPreviewHTML(config: ExportConfig): string {
    const rows = config.data.map(item =>
      config.columns.map(col => `<td>${this.getNestedValue(item, col.field) || '-'}</td>`).join('')
    ).join('</tr><tr>');

    return `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>معاينة الطباعة - ${config.title}</title>
        ${this.getPrintStyles()}
        <style>
          .preview-toolbar {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
            padding: 15px 30px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            box-shadow: 0 4px 20px rgba(0,0,0,0.15);
            z-index: 1000;
          }
          .preview-toolbar h3 {
            color: white;
            font-size: 16px;
            font-weight: 500;
          }
          .preview-toolbar .actions {
            display: flex;
            gap: 12px;
          }
          .preview-toolbar button {
            padding: 10px 24px;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 600;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .preview-toolbar .btn-print {
            background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
            color: white;
          }
          .preview-toolbar .btn-print:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 15px rgba(59, 130, 246, 0.4);
          }
          .preview-toolbar .btn-close {
            background: rgba(255,255,255,0.1);
            color: white;
            border: 1px solid rgba(255,255,255,0.2);
          }
          .preview-toolbar .btn-close:hover {
            background: rgba(255,255,255,0.2);
          }
          .preview-content {
            margin-top: 80px;
            padding: 40px;
            background: #f1f5f9;
            min-height: calc(100vh - 80px);
          }
          .preview-page {
            background: white;
            max-width: 800px;
            margin: 0 auto;
            padding: 40px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.1);
            border-radius: 12px;
          }
          @media print {
            .preview-toolbar { display: none !important; }
            .preview-content { margin-top: 0; padding: 0; background: white; }
            .preview-page { box-shadow: none; padding: 20px; max-width: none; }
          }
        </style>
      </head>
      <body>
        <div class="preview-toolbar">
          <h3>🖨️ معاينة الطباعة</h3>
          <div class="actions">
            <button class="btn-close" onclick="window.close()">
              ✕ إغلاق
            </button>
            <button class="btn-print" onclick="window.print()">
              🖨️ طباعة الآن
            </button>
          </div>
        </div>
        <div class="preview-content">
          <div class="preview-page">
            ${this.getPrintHeader(config)}
            ${this.getPrintMeta(config)}
            ${this.getPrintTable(config, rows)}
            ${this.getPrintFooter()}
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generatePrintWithStatsHTML(config: ExportConfig, stats: { label: string; value: string | number; color?: string }[]): string {
    const rows = config.data.map(item =>
      config.columns.map(col => `<td>${this.getNestedValue(item, col.field) || '-'}</td>`).join('')
    ).join('</tr><tr>');

    const statsHtml = stats.map(stat => `
      <div class="stat-card" style="border-right-color: ${stat.color || '#3b82f6'}">
        <div class="stat-value" style="color: ${stat.color || '#3b82f6'}">${stat.value}</div>
        <div class="stat-label">${stat.label}</div>
      </div>
    `).join('');

    return `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>${config.title}</title>
        ${this.getPrintStyles()}
        <style>
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 15px;
            margin-bottom: 30px;
          }
          .stat-card {
            background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
            padding: 20px;
            border-radius: 12px;
            text-align: center;
            border-right: 4px solid #3b82f6;
          }
          .stat-value {
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 5px;
          }
          .stat-label {
            font-size: 12px;
            color: #64748b;
            font-weight: 500;
          }
        </style>
      </head>
      <body>
        ${this.getPrintHeader(config)}
        ${this.getPrintMeta(config)}
        <div class="stats-grid">${statsHtml}</div>
        ${this.getPrintTable(config, rows)}
        ${this.getPrintFooter()}
      </body>
      </html>
    `;
  }

  private getPrintStyles(): string {
    return `
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          font-family: 'Cairo', 'Segoe UI', Tahoma, Arial, sans-serif;
          padding: 30px;
          direction: rtl;
          color: #1e293b;
          background: white;
          line-height: 1.6;
        }

        .header {
          text-align: center;
          margin-bottom: 35px;
          padding-bottom: 25px;
          border-bottom: 3px solid transparent;
          border-image: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%) 1;
          position: relative;
        }

        .header::before {
          content: '';
          position: absolute;
          top: -10px;
          left: 50%;
          transform: translateX(-50%);
          width: 80px;
          height: 80px;
          background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .header .logo {
          width: 70px;
          height: 70px;
          background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
          border-radius: 50%;
          margin: 0 auto 15px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 24px;
          font-weight: 700;
        }

        .header h1 {
          font-size: 28px;
          color: #1e293b;
          margin-bottom: 8px;
          font-weight: 700;
        }

        .header p {
          color: #64748b;
          font-size: 14px;
          font-weight: 500;
        }

        .meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 25px;
          padding: 15px 20px;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          border-radius: 10px;
          font-size: 13px;
          color: #475569;
        }

        .meta-item {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .meta-item strong {
          color: #3b82f6;
        }

        table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
          margin-bottom: 25px;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 15px rgba(0,0,0,0.05);
        }

        th {
          background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
          color: white;
          padding: 15px 18px;
          text-align: right;
          font-weight: 600;
          font-size: 13px;
          letter-spacing: 0.3px;
        }

        th:first-child {
          border-radius: 0 12px 0 0;
        }

        th:last-child {
          border-radius: 12px 0 0 0;
        }

        td {
          padding: 14px 18px;
          border-bottom: 1px solid #e2e8f0;
          font-size: 13px;
          color: #334155;
        }

        tr:nth-child(even) {
          background: #f8fafc;
        }

        tr:last-child td {
          border-bottom: none;
        }

        tr:last-child td:first-child {
          border-radius: 0 0 12px 0;
        }

        tr:last-child td:last-child {
          border-radius: 0 0 0 12px;
        }

        .footer {
          text-align: center;
          padding: 25px 20px;
          margin-top: 30px;
          border-top: 2px solid #e2e8f0;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          border-radius: 12px;
        }

        .footer-logo {
          font-size: 20px;
          font-weight: 700;
          background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 8px;
        }

        .footer p {
          font-size: 11px;
          color: #94a3b8;
          margin-top: 5px;
        }

        .footer .powered {
          font-size: 10px;
          color: #cbd5e1;
          margin-top: 10px;
        }

        .badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
        }

        .badge-success {
          background: #dcfce7;
          color: #16a34a;
        }

        .badge-danger {
          background: #fef2f2;
          color: #dc2626;
        }

        .badge-info {
          background: #dbeafe;
          color: #2563eb;
        }

        @media print {
          body {
            padding: 15px;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print { display: none !important; }
          tr { page-break-inside: avoid; }
          table { box-shadow: none; }
          .header, .footer { background: white; }
        }

        @page {
          size: A4;
          margin: 15mm;
        }
      </style>
    `;
  }

  private getPrintHeader(config: ExportConfig): string {
    return `
      <div class="header">
        <div class="logo">LF</div>
        <h1>${config.title}</h1>
        ${config.subtitle ? `<p>${config.subtitle}</p>` : ''}
      </div>
    `;
  }

  private getPrintMeta(config: ExportConfig): string {
    const date = new Date().toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    return `
      <div class="meta">
        <div class="meta-item">
          <span>📅</span>
          <span>تاريخ الطباعة: <strong>${date}</strong></span>
        </div>
        <div class="meta-item">
          <span>📊</span>
          <span>إجمالي السجلات: <strong>${config.data.length}</strong></span>
        </div>
      </div>
    `;
  }

  private getPrintTable(config: ExportConfig, rows: string): string {
    return `
      <table>
        <thead>
          <tr>
            ${config.columns.map(col => `<th>${col.header}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          <tr>${rows}</tr>
        </tbody>
      </table>
    `;
  }

  private getPrintFooter(): string {
    return `
      <div class="footer">
        <div class="footer-logo">LogicFit</div>
        <p>نظام إدارة الصالات الرياضية المتكامل</p>
        <p class="powered">تم إنشاء هذا التقرير تلقائياً بواسطة النظام</p>
      </div>
    `;
  }

  // ========================================
  // Report Generation (Multi-section)
  // ========================================
  async generateReport(config: ReportConfig): Promise<void> {
    const doc = new jsPDF({
      orientation: config.orientation || 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    doc.setR2L(true);
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPosition = 20;

    // Title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(config.title, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 10;

    // Subtitle
    if (config.subtitle) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(config.subtitle, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 10;
    }

    // Date
    doc.setFontSize(10);
    doc.setTextColor(128, 128, 128);
    doc.text(`تاريخ التقرير: ${new Date().toLocaleDateString('ar-EG')}`, pageWidth - 15, yPosition, { align: 'right' });
    doc.setTextColor(0, 0, 0);
    yPosition += 15;

    // Sections
    for (const section of config.sections) {
      // Check if we need a new page
      if (yPosition > doc.internal.pageSize.getHeight() - 40) {
        doc.addPage();
        yPosition = 20;
      }

      // Section title
      if (section.title) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(59, 130, 246);
        doc.text(section.title, pageWidth - 15, yPosition, { align: 'right' });
        doc.setTextColor(0, 0, 0);
        yPosition += 8;
      }

      switch (section.type) {
        case 'text':
          doc.setFontSize(11);
          doc.setFont('helvetica', 'normal');
          const lines = doc.splitTextToSize(section.content || '', pageWidth - 30);
          doc.text(lines, pageWidth - 15, yPosition, { align: 'right' });
          yPosition += lines.length * 6 + 10;
          break;

        case 'stats':
          if (section.stats) {
            const statsPerRow = 3;
            const statWidth = (pageWidth - 30) / statsPerRow;

            section.stats.forEach((stat, index) => {
              const col = index % statsPerRow;
              const row = Math.floor(index / statsPerRow);
              const x = pageWidth - 15 - (col * statWidth);
              const y = yPosition + (row * 25);

              // Stat box
              doc.setFillColor(248, 250, 252);
              doc.roundedRect(x - statWidth + 5, y - 5, statWidth - 10, 20, 3, 3, 'F');

              // Value
              doc.setFontSize(14);
              doc.setFont('helvetica', 'bold');
              doc.text(stat.value.toString(), x - statWidth / 2, y + 3, { align: 'center' });

              // Label
              doc.setFontSize(9);
              doc.setFont('helvetica', 'normal');
              doc.setTextColor(100, 116, 139);
              doc.text(stat.label, x - statWidth / 2, y + 10, { align: 'center' });
              doc.setTextColor(0, 0, 0);
            });

            yPosition += Math.ceil(section.stats.length / statsPerRow) * 25 + 10;
          }
          break;

        case 'table':
          if (section.columns && section.data) {
            const headers = section.columns.map(col => col.header);
            const rows = section.data.map(item =>
              section.columns!.map(col => this.getNestedValue(item, col.field)?.toString() || '-')
            );

            autoTable(doc, {
              head: [headers],
              body: rows,
              startY: yPosition,
              styles: {
                fontSize: 9,
                cellPadding: 4,
                halign: 'right'
              },
              headStyles: {
                fillColor: [59, 130, 246],
                textColor: [255, 255, 255],
                fontStyle: 'bold',
                halign: 'center'
              },
              alternateRowStyles: {
                fillColor: [248, 250, 252]
              },
              margin: { right: 15, left: 15 }
            });

            yPosition = (doc as any).lastAutoTable.finalY + 15;
          }
          break;
      }
    }

    // Save
    doc.save(`${config.fileName}.pdf`);
  }

  // ========================================
  // Helper Methods
  // ========================================
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private getColumnStyles(columns: ExportColumn[]): { [key: number]: { cellWidth: number } } {
    const styles: { [key: number]: { cellWidth: number } } = {};
    const totalWidth = 180; // A4 width minus margins
    const defaultWidth = totalWidth / columns.length;

    columns.forEach((col, index) => {
      styles[index] = { cellWidth: col.width || defaultWidth };
    });

    return styles;
  }

  private centerText(text: string, width: number): string {
    const padding = Math.max(0, Math.floor((width - text.length) / 2));
    return ' '.repeat(padding) + text;
  }

  private padText(text: string, width: number): string {
    return text.padEnd(width, ' ');
  }
}
