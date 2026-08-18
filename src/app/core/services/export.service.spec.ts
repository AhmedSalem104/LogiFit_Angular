import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

describe('ExportService PDF compatibility', () => {
  it('generates a PDF table with the supported jsPDF/AutoTable contract', async () => {
    const doc = new jsPDF();
    expect(typeof (doc as any).save).toBe('function');
    autoTable(doc, { head: [['Name']], body: [['Test member']] });
    expect(doc.output('arraybuffer')).toBeInstanceOf(ArrayBuffer);
  });
});
