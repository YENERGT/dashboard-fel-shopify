import { json } from "@remix-run/node";
import { useLoaderData, useSubmit, useNavigation, useActionData } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  Text,
  BlockStack,
  InlineGrid,
  Select,
  Button,
  InlineStack,
  Badge,
  Divider,
  TextField,
  RadioButton,
  Checkbox,
  Banner,
  Spinner,
} from "@shopify/polaris";
import { useState, useCallback, useEffect } from "react";
import { authenticate } from "../shopify.server";
import { generateHTMLReport } from "../utils/generateReports.server";
import { sendEmailReport } from "../utils/emailService.server";
import { sendWhatsAppMessage, validateWhatsAppNumber } from "../utils/whatsappService.server";
import { generatePDFBuffer } from "../utils/pdfGenerator.server";

export async function loader({ request }) {
  await authenticate.admin(request);
  
  return json({
    success: true
  });
}

export async function action({ request }) {
  await authenticate.admin(request);
  
  const formData = await request.formData();
  const data = Object.fromEntries(formData);
  
  try {
    // Validar datos
    const {
      metodoEnvio,
      reportesFEL,
      reportesFinanciero,
      tipo,
      dia,
      mes,
      anio,
      emailDestino,
      numeroWhatsapp,
      incluirComparacion
    } = data;
    
    // Convertir strings a booleanos
    const includeFEL = reportesFEL === 'true';
    const includeFinanciero = reportesFinanciero === 'true';
    const includeComparison = incluirComparacion === 'true';
    
    // Validar que al menos un reporte esté seleccionado
    if (!includeFEL && !includeFinanciero) {
      return json({
        success: false,
        error: "Debe seleccionar al menos un tipo de reporte"
      }, { status: 400 });
    }
    
    // Generar el reporte HTML
    console.log("Generando reporte...");
    const reportData = await generateHTMLReport({
      tipo,
      dia,
      mes,
      anio,
      reportesFEL: includeFEL,
      reportesFinanciero: includeFinanciero,
      incluirComparacion: includeComparison
    });
    
    // Enviar según el método seleccionado
    if (metodoEnvio === 'email') {
      // Validar email
      if (!emailDestino || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailDestino)) {
        return json({
          success: false,
          error: "Email inválido"
        }, { status: 400 });
      }
      
      // Preparar el asunto del email
      const periodo = tipo === 'dia' ? `Día ${dia}/${mes}/${anio}` : 
                     tipo === 'mes' ? `Mes ${mes}/${anio}` : 
                     `Año ${anio}`;
      
      const tiposReporte = [];
      if (includeFEL) tiposReporte.push('Dashboard FEL');
      if (includeFinanciero) tiposReporte.push('Análisis Financiero');
      
      const subject = `Reporte ${tiposReporte.join(' y ')} - ${periodo}`;
      const attachmentName = `reporte-${tipo}-${anio}${mes}${dia || ''}.html`;
      
      // Enviar email
      console.log("Enviando email a:", emailDestino);
      const emailResult = await sendEmailReport({
        to: emailDestino,
        subject: subject,
        htmlContent: reportData.html,
        attachmentName: attachmentName
      });
      
      if (!emailResult.success) {
        return json({
          success: false,
          error: emailResult.error || 'Error al enviar email'
        }, { status: 500 });
      }
      
      return json({
        success: true,
        message: `Reporte enviado exitosamente a ${emailDestino}`,
        method: 'email',
        details: emailResult
      });
      
    } else if (metodoEnvio === 'whatsapp') {
      // Validar número de WhatsApp
      const validation = validateWhatsAppNumber(numeroWhatsapp);
      if (!validation.isValid) {
        return json({
          success: false,
          error: validation.error
        }, { status: 400 });
      }
      
      // Generar PDF del reporte
      const pdfBuffer = await generatePDFBuffer(reportData.html);
      const pdfName = `reporte-${tipo}-${anio}${mes}${dia || ''}.pdf`;
      
      // Enviar PDF por WhatsApp
      console.log("Enviando WhatsApp PDF a:", validation.cleaned);
      const whatsappResult = await sendWhatsAppMessage({
        to: validation.cleaned,
        documentBuffer: pdfBuffer,
        documentName: pdfName
      });
      
      if (!whatsappResult.success) {
        return json({
          success: false,
          error: whatsappResult.error || 'Error al enviar WhatsApp'
        }, { status: 500 });
      }
      
      // Si requiere envío manual (WhatsApp Web)
      if (whatsappResult.requiresManualSend) {
        return json({
          success: true,
          message: "Enlace de WhatsApp generado. Haga clic para enviar el mensaje.",
          method: 'whatsapp',
          whatsappUrl: whatsappResult.whatsappUrl,
          requiresManualSend: true
        });
      }
      
      return json({
        success: true,
        message: `Reporte enviado exitosamente a ${numeroWhatsapp}`,
        method: 'whatsapp',
        details: whatsappResult
      });
    }
    
  } catch (error) {
    console.error("Error en action:", error);
    return json({
      success: false,
      error: error.message || "Error al procesar el envío"
    }, { status: 500 });
  }
}

