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
import { useState, useCallback } from "react";
import { authenticate } from "../shopify.server";
import { getGoogleSheetsData, getGoogleSheetsPagos } from "../utils/googleSheets.server";
import { processPagosData } from "../utils/processPagos.server";
import {
  IngresosVsEgresosChart,
  GastosPorCategoriaChart,
  EvolucionGastosChart,
  TopEmpresasGastosChart,
  TablaDetalleGastos
} from "../components/dashboard/FinancialCharts";

export async function loader({ request }) {
  await authenticate.admin(request);
  
  try {
    const url = new URL(request.url);
    const tipo = url.searchParams.get("tipo") || "mes";
    const dia = url.searchParams.get("dia") || "";
    const mes = url.searchParams.get("mes") || (new Date().getMonth() + 1).toString();
    const anio = url.searchParams.get("anio") || new Date().getFullYear().toString();
    
    // Obtener datos de ventas y pagos
    const [rawDataVentas, rawDataPagos] = await Promise.all([
      getGoogleSheetsData(),
      getGoogleSheetsPagos()
    ]);
    
    // Procesar los datos
    const processedData = processPagosData(rawDataPagos, rawDataVentas, tipo, dia, mes, anio);
    
    if (!processedData) {
      throw new Error("No se pudieron procesar los datos");
    }
    
    return json({
      success: true,
      data: processedData,
      filters: { tipo, dia, mes, anio }
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
        ratioGastosIngresos: 0
      },
      filters: { tipo: "mes", dia: "", mes: (new Date().getMonth() + 1).toString(), anio: new Date().getFullYear().toString() }
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
  <Card>
    <BlockStack gap="200">
      <Text as="h3" variant="headingMd" tone="subdued">
        💵 Total Ingresos
      </Text>
      <Text as="p" variant="heading2xl" tone="success">
        Q {data.totalIngresos ? data.totalIngresos.toFixed(2) : '0.00'}
      </Text>
      <Text as="p" variant="bodySm" tone="subdued">
        Ventas del período
      </Text>
    </BlockStack>
  </Card>

  <Card>
    <BlockStack gap="200">
      <Text as="h3" variant="headingMd" tone="subdued">
        💸 Total Egresos
      </Text>
      <Text as="p" variant="heading2xl" tone="critical">
        Q {data.totalEgresos ? data.totalEgresos.toFixed(2) : '0.00'}
      </Text>
      <Text as="p" variant="bodySm" tone="subdued">
        {data.totalPagos || 0} pagos realizados
      </Text>
    </BlockStack>
  </Card>

  <Card>
    <BlockStack gap="200">
      <Text as="h3" variant="headingMd" tone="subdued">
        📊 Profit
      </Text>
      <Text as="p" variant="heading2xl" tone={data.profit >= 0 ? "success" : "critical"}>
        Q {data.profit ? data.profit.toFixed(2) : '0.00'}
      </Text>
      <Badge tone={data.profit >= 0 ? "success" : "critical"}>
        {data.margenProfit ? data.margenProfit.toFixed(1) : '0.0'}% margen
      </Badge>
    </BlockStack>
  </Card>

  <Card>
    <BlockStack gap="200">
      <Text as="h3" variant="headingMd" tone="subdued">
        📈 Ratio Gastos/Ingresos
      </Text>
      <Text as="p" variant="heading2xl" tone={data.ratioGastosIngresos <= 70 ? "success" : data.ratioGastosIngresos <= 85 ? "warning" : "critical"}>
        {data.ratioGastosIngresos ? data.ratioGastosIngresos.toFixed(1) : '0.0'}%
      </Text>
      <Text as="p" variant="bodySm" tone="subdued">
        {data.ratioGastosIngresos <= 70 ? "Saludable" : data.ratioGastosIngresos <= 85 ? "Aceptable" : "Alto"}
      </Text>
    </BlockStack>
  </Card>
</InlineGrid>

{/* Segunda fila de métricas */}
<InlineGrid columns={{ xs: 1, sm: 2, md: 3 }} gap="400">
  <Card>
    <BlockStack gap="200">
      <Text as="h3" variant="headingMd" tone="subdued">
        💰 Promedio Gasto Diario
      </Text>
      <Text as="p" variant="headingXl">
        Q {data.promedioGastoDiario ? data.promedioGastoDiario.toFixed(2) : '0.00'}
      </Text>
    </BlockStack>
  </Card>

  <Card>
    <BlockStack gap="200">
      <Text as="h3" variant="headingMd" tone="subdued">
        📋 Total Transacciones
      </Text>
      <Text as="p" variant="headingXl">
        {data.totalPagos || 0}
      </Text>
    </BlockStack>
  </Card>

  <Card>
    <BlockStack gap="200">
      <Text as="h3" variant="headingMd" tone="subdued">
        📈 Tendencia de Gastos
      </Text>
      <Badge tone={data.tendenciaGastos === 'down' ? 'success' : data.tendenciaGastos === 'up' ? 'warning' : 'info'}>
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