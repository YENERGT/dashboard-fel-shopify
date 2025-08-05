import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { PrefetchLink } from "../components/PrefetchLink";
import { MetricCard } from "../components/dashboard/MetricCard";
import {
  Page,
  Layout,
  Card,
  BlockStack,
  Text,
  Button,
  InlineGrid,
  Banner,
  Box,
  InlineStack,
  Badge,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { getGoogleSheetsData } from "../utils/googleSheets.server";
import { processSheetData } from "../utils/processData.server";

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  
  try {
    // Obtener datos de Google Sheets
    const rawData = await getGoogleSheetsData();
    
    // Obtener fecha actual
    const today = new Date(new Date().toLocaleString("en-US", {timeZone: "America/Guatemala"}));
    const currentMonth = (today.getMonth() + 1).toString();
    const currentYear = today.getFullYear().toString();
    const currentDay = today.getDate().toString();
    
    // Procesar datos del día actual
    const dataHoy = processSheetData(rawData, "dia", currentDay, currentMonth, currentYear);
    
    // Procesar datos del mes actual
    const dataMes = processSheetData(rawData, "mes", "", currentMonth, currentYear);
    
    // Procesar datos del año actual
    const dataAnio = processSheetData(rawData, "año", "", "", currentYear);
    
    // Calcular clientes únicos del mes
    const clientesUnicosMes = new Set();
    if (dataMes.topClientes) {
      dataMes.topClientes.forEach(cliente => clientesUnicosMes.add(cliente.nombre));
    }
    
    // Calcular total de productos vendidos en el mes
    let productosVendidosMes = 0;
    if (dataMes.topProductos) {
      productosVendidosMes = dataMes.topProductos.reduce((total, producto) => total + producto.cantidad, 0);
    }
    
    // Obtener ciudades únicas del año
    const ciudadesUnicas = new Set();
    if (dataAnio.topCiudades) {
      dataAnio.topCiudades.forEach(ciudad => ciudadesUnicas.add(ciudad.ciudad));
    }
    
    const summaryData = {
      ventasHoy: `Q ${dataHoy.totalVentas.toFixed(2)}`,
      ventasMes: `Q ${dataMes.totalVentas.toFixed(2)}`,
      clientesActivos: clientesUnicosMes.size,
      productosVendidos: productosVendidosMes,
      ciudadesAlcanzadas: ciudadesUnicas.size,
      pedidosHoy: dataHoy.totalPedidos,
      pedidosMes: dataMes.totalPedidos,
      ticketPromedioHoy: dataHoy.totalPedidos > 0 ? `Q ${(dataHoy.totalVentas / dataHoy.totalPedidos).toFixed(2)}` : "Q 0.00",
      ultimaActualizacion: new Date().toLocaleString('es-GT', {
  timeZone: 'America/Guatemala',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit'
}),
    };
    
    return json({
      currentDate: new Date().toLocaleDateString('es-GT'),
      currentTime: new Date().toLocaleTimeString('es-GT'),
      summary: summaryData,
      success: true,
    });
  } catch (error) {
    console.error("Error al cargar datos del resumen:", error);
    
    // En caso de error, devolver datos por defecto
    return json({
      currentDate: new Date().toLocaleDateString('es-GT'),
      currentTime: new Date().toLocaleTimeString('es-GT'),
      summary: {
        ventasHoy: "Q 0.00",
        ventasMes: "Q 0.00",
        clientesActivos: 0,
        productosVendidos: 0,
        ciudadesAlcanzadas: 0,
        pedidosHoy: 0,
        pedidosMes: 0,
        ticketPromedioHoy: "Q 0.00",
        ultimaActualizacion: new Date().toLocaleString('es-GT', {
  timeZone: 'America/Guatemala',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit'
}),
      },
      success: false,
      error: error.message,
    });
  }
};