export default function EnvioReportes() {
  const loaderData = useLoaderData();
  const submit = useSubmit();
  const navigation = useNavigation();
  const actionData = useActionData();
  const isSubmitting = navigation.state === "submitting";
  
  // Mostrar resultado de la action
  useEffect(() => {
    if (actionData) {
      if (actionData.success) {
        setMensaje({ tipo: 'success', texto: actionData.message });
        if (actionData.method === 'whatsapp' && actionData.requiresManualSend) {
          setTimeout(() => window.open(actionData.whatsappUrl, '_blank'), 1000);
        }
        if (metodoEnvio === 'email') setEmailDestino(''); else setNumeroWhatsapp('');
      } else {
        setMensaje({ tipo: 'critical', texto: actionData.error });
      }
    }
  }, [actionData]);

  // Estados para el formulario
  const [metodoEnvio, setMetodoEnvio] = useState("email");
  const [reportesFEL, setReportesFEL] = useState(true);
  const [reportesFinanciero, setReportesFinanciero] = useState(false);
  const [tipo, setTipo] = useState("mes");
  const [dia, setDia] = useState("");
  const [mes, setMes] = useState((new Date().getMonth() + 1).toString());
  const [anio, setAnio] = useState(new Date().getFullYear().toString());
  const [emailDestino, setEmailDestino] = useState("");
  const [numeroWhatsapp, setNumeroWhatsapp] = useState("");
  const [incluirComparacion, setIncluirComparacion] = useState(true);
  const [mensaje, setMensaje] = useState(null);

  const handleSubmit = useCallback(() => {
    // Validaciones existentes...
    if (!reportesFEL && !reportesFinanciero) {
      setMensaje({ tipo: "warning", texto: "Debe seleccionar al menos un tipo de reporte" });
      return;
    }
    
    if (metodoEnvio === "email" && !emailDestino) {
      setMensaje({ tipo: "critical", texto: "Debe ingresar un email de destino" });
      return;
    }
    
    if (metodoEnvio === "whatsapp" && !numeroWhatsapp) {
      setMensaje({ tipo: "critical", texto: "Debe ingresar un número de WhatsApp" });
      return;
    }
    
    if (metodoEnvio === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailDestino)) {
      setMensaje({ tipo: "critical", texto: "El email ingresado no es válido" });
      return;
    }
    
    if (metodoEnvio === "whatsapp" && !/^\+\d{10,15}$/.test(numeroWhatsapp)) {
      setMensaje({ tipo: "critical", texto: "El número debe incluir código de país (ej: +50212345678)" });
      return;
    }
    
    const formData = new FormData();
    formData.append("metodoEnvio", metodoEnvio);
    formData.append("reportesFEL", reportesFEL);
    formData.append("reportesFinanciero", reportesFinanciero);
    formData.append("tipo", tipo);
    formData.append("dia", dia);
    formData.append("mes", mes);
    formData.append("anio", anio);
    formData.append("emailDestino", emailDestino);
    formData.append("numeroWhatsapp", numeroWhatsapp);
    formData.append("incluirComparacion", incluirComparacion);
    
    setMensaje({ tipo: "info", texto: "Procesando envío..." });
    submit(formData, { method: 'post' });
  }, [metodoEnvio, reportesFEL, reportesFinanciero, tipo, dia, mes, anio, emailDestino, numeroWhatsapp, incluirComparacion, submit]);

  const tipoOptions = [
    { label: "Por Mes", value: "mes" },
    { label: "Por Día", value: "dia" },
    { label: "Por Año", value: "año" },
  ];

  const diaOptions = [
    { label: "Seleccione día", value: "" },
    ...Array.from({ length: 31 }, (_, i) => ({
      label: (i + 1).toString(),
      value: (i + 1).toString(),
    })),
  ];

  const mesOptions = [
    { label: "Enero", value: "1" },
    { label: "Febrero", value: "2" },
    { label: "Marzo", value: "3" },
    { label: "Abril", value: "4" },
    { label: "Mayo", value: "5" },
    { label: "Junio", value: "6" },
    { label: "Julio", value: "7" },
    { label: "Agosto", value: "8" },
    { label: "Septiembre", value: "9" },
    { label: "Octubre", value: "10" },
    { label: "Noviembre", value: "11" },
    { label: "Diciembre", value: "12" },
  ];

  const anioOptions = Array.from({ length: 11 }, (_, i) => ({
    label: (2030 - i).toString(),
    value: (2030 - i).toString(),
  }));

  return (
    <Page title="Envío de Reportes" fullWidth>
      <BlockStack gap="500">
        {/* Mensajes */}
        {mensaje && (
          <Banner status={mensaje.tipo} onDismiss={() => setMensaje(null)}>
            <p>{mensaje.texto}</p>
          </Banner>
        )}
        
        {/* Configuración del reporte */}
        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingLg">
                  📊 Configuración del Reporte
                </Text>
                
                <Divider />
                
                {/* Selección de reportes */}
                <BlockStack gap="300">
                  <Text as="h3" variant="headingMd">
                    Tipos de Reporte
                  </Text>
                  
                  <Checkbox
                    label="Dashboard FEL - Análisis de Ventas"
                    checked={reportesFEL}
                    onChange={setReportesFEL}
                    helpText="Incluye ventas, clientes, productos y análisis geográfico"
                  />
                  
                  <Checkbox
                    label="Análisis Financiero - Ingresos vs Egresos"
                    checked={reportesFinanciero}
                    onChange={setReportesFinanciero}
                    helpText="Incluye profit, gastos por categoría y recomendaciones"
                  />
                  
                  <Checkbox
                    label="Incluir comparación con período anterior"
                    checked={incluirComparacion}
                    onChange={setIncluirComparacion}
                    helpText="Agrega porcentajes de cambio y tendencias"
                  />
                </BlockStack>
                
                <Divider />
                
                {/* Período del reporte */}
                <BlockStack gap="300">
                  <Text as="h3" variant="headingMd">
                    Período del Reporte
                  </Text>
                  
                  <InlineStack gap="400" align="start">
                    <Select
                      label="Tipo de Vista"
                      options={tipoOptions}
                      value={tipo}
                      onChange={setTipo}
                    />
                    
                    {tipo === "dia" && (
                      <Select
                        label="Día"
                        options={diaOptions}
                        value={dia}
                        onChange={setDia}
                      />
                    )}
                    
                    {(tipo === "dia" || tipo === "mes") && (
                      <Select
                        label="Mes"
                        options={mesOptions}
                        value={mes}
                        onChange={setMes}
                      />
                    )}
                    
                    <Select
                      label="Año"
                      options={anioOptions}
                      value={anio}
                      onChange={setAnio}
                    />
                  </InlineStack>
                </BlockStack>
              </BlockStack>
            </Card>
          </Layout.Section>
          
          <Layout.Section variant="oneThird">
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingLg">
                  📤 Método de Envío
                </Text>
                
                <Divider />
                
                <BlockStack gap="300">
                  <RadioButton
                    label="Email"
                    helpText="Enviar por correo electrónico"
                    checked={metodoEnvio === "email"}
                    onChange={() => setMetodoEnvio("email")}
                  />
                  
                  <RadioButton
                    label="WhatsApp"
                    helpText="Enviar por WhatsApp Business"
                    checked={metodoEnvio === "whatsapp"}
                    onChange={() => setMetodoEnvio("whatsapp")}
                  />
                </BlockStack>
                
                <Divider />
                
                {/* Campos según método de envío */}
                {metodoEnvio === "email" ? (
                  <TextField
                    label="Email de destino"
                    type="email"
                    value={emailDestino}
                    onChange={setEmailDestino}
                    placeholder="ejemplo@empresa.com"
                    helpText="El reporte será enviado desde info@gruporevisa.net"
                    autoComplete="email"
                  />
                ) : (
                  <TextField
                    label="Número de WhatsApp"
                    type="tel"
                    value={numeroWhatsapp}
                    onChange={setNumeroWhatsapp}
                    placeholder="+50212345678"
                    helpText="Incluya el código de país (ej: +502 para Guatemala)"
                    autoComplete="tel"
                  />
                )}
                
                <Button
                  primary
                  fullWidth
                  size="large"
                  onClick={handleSubmit}
                  loading={isSubmitting}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Enviando..." : `Enviar por ${metodoEnvio === "email" ? "Email" : "WhatsApp"}`}
                </Button>
              </BlockStack>
            </Card>
            
            {/* Información adicional */}
            <Card>
              <BlockStack gap="300">
                <Text as="h3" variant="headingMd">
                  ℹ️ Información
                </Text>
                
                <BlockStack gap="200">
                  <Text as="p" variant="bodyMd">
                    <strong>Email:</strong> El reporte será enviado como archivo HTML adjunto con diseño profesional.
                  </Text>
                  
                  <Text as="p" variant="bodyMd">
                    <strong>WhatsApp:</strong> Se enviará un resumen del reporte con enlace para ver el completo.
                  </Text>
                  
                  <Text as="p" variant="bodyMd" tone="subdued">
                    Los reportes incluyen gráficas, tablas y análisis detallado según el período seleccionado.
                  </Text>
                </BlockStack>
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}