// Servicio para enviar mensajes por WhatsApp Business API
// Puedes usar servicios como Twilio, WhatsApp Business API, o MessageBird

import FormData from 'form-data';
import fetch from 'node-fetch';

// Media upload then document send for WhatsApp Business API
export async function sendWhatsAppMessage(options) {
  const { to, message, mediaUrl, documentBuffer, documentName, templateName, templateLanguage, templateVariables } = options;
  // If a templateName is provided, send a template message
  if (templateName) {
    return sendViaWhatsAppTemplate(to, templateName, templateLanguage || 'en_US', templateVariables || []);
  }
  
  // Opción 1: Usar Twilio (necesitas cuenta de Twilio)
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    return sendViaTwilio(to, message, mediaUrl);
  }
  
  // Opción 2: Usar WhatsApp Business API directamente
  if (process.env.WHATSAPP_API_TOKEN) {
    return sendViaWhatsAppAPI(to, message, mediaUrl, documentBuffer, documentName);
  }
  
  // Opción 3: Usar un webhook o servicio personalizado
  return sendViaWebhook(to, message, mediaUrl);
}

// Implementación con Twilio
async function sendViaTwilio(to, message, mediaUrl) {
  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const client = require('twilio')(accountSid, authToken);
    
    const messageOptions = {
      body: message,
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER || '+14155238886'}`,
      to: `whatsapp:${to}`
    };
    
    if (mediaUrl) {
      messageOptions.mediaUrl = [mediaUrl];
    }
    
    const result = await client.messages.create(messageOptions);
    
    return {
      success: true,
      messageId: result.sid,
      status: result.status
    };
  } catch (error) {
    console.error('Error al enviar WhatsApp via Twilio:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Implementación con WhatsApp Business API
async function sendViaWhatsAppAPI(to, message, mediaUrl, documentBuffer, documentName) {
  try {
    const apiUrl = process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v17.0';
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const token = process.env.WHATSAPP_API_TOKEN;
        const cleanNumber = to.replace(/[^\d]/g, '');
    let mediaId;
    // If documentBuffer provided, upload first
    if (documentBuffer) {
      const form = new FormData();
      // Specify messaging product for WhatsApp API
      form.append('messaging_product', 'whatsapp');
      form.append('file', documentBuffer, { filename: documentName, contentType: 'application/pdf' });
      // Upload document with proper multipart headers and query parameter
      const uploadRes = await fetch(`${apiUrl}/${phoneNumberId}/media`, {
        method: 'POST',
        headers: {
          ...form.getHeaders(),
          'Authorization': `Bearer ${token}`
        },
        body: form
      });
      const uploadResult = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadResult.error?.message || 'Error uploading media');
      mediaId = uploadResult.id;
    }
    // Build payload
    let payload = { messaging_product: 'whatsapp', to: cleanNumber };
    if (documentBuffer) {
      payload.type = 'document';
      // incluir caption con el mensaje de texto
      payload.document = { id: mediaId, filename: documentName, caption: message };
    } else if (mediaUrl) {
      payload.type = 'image';
      payload.image = { link: mediaUrl };
    } else {
      payload.type = 'text';
      payload.text = { body: message };
    }
    
    const response = await fetch(`${apiUrl}/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    const result = await response.json();
    
    // Log para depuración: Muestra la respuesta completa de la API de WhatsApp
    console.log('Respuesta de la API de WhatsApp:', JSON.stringify(result, null, 2));
    
    if (!response.ok) {
      // Log detallado del error
      console.error('Error en la respuesta de la API de WhatsApp:', result.error);
      throw new Error(result.error?.message || 'Error al enviar mensaje');
    }
    
    return {
      success: true,
      messageId: result.messages?.[0]?.id,
      status: 'sent'
    };
  } catch (error) {
    console.error('Error al enviar WhatsApp via API:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Nueva implementación para enviar plantillas de WhatsApp
async function sendViaWhatsAppTemplate(to, templateName, templateLanguage, templateVariables = []) {
  const apiUrl = process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v17.0';
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const token = process.env.WHATSAPP_API_TOKEN;
  const cleanNumber = to.replace(/[^\d]/g, '');

  const payload = {
    messaging_product: 'whatsapp',
    to: cleanNumber,
    type: 'template',
    template: {
      name: templateName,
      language: { code: templateLanguage },
      components: [
        {
          type: 'body',
          parameters: templateVariables.map(text => ({ type: 'text', text }))
        }
      ]
    }
  };

  const response = await fetch(`${apiUrl}/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error?.message || 'Error al enviar plantilla');

  return {
    success: true,
    messageId: result.messages?.[0]?.id,
    status: 'sent'
  };
}

// Implementación con webhook personalizado
async function sendViaWebhook(to, message, mediaUrl) {
  try {
    // Esta es una implementación de ejemplo usando un webhook
    // Puedes reemplazarlo con tu servicio preferido
    
    const webhookUrl = process.env.WHATSAPP_WEBHOOK_URL;
    
    if (!webhookUrl) {
      // Si no hay configuración, crear enlace de WhatsApp Web
      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://wa.me/${to.replace(/[^\d]/g, '')}?text=${encodedMessage}`;
      
      return {
        success: true,
        whatsappUrl,
        requiresManualSend: true,
        instructions: 'Abra el siguiente enlace para enviar el mensaje por WhatsApp'
      };
    }
    
    // Si hay webhook configurado, usarlo
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.WHATSAPP_WEBHOOK_TOKEN || ''}`
      },
      body: JSON.stringify({
        to,
        message,
        mediaUrl
      })
    });
    
    const result = await response.json();
    
    return {
      success: response.ok,
      ...result
    };
  } catch (error) {
    console.error('Error al enviar WhatsApp via webhook:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Función para validar número de WhatsApp
export function validateWhatsAppNumber(number) {
  // Remover espacios y caracteres especiales excepto +
  const cleaned = number.replace(/[^\d+]/g, '');
  
  // Verificar que empiece con + y tenga entre 10 y 15 dígitos
  const regex = /^\+\d{10,15}$/;
  
  return {
    isValid: regex.test(cleaned),
    cleaned: cleaned,
    error: !regex.test(cleaned) ? 'El número debe incluir código de país (ej: +50212345678)' : null
  };
}

// Función para formatear mensaje para WhatsApp
export function formatMessageForWhatsApp(text) {
  // WhatsApp soporta formato básico con * para negrita y _ para cursiva
  return text
    .replace(/\n\n/g, '\n \n') // Doble salto de línea
    .substring(0, 4096); // Límite de caracteres de WhatsApp
}

export function generateWhatsAppMessage(reportData, tipo, dia, mes, anio) {
  if (!reportData || !reportData.data) return "Adjunto encontrarás tu reporte.";

  const { totalVentas, totalPedidos, promedioPorPedido } = reportData.data;
  const periodo =
    tipo === "dia"
      ? `el día ${dia}/${mes}/${anio}`
      : tipo === "mes"
      ? `el mes ${mes}/${anio}`
      : `el año ${anio}`;

  let message = `*Resumen del Reporte para ${periodo}*\n\n`;
  message += `📈 *Ventas Totales:* ${new Intl.NumberFormat("es-GT", { style: "currency", currency: "GTQ" }).format(totalVentas || 0)}\n`;
  message += `📦 *Total de Pedidos:* ${totalPedidos || 0}\n`;
  message += `💰 *Ticket Promedio:* ${new Intl.NumberFormat("es-GT", { style: "currency", currency: "GTQ" }).format(promedioPorPedido || 0)}\n\n`;
  message += "📄 El PDF adjunto contiene el análisis detallado con gráficas, tablas y comparativas.";

  return formatMessageForWhatsApp(message);
}