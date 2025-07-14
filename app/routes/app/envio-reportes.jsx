import { json } from "express";
import { sendWhatsAppMessage, validateWhatsAppNumber } from "../utils/whatsappService.server";
import { generatePDFBuffer } from "../utils/pdfGenerator.server";

// ...existing code...

async function enviarReporte(reportData, metodoEnvio, numeroWhatsapp, tipo, dia, mes, anio) {
  if (metodoEnvio === 'whatsapp') {
    // Validar número de WhatsApp
    const validation = validateWhatsAppNumber(numeroWhatsapp);
    if (!validation.isValid) {
      return json({
        success: false,
        error: validation.error
      }, { status: 400 });
    }
    
    // Generar mensaje de WhatsApp
    const whatsappMessage = generateWhatsAppMessage(
      reportData,
      tipo,
      dia,
      mes,
      anio
    );
    
    // Generar PDF buffer para adjuntar
    console.log("Enviando WhatsApp a:", validation.cleaned);
    const pdfBuffer = await generatePDFBuffer(reportData.html);
    const pdfName = `reporte-${tipo}-${anio}${mes}${dia || ''}.pdf`;
    const whatsappResult = await sendWhatsAppMessage({
      to: validation.cleaned,
      message: whatsappMessage,
      documentBuffer: pdfBuffer,
      documentName: pdfName
    });
    
    if (!whatsappResult.success) {
      return json({
        success: false,
        error: whatsappResult.error || 'Error al enviar WhatsApp'
      }, { status: 500 });
    }
  }

  // ...existing code for other envio methods...
}