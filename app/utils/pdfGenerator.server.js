import pdf from 'html-pdf';

// Genera un buffer de PDF a partir de HTML
export function generatePDFBuffer(html) {
  return new Promise((resolve, reject) => {
    const options = { format: 'A4', border: '10mm' };
    pdf.create(html, options).toBuffer((err, buffer) => {
      if (err) return reject(err);
      resolve(buffer);
    });
  });
}
