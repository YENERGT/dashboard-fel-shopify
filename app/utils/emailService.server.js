import nodemailer from 'nodemailer';
import { generatePDFBuffer } from './pdfGenerator.server';

// Configuración del transporter de email
const createTransporter = () => {
  // Para producción, usar las credenciales reales de tu servidor SMTP
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: port,
    secure: port === 465,
    auth: {
      user: process.env.SMTP_USER || 'info@gruporevisa.net',
      pass: process.env.SMTP_PASS || 'yzbdpypzkbpoypfq'
    },
    tls: { rejectUnauthorized: false },
    logger: true,
    debug: true
  });
};

export async function sendEmailReport(options) {
   const {
     to,
     subject,
     htmlContent,
     attachmentName = 'reporte.html'
   } = options;
   
   const transporter = createTransporter();
   try {
     // Verificar conexión y credenciales antes de enviar
     await transporter.verify();
     // Generar PDF a partir de HTML
     const pdfBuffer = await generatePDFBuffer(htmlContent);
     const pdfName = attachmentName.endsWith('.html')
      ? attachmentName.replace(/\.html$/, '.pdf')
      : attachmentName + '.pdf';
     // Configurar el mensaje con PDF adjunto
     const mailOptions = {
       from: {
         name: 'Dashboard FEL',
         address: process.env.SMTP_USER || 'info@gruporevisa.net'
       },
       to: to,
       subject: subject || 'Reporte Dashboard FEL',
       html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Reporte Dashboard FEL</h2>
          <p>Estimado usuario,</p>
          <p>Adjunto encontrará el reporte en PDF con el análisis detallado de su negocio.</p>
          <p>El reporte incluye:</p>
          <ul>
            <li>Análisis completo de ventas</li>
            <li>Métricas y tendencias</li>
            <li>Comparaciones con períodos anteriores</li>
            <li>Gráficas y tablas detalladas</li>
          </ul>
          <p>Para una mejor visualización, abra el archivo PDF adjunto en su lector de PDF.</p>
          <br>
          <p>Saludos cordiales,<br>
          Sistema Dashboard FEL</p>
        </div>
      `,
      attachments: [
        {
          filename: pdfName,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
     };
    // Enviar el email
    const info = await transporter.sendMail(mailOptions);
     
     return {
       success: true,
       messageId: info.messageId,
       response: info.response
     };
   } catch (error) {
     console.error('Error al enviar email:', error);
     return {
       success: false,
       error: error.message
     };
   }
}

// Función para enviar email de prueba
export async function sendTestEmail(to) {
  const transporter = createTransporter();
  
  try {
    await transporter.verify();
    
    const info = await transporter.sendMail({
      from: process.env.SMTP_USER || 'info@gruporevisa.net',
      to: to,
      subject: 'Prueba de configuración - Dashboard FEL',
      text: 'Este es un email de prueba para verificar la configuración del servidor SMTP.',
      html: '<p>Este es un email de prueba para verificar la configuración del servidor SMTP.</p>'
    });
    
    return {
      success: true,
      messageId: info.messageId
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}