import axios from 'axios';
import FormData from 'form-data';

// Configuración de WhatsApp API
const PHONE_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || '474682032406204';
const ACCESS_TOKEN = process.env.WHATSAPP_API_TOKEN;
const API_VERSION = process.env.WHATSAPP_API_VERSION || 'v20.0';
const API_URL = `https://graph.facebook.com/${API_VERSION}`;

// Función principal para enviar mensajes por WhatsApp
export async function sendWhatsAppMessage(options) {
  const { to, message, documentBuffer, documentName } = options;
  
  try {
    // Si hay un documento PDF, primero lo subimos
    if (documentBuffer && documentName) {
      console.log('Iniciando envío de PDF por WhatsApp...');
      
      // Paso 1: Subir el PDF
      const mediaId = await uploadPDFBuffer(documentBuffer, documentName);
      console.log('PDF subido exitosamente. Media ID:', mediaId);
      
      // Paso 2: Enviar mensaje con el PDF
      const result = await sendDocumentMessage(to, mediaId, message, documentName);
      console.log('Mensaje enviado exitosamente');
      
      return {
        success: true,
        messageId: result.messages[0].id,
        status: 'sent'
      };
    } else {
      // Si es solo texto, enviar mensaje de texto
      return await sendTextMessage(to, message);
    }
  } catch (error) {
    console.error('Error en sendWhatsAppMessage:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.error?.message || error.message
    };
  }
}

// Función para subir PDF
async function uploadPDFBuffer(pdfBuffer, filename) {
  const formData = new FormData();
  
  // Convertir buffer a stream
  const { Readable } = await import('stream');
  const stream = Readable.from(pdfBuffer);
  
  // Configurar FormData con todos los parámetros obligatorios
  formData.append('messaging_product', 'whatsapp');
  formData.append('file', stream, {
    filename: filename,
    contentType: 'application/pdf'
  });

  try {
    const response = await axios({
      method: 'POST',
      url: `${API_URL}/${PHONE_ID}/media`,
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        ...formData.getHeaders()
      },
      data: formData,
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      timeout: 60000 // 60 segundos
    });

    if (!response.data.id) {
      throw new Error('No se recibió media ID de la API');
    }

    return response.data.id;
  } catch (error) {
    console.error('Error al subir PDF:', error.response?.data || error.message);
    throw error;
  }
}

// Función para enviar mensaje con documento
async function sendDocumentMessage(to, mediaId, caption, filename) {
  const cleanNumber = to.replace(/[^\d]/g, '');
  
  const payload = {
    messaging_product: 'whatsapp',
    to: cleanNumber,
    type: 'document',
    document: {
      id: mediaId,
      caption: caption || 'Documento adjunto',
      filename: filename
    }
  };

  try {
    const response = await axios({
      method: 'POST',
      url: `${API_URL}/${PHONE_ID}/messages`,
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      data: payload
    });

    return response.data;
  } catch (error) {
    console.error('Error al enviar mensaje:', error.response?.data || error.message);
    throw error;
  }
}

// Función para enviar mensaje de texto simple
async function sendTextMessage(to, message) {
  const cleanNumber = to.replace(/[^\d]/g, '');
  
  const payload = {
    messaging_product: 'whatsapp',
    to: cleanNumber,
    type: 'text',
    text: {
      body: message
    }
  };

  try {
    const response = await axios({
      method: 'POST',
      url: `${API_URL}/${PHONE_ID}/messages`,
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      data: payload
    });

    return {
      success: true,
      messageId: response.data.messages[0].id,
      status: 'sent'
    };
  } catch (error) {
    console.error('Error al enviar mensaje de texto:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.error?.message || error.message
    };
  }
}

// Función para validar número de WhatsApp
export function validateWhatsAppNumber(number) {
  const cleaned = number.replace(/[^\d+]/g, '');
  const regex = /^\+\d{10,15}$/;
  
  return {
    isValid: regex.test(cleaned),
    cleaned: cleaned,
    error: !regex.test(cleaned) ? 'El número debe incluir código de país (ej: +50212345678)' : null
  };
}

// Función para generar mensaje de WhatsApp
export function generateWhatsAppMessage(reportData, tipo, dia, mes, anio) {
  const getMonthName = (month) => {
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                   'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return months[parseInt(month) - 1] || '';
  };
  
  const formatNumber = (num) => {
    return new Intl.NumberFormat('es-GT', { 
      style: 'currency', 
      currency: 'GTQ' 
    }).format(num || 0);
  };
  
  let period = '';
  if (tipo === "dia") {
    period = `${dia}/${mes}/${anio}`;
  } else if (tipo === "mes") {
    period = `${getMonthName(mes)} ${anio}`;
  } else {
    period = `Año ${anio}`;
  }
  
  let message = `📊 *REPORTE DASHBOARD FEL*\n`;
  message += `📅 Período: ${period}\n\n`;
  
  if (reportData.dataFEL) {
    message += `*ANÁLISIS DE VENTAS*\n`;
    message += `💰 Total Ventas: ${formatNumber(reportData.dataFEL.totalVentas)}\n`;
    message += `📦 Total Pedidos: ${reportData.dataFEL.totalPedidos || 0}\n`;
    message += `💵 Ventas Netas: ${formatNumber(reportData.dataFEL.ventasNetas)}\n`;
    message += `📊 Promedio/Pedido: ${formatNumber(reportData.dataFEL.promedioPorPedido)}\n\n`;
    
    if (reportData.dataFEL.topClientes && reportData.dataFEL.topClientes.length > 0) {
      message += `*TOP 3 CLIENTES*\n`;
      reportData.dataFEL.topClientes.slice(0, 3).forEach((cliente, i) => {
        message += `${i + 1}. ${cliente.nombre}: ${formatNumber(cliente.total)}\n`;
      });
      message += '\n';
    }
  }
  
  if (reportData.dataFinanciero) {
    message += `*ANÁLISIS FINANCIERO*\n`;
    message += `💵 Ingresos: ${formatNumber(reportData.dataFinanciero.totalIngresos)}\n`;
    message += `💸 Egresos: ${formatNumber(reportData.dataFinanciero.totalEgresos)}\n`;
    message += `📊 Profit: ${formatNumber(reportData.dataFinanciero.profit)}\n`;
    message += `📈 Margen: ${reportData.dataFinanciero.margenProfit?.toFixed(1) || '0.0'}%\n\n`;
    
    if (reportData.dataFinanciero.profit >= 0) {
      message += `✅ Estado: PROFIT POSITIVO\n`;
    } else {
      message += `⚠️ Estado: PÉRDIDAS\n`;
    }
  }
  
  message += `\n📱 Reporte completo adjunto en PDF.`;
  
  return message;
}