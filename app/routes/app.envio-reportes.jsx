import { json } from "@remix-run/node";
import { useLoaderData, useSubmit, useNavigation } from "@remix-run/react";
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
import { useState, useCallback } from "react";
import { authenticate } from "../shopify.server";

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
    // Aquí procesaremos el envío
    console.log("Datos recibidos:", data);
    
    return json({
      success: true,
      message: "Reporte enviado exitosamente"
    });
  } catch (error) {
    return json({
      success: false,
      error: error.message
    }, { status: 400 });
  }
}

export default function EnvioReportes() {
  const loaderData = useLoaderData();
  const submit = useSubmit();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  
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
    // Validaciones
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
    
    // Validar formato de email
    if (metodoEnvio === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailDestino)) {
      setMensaje({ tipo: "critical", texto: "El email ingresado no es válido" });
      return;
    }
    
    // Validar formato de WhatsApp (código de país + número)
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
    
    submit(formData, { method: "post" });
    setMensaje({ tipo: "info", texto: "Procesando envío..." });
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