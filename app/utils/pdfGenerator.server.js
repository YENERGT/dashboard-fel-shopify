import puppeteer from 'puppeteer';

// Singleton de navegador para reutilizar instancias y reducir overhead
let browserPromise;
async function getBrowser() {
  if (!browserPromise) {
    const launchOptions = {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--single-process'
      ]
    };
    browserPromise = puppeteer.launch(launchOptions);
  }
  return browserPromise;
}

// Genera un buffer de PDF a partir de HTML
export async function generatePDFBuffer(html) {
  // Obtener navegador singleton
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const buffer = await page.pdf({
      format: 'A4',
      margin: { top: '10mm', bottom: '10mm', left: '10mm', right: '10mm' },
      printBackground: true
    });
    return buffer;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  } finally {
    // Cerrar solo la página, mantener navegador vivo
    try { await page.close(); } catch {};
  }
}
