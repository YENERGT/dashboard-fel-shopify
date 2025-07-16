import axios from 'axios';
import FormData from 'form-data';

// Configuración de WhatsApp API
const PHONE_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || '474682032406204';
const ACCESS_TOKEN = process.env.WHATSAPP_API_TOKEN;
const API_VERSION = process.env.WHATSAPP_API_VERSION || 'v20.0';
const API_URL = `https://graph.facebook.com/${API_VERSION}`;

// Configuración de plantilla de WhatsApp
const TEMPLATE_CONFIG = {
  name: 'dashboard_fel_envio_reporte',
  language: 'es',
  id: '1402530261074156',
  // Opciones de saludo para el parámetro {{1}}
  greetingOptions: {
    formal: 'Estimado Cliente',
    informal: 'Hola',
    timeBasedGreeting: true  // usar saludo basado en hora del día
  }
};

// Función principal para enviar mensajes por WhatsApp
export async function sendWhatsAppMessage(options) {
  const { to, message, documentBuffer, documentName, useTemplate = true, reportSummary } = options;
  
  try {
    // Si hay un documento PDF, primero lo subimos
    if (documentBuffer && documentName) {
      console.log('Iniciando envío de PDF por WhatsApp...');
      
      // Paso 1: Subir el PDF
      const mediaId = await uploadPDFBuffer(documentBuffer, documentName);
      console.log('PDF subido exitosamente. Media ID:', mediaId);
      
      // Paso 2: Si usamos plantilla, enviar mensaje con plantilla Y documento
      if (useTemplate) {
        // Parámetros para la plantilla
        const greeting = generatePersonalizedGreeting();
        const templateParams = [
          greeting,  // {{1}} - saludo personalizado
          reportSummary || 'Reporte de Dashboard FEL'  // {{2}} - resumen del reporte
        ];
        
        // Validar parámetros antes de enviar
        const validatedParams = validateTemplateParameters(templateParams);
        
        // Enviar mensaje con plantilla incluyendo el PDF
        const templateResult = await sendTemplateMessage(
          to,
          TEMPLATE_CONFIG.name,
          TEMPLATE_CONFIG.language,
          validatedParams,
          mediaId  // Pasar el mediaId del PDF
        );
        
        if (!templateResult.success) {
          console.error('Error al enviar plantilla:', templateResult.error);
          return templateResult;
        }
        
        return {
          success: true,
          messageId: templateResult.messageId,
          status: 'sent',
          templateSent: true
        };
      } else {
        // Si no usa plantilla, enviar documento separado
        const result = await sendDocumentMessage(to, mediaId, 'Reporte completo en PDF adjunto', documentName);
        console.log('Documento enviado exitosamente');
        
        return {
          success: true,
          messageId: result.messages[0].id,
          status: 'sent',
          templateSent: false
        };
      }
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

// Función para generar resumen conciso para la plantilla
export function generateReportSummary(reportData, tipo, dia, mes, anio) {
  const getMonthName = (month) => {
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                   'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return months[parseInt(month) - 1] || '';
  };
  
  const formatNumber = (num) => {
    return new Intl.NumberFormat('es-GT', { 
      style: 'currency', 
      currency: 'GTQ',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num || 0);
  };
  
  let period = '';
  if (tipo === "dia") {
    period = `del ${dia}/${mes}/${anio}`;
  } else if (tipo === "mes") {
    period = `de ${getMonthName(mes)} ${anio}`;
  } else {
    period = `del año ${anio}`;
  }
  
  let summary = `Dashboard FEL ${period}`;
  
  if (reportData.dataFEL) {
    summary += ` | Ventas: ${formatNumber(reportData.dataFEL.totalVentas)}`;
    summary += ` | ${reportData.dataFEL.totalPedidos || 0} pedidos`;
  }
  
  if (reportData.dataFinanciero) {
    const profit = reportData.dataFinanciero.profit;
    const estado = profit >= 0 ? 'Profit' : 'Pérdida';
    summary += ` | ${estado}: ${formatNumber(Math.abs(profit))}`;
  }
  
  return summary;
}

// Función para enviar mensaje usando plantilla con documento
async function sendTemplateMessage(to, templateName, templateLanguage, parameters, mediaId = null) {
  const cleanNumber = to.replace(/[^\d]/g, '');
  
  console.log('Enviando plantilla con documento:', {
    templateName,
    language: templateLanguage,
    to: cleanNumber,
    parameters,
    mediaId
  });
  
  // Construir componentes
  const components = [
    {
      type: 'body',
      parameters: parameters.map(param => ({
        type: 'text',
        text: param
      }))
    }
  ];
  
  // Si hay un mediaId, agregar el componente de documento
  if (mediaId) {
    components.push({
      type: 'header',
      parameters: [
        {
          type: 'document',
          document: {
            id: mediaId,
            filename: 'reporte.pdf'
          }
        }
      ]
    });
  }
  
  const payload = {
    messaging_product: 'whatsapp',
    to: cleanNumber,
    type: 'template',
    template: {
      name: templateName,
      language: {
        code: templateLanguage
      },
      components: components
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

    console.log('Plantilla con documento enviada exitosamente:', response.data);
    
    return {
      success: true,
      messageId: response.data.messages[0].id,
      status: 'sent'
    };

  } catch (error) {
    console.error('Error detallado al enviar plantilla:', {
      error: error.response?.data,
      status: error.response?.status,
      message: error.message
    });
    
    // Manejo específico de errores de plantilla
    let errorMessage = 'Error al enviar mensaje con plantilla';
    
    if (error.response?.data?.error) {
      const apiError = error.response.data.error;
      
      if (apiError.code === 132000) {
        errorMessage = 'La plantilla no está aprobada o no existe';
      } else if (apiError.code === 132012) {
        errorMessage = 'El formato de los parámetros no coincide con la plantilla';
      } else if (apiError.code === 100) {
        errorMessage = 'Parámetros inválidos en la plantilla';
      } else if (apiError.message) {
        errorMessage = apiError.message;
      }
    }
    
    return {
      success: false,
      error: errorMessage,
      details: error.response?.data
    };
  }
}

// Función para validar y truncar parámetros de plantilla
function validateTemplateParameters(params) {
  const MAX_PARAM_LENGTH = 1024; // Límite de WhatsApp para parámetros de texto
  
  return params.map((param, index) => {
    if (typeof param !== 'string') {
      param = String(param);
    }
    
    if (param.length > MAX_PARAM_LENGTH) {
      console.warn(`Parámetro ${index + 1} excede el límite, truncando...`);
      return param.substring(0, MAX_PARAM_LENGTH - 3) + '...';
    }
    
    return param;
  });
}

// Función para generar saludo personalizado
export function generatePersonalizedGreeting() {
  const now = new Date();
  const hour = now.getHours();
  
  // Saludos según la hora del día (hora de Guatemala)
  if (hour >= 5 && hour < 12) {
    return 'Buenos días';
  } else if (hour >= 12 && hour < 18) {
    return 'Buenas tardes';
  } else {
    return 'Buenas noches';
  }
}