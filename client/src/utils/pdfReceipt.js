import jsPDF from 'jspdf';

export const generateReceipt = (tx) => {
  const doc = new jsPDF({ unit: 'mm', format: 'a5' });
  const W = doc.internal.pageSize.getWidth();

  // Header
  doc.setFillColor(37, 99, 235);
  doc.rect(0, 0, W, 30, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(15); doc.setFont('helvetica', 'bold');
  doc.text('FinCore Bank', 14, 12);
  doc.setFontSize(9); doc.setFont('helvetica', 'normal');
  doc.text('Transfer Receipt', 14, 19);
  doc.text(`Ref: ${tx.referenceNumber}`, 14, 25);

  // Status badge
  doc.setFillColor(16, 185, 129);
  doc.roundedRect(W - 40, 10, 26, 10, 2, 2, 'F');
  doc.setFontSize(8); doc.setFont('helvetica', 'bold');
  doc.text('COMPLETED', W - 37, 16.5);

  // Amount
  doc.setTextColor(30, 58, 138);
  doc.setFontSize(26); doc.setFont('helvetica', 'bold');
  const amt = `₹${parseFloat(tx.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  doc.text(amt, W / 2, 50, { align: 'center' });
  doc.setTextColor(100, 116, 139); doc.setFontSize(9); doc.setFont('helvetica', 'normal');
  doc.text('Amount Transferred', W / 2, 57, { align: 'center' });

  // Divider
  doc.setDrawColor(226, 232, 240); doc.line(14, 62, W - 14, 62);

  // Detail rows
  const rows = [
    ['Date',         new Date(tx.date || tx.createdAt).toLocaleString('en-IN')],
    ['Reference',    tx.referenceNumber],
    ['Type',         'Fund Transfer'],
    ['Status',       'Completed'],
    ['From Account', tx.senderAccount?.accountNumber || tx.fromAccount || '—'],
    ['To Account',   tx.receiverAccount?.accountNumber || tx.toAccount || '—'],
    ['Description',  tx.description || 'Fund transfer'],
  ];

  let y = 72;
  rows.forEach(([label, value], i) => {
    doc.setFillColor(i % 2 === 0 ? 248 : 255, i % 2 === 0 ? 250 : 255, i % 2 === 0 ? 252 : 255);
    doc.rect(14, y - 5, W - 28, 9, 'F');
    doc.setTextColor(100, 116, 139); doc.setFontSize(8); doc.setFont('helvetica', 'normal');
    doc.text(label, 16, y);
    doc.setTextColor(15, 23, 42); doc.setFontSize(8.5); doc.setFont('helvetica', 'bold');
    doc.text(String(value), W - 16, y, { align: 'right', maxWidth: 85 });
    y += 10;
  });

  // Footer
  doc.setDrawColor(226, 232, 240); doc.line(14, y + 4, W - 14, y + 4);
  doc.setTextColor(148, 163, 184); doc.setFontSize(7.5); doc.setFont('helvetica', 'normal');
  doc.text('System-generated receipt · FinCore Bank · Not a tax document', W / 2, y + 11, { align: 'center' });

  doc.save(`FinCore_Receipt_${tx.referenceNumber}.pdf`);
};
