import { MetricCard } from "../components/dashboard/MetricCard";
import { json } from "@remix-run/node";
import { useLoaderData, useSubmit } from "@remix-run/react";
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
  Banner,
  DataTable,
} from "@shopify/polaris";
import { useState, useCallback, useEffect } from "react";
import { authenticate } from "../shopify.server";
import { getGoogleSheetsData, getGoogleSheetsPagos } from "../utils/googleSheets.server";
import { processPagosData } from "../utils/processPagos.server";
import { getCachedData, invalidateCache } from "../utils/cache.server";
import {
  IngresosVsEgresosChart,
  GastosPorCategoriaChart,
  EvolucionGastosChart,
  TopEmpresasGastosChart,
  TablaDetalleGastos,
  TendenciaProfitChart,  // Nueva
  FlujoCajaChart         // Nueva
} from "../components/dashboard/FinancialCharts";

export async function loader({ request }) {
  await authenticate.admin(request);
  
  // MOVER LAS VARIABLES FUERA DEL TRY
  const url = new URL(request.url);
  const tipo = url.searchParams.get("tipo") || "mes";
  const dia = url.searchParams.get("dia") || "";
  const mes = url.searchParams.get("mes") || (new Date().getMonth() + 1).toString();
  const anio = url.searchParams.get("anio") || new Date().getFullYear().toString();
  
  try {
    const refreshCache = url.searchParams.get("refreshCache") === "true";

    if (refreshCache) {
      invalidateCache('financiero_data');
      invalidateCache('google_sheets_raw');
      console.log('[FINANCIERO] Cache invalidated by user request');
    }

    // Crear clave única para este conjunto de filtros
    const cacheKey = `financiero_data_${tipo}_${dia}_${mes}_${anio}`;

    // Obtener datos procesados con caché
    const processedData = await getCachedData(cacheKey, async () => {
      console.log(`[FINANCIERO] Processing data for ${tipo} - ${dia}/${mes}/${anio}`);
      
      // Obtener datos de ventas y pagos
      const [rawDataVentas, rawDataPagos] = await Promise.all([
        getGoogleSheetsData(),
        getGoogleSheetsPagos()
      ]);
      
      // Procesar los datos
      const processed = processPagosData(rawDataPagos, rawDataVentas, tipo, dia, mes, anio);
      
      console.log(`[FINANCIERO] Processed financial data successfully`);
      return processed;
    });
    
    if (!processedData) {
      throw new Error("No se pudieron procesar los datos");
    }
    
    return json({
      success: true,
      data: processedData,
      filters: { tipo, dia, mes, anio },
      cached: true
    });
  } catch (error) {
    console.error("Error en análisis financiero:", error);
    return json({
      success: false,
      error: error.message,
      data: {
        totalIngresos: 0,
        totalEgresos: 0,
        profit: 0,
        margenProfit: 0,
        gastosPorCategoria: {},
        gastosPorEmpresa: [],
        tendenciaGastos: 'neutral',
        totalPagos: 0,
        promedioGastoDiario: 0,
        ratioGastosIngresos: 0,
        ventasDiarias: {},
        gastosPorDia: {},
        categoriasOrdenadas: [],
        topEmpresas: [],
        detalleGastos: [],
        tipoVisualizacion: tipo,
        profitMensual: [],
        flujoSemanal: []
      },
      filters: { tipo, dia, mes, anio }
    });
  }
}

