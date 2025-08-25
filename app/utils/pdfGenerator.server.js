import puppeteer from 'puppeteer';

// Browser lazy loading - solo cargar cuando se necesite
let browserInstance = null;
let browserTimeout = null;

async function getBrowser() {
  if (browserInstance) {
    // Resetear timeout si browser ya existe
    clearTimeout(browserTimeout);
  } else {
    console.log('[PDF] Launching browser (memory will increase temporarily)...');
    const launchOptions = {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--memory-pressure-off',
        '--disable-background-timer-throttling',
        '--disable-renderer-backgrounding'
      ]
    };
    browserInstance = await puppeteer.launch(launchOptions);
  }
  
  // Auto-cerrar browser después de 2 minutos de inactividad
  browserTimeout = setTimeout(async () => {
    if (browserInstance) {
      console.log('[PDF] Closing browser due to inactivity...');
      await browserInstance.close();
      browserInstance = null;
    }
  }, 2 * 60 * 1000);
  
  return browserInstance;
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