export default function Index() {
  const { currentDate, currentTime, summary, success, error } = useLoaderData();

  const navigationCards = [
    {
      title: "📊 Dashboard Principal",
      description: "Analiza ventas, clientes y productos en tiempo real",
      buttonText: "Ver Dashboard",
      buttonPrimary: true,
      link: "/app/dashboard",
    },
    {
      title: "💰 Análisis Financiero",
      description: "Revisa ingresos vs egresos y flujo de caja",
      buttonText: "Ver Análisis",
      buttonPrimary: false,
      link: "/app/analisis-financiero",
    },
    {
      title: "💎 Profit Completo",
      description: "Analiza ventas totales de Shopify, FEL y egresos desde datos reales de Shopify",
      buttonText: "Ver Profit Completo",
      buttonPrimary: false,
      link: "/app/profit-completo",
    },
    {
    title: "📧 Envío de Reportes",
    description: "Envía reportes automáticos por WhatsApp",
    buttonText: "Configurar Envíos",
    buttonPrimary: false,
    link: "/app/envio-reportes",
  },
    {
      title: "⚙️ Configuración",
      description: "Configura tu conexión con Google Sheets",
      buttonText: "Ajustes",
      buttonPrimary: false,
      link: "/app/settings",
    },
  ];

  return (
    <Page>
      <BlockStack gap="600">
        {/* Banner de Bienvenida */}
        <Banner
          title="Bienvenido al Dashboard FEL"
          status="info"
          onDismiss={() => {}}
        >
          <Text as="p" variant="bodyMd">
            Sistema completo de análisis de facturas electrónicas integrado con Shopify
          </Text>
        </Banner>

        {/* Mostrar error si hay problemas de conexión */}
        {!success && error && (
          <Banner
            title="Error de conexión"
            status="critical"
          >
            <Text as="p" variant="bodyMd">
              No se pudieron cargar los datos de Google Sheets. Error: {error}
            </Text>
          </Banner>
        )}

        {/* Resumen Rápido */}
        <Card>
          <BlockStack gap="400">
            <InlineStack align="space-between">
              <Text as="h2" variant="headingLg">
                📈 Resumen Rápido
              </Text>
              <Badge tone="info">
                {currentDate} - {currentTime}
              </Badge>
            </InlineStack>
            
            <InlineGrid columns={{ xs: 1, sm: 2, md: 4 }} gap="400">
              <MetricCard
                title="Ventas Hoy"
                value={summary.ventasHoy}
                icon="💵"
                format="currency"
                delay={1}
                subtitle={`${summary.pedidosHoy || 0} pedidos`}
                tone="success"
              />
              
              <MetricCard
                title="Ventas del Mes"
                value={summary.ventasMes}
                icon="📊"
                format="currency"
                delay={2}
                subtitle={`${summary.pedidosMes || 0} pedidos`}
                tone="info"
              />
              
              <MetricCard
                title="Clientes Activos"
                value={summary.clientesActivos}
                icon="👥"
                format="number"
                delay={3}
                subtitle="Este mes"
                tone="attention"
              />
              
              <MetricCard
                title="Productos Vendidos"
                value={summary.productosVendidos}
                icon="📦"
                format="number"
                delay={4}
                subtitle="Este mes"
                tone="magic"
              />
            </InlineGrid>
            
            {/* Estadísticas adicionales */}
            <InlineGrid columns={{ xs: 1, sm: 2, md: 3 }} gap="400">
              <MetricCard
                title="Ticket Promedio Hoy"
                value={summary.ticketPromedioHoy}
                icon="🎯"
                format="currency"
                delay={5}
              />
              
              <MetricCard
                title="Ciudades Alcanzadas"
                value={summary.ciudadesAlcanzadas}
                icon="🏙️"
                format="number"
                delay={6}
                subtitle="Este año"
              />
              
              <Card sectioned>
                <BlockStack gap="200">
                  <Text as="h4" variant="headingMd">
                    📈 Estado
                  </Text>
                  <Badge tone={success ? "success" : "warning"}>
                    {success ? "Conectado" : "Sin conexión"}
                  </Badge>
                </BlockStack>
              </Card>
            </InlineGrid>
            
            <Box paddingBlockStart="200">
              <Text as="p" variant="bodySm" tone="subdued">
                Última actualización: {summary.ultimaActualizacion}
              </Text>
            </Box>
          </BlockStack>
        </Card>

        {/* Tarjetas de Navegación */}
        <BlockStack gap="400">
          <Text as="h2" variant="headingLg">
            🚀 Acceso Rápido
          </Text>
          
          <InlineGrid columns={{ xs: 1, sm: 2, md: 2, lg: 2 }} gap="400">
            {navigationCards.map((card, index) => (
              <Card key={index}>
                <BlockStack gap="400">
                  <Text as="h3" variant="headingMd">
                    {card.title}
                  </Text>
                  
                  <Text as="p" variant="bodyMd" tone="subdued">
                    {card.description}
                  </Text>
                  
                  <PrefetchLink to={card.link} style={{ textDecoration: 'none' }}>
                    <Button fullWidth primary={card.buttonPrimary}>
                      {card.buttonText}
                    </Button>
                  </PrefetchLink>
                </BlockStack>
              </Card>
            ))}
          </InlineGrid>
        </BlockStack>

        {/* Información adicional */}
        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  ℹ️ Información del Sistema
                </Text>
                
                <InlineGrid columns={{ xs: 1, sm: 2, md: 3 }} gap="200">
                  <InlineStack gap="200">
                    <Text as="p" variant="bodyMd">
                      📍 {summary.ciudadesAlcanzadas} ciudades alcanzadas
                    </Text>
                  </InlineStack>
                  
                  <InlineStack gap="200">
                    <Text as="p" variant="bodyMd">
                      📅 Datos actualizados al día
                    </Text>
                  </InlineStack>
                  
                  <InlineStack gap="200">
                    <Text as="p" variant="bodyMd">
                      📊 Análisis en tiempo real
                    </Text>
                  </InlineStack>
                </InlineGrid>
                
                <Box paddingBlockStart="200">
                  <Text as="p" variant="bodySm" tone="subdued">
                    Dashboard FEL v1.0.0 - Desarrollado para análisis avanzado de facturas electrónicas
                  </Text>
                </Box>
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}