export default function AnalisisFinanciero() {
  const { success, data, filters, error } = useLoaderData();
  const submit = useSubmit();
  
  const [selectedTipo, setSelectedTipo] = useState(filters?.tipo || "mes");
  const [selectedDia, setSelectedDia] = useState(filters?.dia || "");
  const [selectedMes, setSelectedMes] = useState(filters?.mes || (new Date().getMonth() + 1).toString());
  const [selectedAnio, setSelectedAnio] = useState(filters?.anio || new Date().getFullYear().toString());

  const handleTipoChange = useCallback((value) => setSelectedTipo(value), []);
  const handleDiaChange = useCallback((value) => setSelectedDia(value), []);
  const handleMesChange = useCallback((value) => setSelectedMes(value), []);
  const handleAnioChange = useCallback((value) => setSelectedAnio(value), []);

  const handleSubmit = useCallback(() => {
    const formData = new FormData();
    formData.append("tipo", selectedTipo);
    formData.append("dia", selectedDia);
    formData.append("mes", selectedMes);
    formData.append("anio", selectedAnio);
    submit(formData, { method: "get" });
  }, [selectedTipo, selectedDia, selectedMes, selectedAnio, submit]);

  // Efecto para animaciones al cargar la página
  useEffect(() => {
    const cards = document.querySelectorAll('.dashboard-card, .polaris-card');
    cards.forEach((card, index) => {
      card.style.animationDelay = `${index * 0.1}s`;
      card.classList.add('animate__animated', 'animate__fadeInUp');
    });
    if (typeof window !== 'undefined' && window.NProgress) {
      window.NProgress.configure({ showSpinner: false, trickleSpeed: 200 });
    }
  }, [data]);

  if (!success) {
    return (
      <Page title="Análisis Financiero - Error">
        <Card>
          <Text as="p" variant="bodyMd" tone="critical">
            Error: {error}
          </Text>
        </Card>
      </Page>
    );
  }

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
    <Page title="Análisis Financiero" fullWidth>
      <BlockStack gap="500">
        {/* Header con filtros */}
        <Card>
          <BlockStack gap="400">
            <InlineStack align="space-between">
              <BlockStack gap="200">
                <Text as="h2" variant="headingLg">
                  💰 Análisis de Ingresos vs Egresos
                </Text>
                <Badge tone="info">
                  {data.tipoVisualizacion === 'dia' && `Día ${selectedDia}`}
                  {data.tipoVisualizacion === 'mes' && `Mes ${selectedMes}`}
                  {data.tipoVisualizacion === 'año' && `Año ${selectedAnio}`}
                </Badge>
              </BlockStack>
            </InlineStack>
            
            <Divider />
            
            <InlineStack gap="400" align="end">
              <Select
                label="Tipo de Vista"
                options={tipoOptions}
                value={selectedTipo}
                onChange={handleTipoChange}
              />
              
              {selectedTipo === "dia" && (
                <Select
                  label="Día"
                  options={diaOptions}
                  value={selectedDia}
                  onChange={handleDiaChange}
                />
              )}
              
              {(selectedTipo === "dia" || selectedTipo === "mes") && (
                <Select
                  label="Mes"
                  options={mesOptions}
                  value={selectedMes}
                  onChange={handleMesChange}
                />
              )}
              
              <Select
                label="Año"
                options={anioOptions}
                value={selectedAnio}
                onChange={handleAnioChange}
              />
              
              <Button primary onClick={handleSubmit}>
                Actualizar
              </Button>
            </InlineStack>
          </BlockStack>
        </Card>
        
        {/* Métricas principales */}
<InlineGrid columns={{ xs: 1, sm: 2, md: 2, lg: 4 }} gap="400">
  <MetricCard
    title="Total Ingresos"
    value={`Q ${data.totalIngresos ? data.totalIngresos.toFixed(2) : '0.00'}`}
    icon="💵"
    format="currency"
    delay={1}
    subtitle="Ventas del período"
  />

  <MetricCard
    title="Total Egresos"
    value={`Q ${data.totalEgresos ? data.totalEgresos.toFixed(2) : '0.00'}`}
    icon="💸"
    format="currency"
    delay={2}
    subtitle={`${data.totalPagos || 0} pagos realizados`}
  />

  <MetricCard
    title="Profit"
    value={`Q ${data.profit ? data.profit.toFixed(2) : '0.00'}`}
    icon="📊"
    format="currency"
    delay={3}
    tone={data.profit >= 0 ? "success" : "critical"}
    subtitle={`${data.margenProfit ? data.margenProfit.toFixed(1) : '0.0'}% margen`}
  />

  <MetricCard
    title="Ratio Gastos/Ingresos"
    value={`${data.ratioGastosIngresos ? data.ratioGastosIngresos.toFixed(1) : '0.0'}%`}
    icon="📈"
    format="percentage"
    delay={4}
    tone={data.ratioGastosIngresos <= 70 ? "success" : data.ratioGastosIngresos <= 85 ? "warning" : "critical"}
    subtitle={data.ratioGastosIngresos <= 70 ? "Saludable" : data.ratioGastosIngresos <= 85 ? "Aceptable" : "Alto"}
  />
</InlineGrid>

{/* Segunda fila de métricas */}
<InlineGrid columns={{ xs: 1, sm: 2, md: 3 }} gap="400">
  <MetricCard
    title="Promedio Gasto Diario"
    value={`Q ${data.promedioGastoDiario ? data.promedioGastoDiario.toFixed(2) : '0.00'}`}
    icon="💰"
    format="currency"
    delay={5}
  />

  <MetricCard
    title="Total Transacciones"
    value={data.totalPagos || 0}
    icon="📋"
    format="number"
    delay={6}
  />

  <Card>
  <BlockStack gap="200">
    <Text as="h3" variant="headingMd" tone="subdued">
      📈 Tendencia de Gastos
    </Text>
    <Badge size="large" tone={data.tendenciaGastos === 'down' ? 'success' : data.tendenciaGastos === 'up' ? 'warning' : 'info'}>
      {data.tendenciaGastos === 'up' && '↑ Al alza'}
      {data.tendenciaGastos === 'down' && '↓ A la baja'}
      {data.tendenciaGastos === 'neutral' && '→ Estable'}
    </Badge>
  </BlockStack>
</Card>
</InlineGrid>

        {/* Gráfica principal de comparación */}
<IngresosVsEgresosChart 
  totalIngresos={data.totalIngresos || 0}
  totalEgresos={data.totalEgresos || 0}
  profit={data.profit || 0}
/>

{/* Gráfica de evolución temporal */}
<EvolucionGastosChart 
  gastosPorDia={data.gastosPorDia || {}}
  ventasDiarias={data.ventasDiarias || {}}
  tipo={data.tipoVisualizacion || tipo}
/>

{/* Primera fila de gráficas */}
<InlineGrid 
  columns={{
    xs: 1,
    sm: 1,
    md: 2
  }} 
  gap={{
    xs: "300",
    sm: "400",
    md: "400"
  }}
>
  {data.categoriasOrdenadas && data.categoriasOrdenadas.length > 0 && (
    <GastosPorCategoriaChart categoriasOrdenadas={data.categoriasOrdenadas} />
  )}
  
  {data.topEmpresas && data.topEmpresas.length > 0 && (
    <TopEmpresasGastosChart topEmpresas={data.topEmpresas} />
  )}
</InlineGrid>

{/* Tabla de detalles */}
{data.detalleGastos && data.detalleGastos.length > 0 && (
  <TablaDetalleGastos detalleGastos={data.detalleGastos} />
)}

{/* Nueva fila de gráficas avanzadas */}
<InlineGrid 
  columns={{
    xs: 1,
    sm: 1,
    md: 2
  }} 
  gap={{
    xs: "300",
    sm: "400",
    md: "400"
  }}
>
  {data.profitMensual && data.profitMensual.length > 0 && (
    <TendenciaProfitChart profitMensual={data.profitMensual} />
  )}
  
  {data.flujoSemanal && data.flujoSemanal.length > 0 && (
    <FlujoCajaChart flujoSemanal={data.flujoSemanal} />
  )}
</InlineGrid>

{/* Resumen y recomendaciones */}
<Card>
  <BlockStack gap="400">
    <Text as="h3" variant="headingMd">
      📊 Análisis y Recomendaciones
    </Text>
    
    <BlockStack gap="200">
      {/* Estado del profit */}
      {data.profit >= 0 ? (
        <Banner status="success">
          <Text as="p" variant="bodyMd">
            ✅ La empresa está generando profit de Q {data.profit?.toFixed(2)} ({data.margenProfit?.toFixed(1)}% de margen)
          </Text>
        </Banner>
      ) : (
        <Banner status="critical">
          <Text as="p" variant="bodyMd">
            ⚠️ La empresa tiene pérdidas de Q {Math.abs(data.profit || 0).toFixed(2)}
          </Text>
        </Banner>
      )}
      
      {/* Análisis del ratio gastos/ingresos */}
      {data.ratioGastosIngresos <= 70 ? (
        <Text as="p" variant="bodyMd">
          ✅ <strong>Ratio Gastos/Ingresos Saludable:</strong> Los gastos representan el {data.ratioGastosIngresos?.toFixed(1)}% de los ingresos, lo cual es excelente.
        </Text>
      ) : data.ratioGastosIngresos <= 85 ? (
        <Text as="p" variant="bodyMd">
          ⚠️ <strong>Ratio Gastos/Ingresos Aceptable:</strong> Los gastos representan el {data.ratioGastosIngresos?.toFixed(1)}% de los ingresos. Considere optimizar gastos.
        </Text>
      ) : (
        <Text as="p" variant="bodyMd">
          🚨 <strong>Ratio Gastos/Ingresos Alto:</strong> Los gastos representan el {data.ratioGastosIngresos?.toFixed(1)}% de los ingresos. Es necesario reducir gastos urgentemente.
        </Text>
      )}
      
      {/* Mayor categoría de gastos */}
      {data.categoriasOrdenadas && data.categoriasOrdenadas[0] && (
        <Text as="p" variant="bodyMd">
          📌 La categoría con mayor gasto es <strong>{data.categoriasOrdenadas[0].categoria}</strong> con Q {data.categoriasOrdenadas[0].total.toFixed(2)} ({data.categoriasOrdenadas[0].porcentaje.toFixed(1)}% del total)
        </Text>
      )}
      
      {/* Tendencia de gastos */}
      {data.tendenciaGastos === 'up' && (
        <Text as="p" variant="bodyMd">
          📈 Los gastos muestran una <strong>tendencia al alza</strong>. Revise los gastos recientes para identificar incrementos inusuales.
        </Text>
      )}
      {data.tendenciaGastos === 'down' && (
        <Text as="p" variant="bodyMd">
          📉 Los gastos muestran una <strong>tendencia a la baja</strong>. Excelente control de gastos.
        </Text>
      )}
      
      {/* Recomendaciones específicas */}
      <Divider />
      <Text as="h4" variant="headingSm">
        💡 Recomendaciones:
      </Text>
      
      <BlockStack gap="100">
        {data.ratioGastosIngresos > 80 && (
          <Text as="p" variant="bodyMd">
            • Revisar y optimizar gastos en la categoría "{data.categoriasOrdenadas?.[0]?.categoria}"
          </Text>
        )}
        {data.margenProfit < 15 && data.margenProfit > 0 && (
          <Text as="p" variant="bodyMd">
            • El margen de profit es bajo. Considere aumentar precios o reducir costos
          </Text>
        )}
        {data.topEmpresas?.[0]?.porcentaje > 30 && (
          <Text as="p" variant="bodyMd">
            • {data.topEmpresas[0].empresa} representa más del 30% de los gastos. Considere diversificar proveedores
          </Text>
        )}
        <Text as="p" variant="bodyMd">
          • Mantener un fondo de emergencia equivalente a 3-6 meses de gastos operativos
        </Text>
        <Text as="p" variant="bodyMd">
          • Revisar mensualmente los gastos por categoría para identificar oportunidades de ahorro
        </Text>
      </BlockStack>
    </BlockStack>
  </BlockStack>
</Card>
      </BlockStack>
    </Page>
  );
}