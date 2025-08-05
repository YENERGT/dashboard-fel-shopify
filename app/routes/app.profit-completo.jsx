// Crear nuevo archivo: app/routes/app.profit-completo.jsx
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
  Banner,
  DataTable,
  Checkbox,
} from "@shopify/polaris";
import { useState, useCallback, useEffect } from "react";
import { authenticate } from "../shopify.server";
import { getGoogleSheetsData, getGoogleSheetsPagos } from "../utils/googleSheets.server";
import { processSheetData } from "../utils/processData.server";
import { processPagosData } from "../utils/processPagos.server";
import { getShopifyOrders, processShopifyOrders } from "../utils/shopifyOrders.server";
import { getCachedData, invalidateCache } from "../utils/cache.server.optimized";
import { MetricCard } from "../components/dashboard/MetricCard";
import { 
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import { Bar, Line, Doughnut } from "react-chartjs-2";
import { ChartWrapper } from "../components/dashboard/ChartWrapper";
import { chartColors, createGradient, baseChartOptions } from "../utils/chartConfig";

// Registrar componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export async function loader({ request }) {
  const { admin, session } = await authenticate.admin(request);
  
  const url = new URL(request.url);
  const tipo = url.searchParams.get("tipo") || "mes";
  const dia = url.searchParams.get("dia") || "";
  const mes = url.searchParams.get("mes") || (new Date().getMonth() + 1).toString();
  const anio = url.searchParams.get("anio") || new Date().getFullYear().toString();
  
  try {
    const refreshCache = url.searchParams.get("refreshCache") === "true";
    
    if (refreshCache) {
      invalidateCache('profit_completo_data');
      invalidateCache('shopify_orders');
      console.log('[PROFIT COMPLETO] Cache invalidated by user request');
    }
    
    const cacheKey = `profit_completo_${tipo}_${dia}_${mes}_${anio}`;
    
    const processedData = await getCachedData(cacheKey, async () => {
      console.log(`[PROFIT COMPLETO] Processing data for ${tipo} - ${dia}/${mes}/${anio}`);
      
      // Obtener datos en paralelo
      const [shopifyOrders, rawDataVentas, rawDataPagos] = await Promise.all([
        getShopifyOrders(admin, tipo, dia, mes, anio),
        getGoogleSheetsData(),
        getGoogleSheetsPagos()
      ]);
      
      // Procesar datos
      const shopifyStats = processShopifyOrders(shopifyOrders, tipo, dia);
      const felData = processSheetData(rawDataVentas, tipo, dia, mes, anio, false);
      const egresosData = processPagosData(rawDataPagos, rawDataVentas, tipo, dia, mes, anio);
      
      // Calcular profit completo
      const profitCompleto = {
        // Métricas principales
        totalShopify: shopifyStats.totalVentas,
        totalFEL: felData.totalVentas,
        totalEgresos: egresosData.totalEgresos,
        profitTotal: shopifyStats.totalVentas - egresosData.totalEgresos,
        profitFEL: felData.totalVentas - egresosData.totalEgresos,
        
        // Métricas adicionales
        margenProfitTotal: shopifyStats.totalVentas > 0 ? 
          ((shopifyStats.totalVentas - egresosData.totalEgresos) / shopifyStats.totalVentas) * 100 : 0,
        margenProfitFEL: felData.totalVentas > 0 ? 
          ((felData.totalVentas - egresosData.totalEgresos) / felData.totalVentas) * 100 : 0,
        
        // Datos para gráficas
        shopifyStats,
        felData,
        egresosData,
        
        // Comparación temporal
        ventasPorDia: {
          shopify: shopifyStats.ventasPorDia,
          fel: felData.ventasDiarias,
          egresos: egresosData.gastosPorDia
        }
      };
      
      return profitCompleto;
    });
    
    return json({
      success: true,
      data: processedData,
      filters: { tipo, dia, mes, anio },
      cached: true
    });
    
  } catch (error) {
    console.error("Error en profit completo:", error);
    return json({
      success: false,
      error: error.message,
      data: null,
      filters: { tipo, dia, mes, anio }
    });
  }
}

export default function ProfitCompleto() {
  const { success, data, filters, error } = useLoaderData();
  const submit = useSubmit();
  const navigation = useNavigation();
  const isLoading = navigation.state === "loading";
  
  // Estados para filtros
  const [selectedTipo, setSelectedTipo] = useState(filters?.tipo || "mes");
  const [selectedDia, setSelectedDia] = useState(filters?.dia || "");
  const [selectedMes, setSelectedMes] = useState(filters?.mes || (new Date().getMonth() + 1).toString());
  const [selectedAnio, setSelectedAnio] = useState(filters?.anio || new Date().getFullYear().toString());
  
  // Estados para toggles de gráficas
  const [showShopify, setShowShopify] = useState(true);
  const [showFEL, setShowFEL] = useState(true);
  const [showEgresos, setShowEgresos] = useState(true);
  
  const handleSubmit = useCallback(() => {
    const formData = new FormData();
    formData.append("tipo", selectedTipo);
    formData.append("dia", selectedDia);
    formData.append("mes", selectedMes);
    formData.append("anio", selectedAnio);
    submit(formData, { method: "get" });
  }, [selectedTipo, selectedDia, selectedMes, selectedAnio, submit]);
  
  const handleRefreshCache = useCallback(() => {
    const formData = new FormData();
    formData.append("tipo", selectedTipo);
    formData.append("dia", selectedDia);
    formData.append("mes", selectedMes);
    formData.append("anio", selectedAnio);
    formData.append("refreshCache", "true");
    submit(formData, { method: "get" });
  }, [selectedTipo, selectedDia, selectedMes, selectedAnio, submit]);
  
  if (!success) {
    return (
      <Page title="Profit Completo - Error">
        <Banner status="critical" title="Error al cargar datos">
          <p>{error}</p>
        </Banner>
      </Page>
    );
  }
  
  // Opciones de selección
  const tipoOptions = [
    { label: "Por Mes", value: "mes" },
    { label: "Por Día", value: "dia" },
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
  
  // Gráfica principal de comparación
  const mainChartData = {
    labels: ['Total Shopify', 'Total FEL', 'Total Egresos', 'Profit Total'],
    datasets: [
      {
        label: 'Monto en Q',
        data: [
          showShopify ? data.totalShopify : 0,
          showFEL ? data.totalFEL : 0,
          showEgresos ? data.totalEgresos : 0,
          data.profitTotal
        ],
        backgroundColor: (context) => {
          const colors = [
            showShopify ? chartColors.primary.light : 'rgba(200,200,200,0.3)',
            showFEL ? chartColors.info.light : 'rgba(200,200,200,0.3)',
            showEgresos ? chartColors.danger.light : 'rgba(200,200,200,0.3)',
            data.profitTotal >= 0 ? chartColors.success.light : chartColors.warning.light
          ];
          return colors[context.dataIndex];
        },
        borderColor: (context) => {
          const colors = [
            showShopify ? chartColors.primary.main : 'rgba(200,200,200,0.5)',
            showFEL ? chartColors.info.main : 'rgba(200,200,200,0.5)',
            showEgresos ? chartColors.danger.main : 'rgba(200,200,200,0.5)',
            data.profitTotal >= 0 ? chartColors.success.main : chartColors.warning.main
          ];
          return colors[context.dataIndex];
        },
        borderWidth: 2,
        borderRadius: 8,
      },
    ],
  };
  
  const mainChartOptions = {
    ...baseChartOptions,
    plugins: {
      ...baseChartOptions.plugins,
      legend: { display: false },
      tooltip: {
        ...baseChartOptions.plugins.tooltip,
        callbacks: {
          label: function(context) {
            const value = context.parsed.y;
            const label = context.label;
            return `${label}: Q ${value.toLocaleString('es-GT', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}`;
          }
        }
      }
    },
    scales: {
      x: { display: false },
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return `Q ${value.toLocaleString('es-GT')}`;
          }
        }
      }
    }
  };
  
  // Datos para desglose de ventas totales (Shopify)
  const salesBreakdownData = {
    labels: ['Ventas Netas', 'Impuestos', 'Envíos'],
    datasets: [
      {
        data: [
          data.shopifyStats.totalSubtotal,
          data.shopifyStats.totalImpuestos,
          data.shopifyStats.totalEnvio
        ],
        backgroundColor: [
          chartColors.primary.main,
          chartColors.info.main,
          chartColors.secondary.main
        ],
        borderColor: ['#fff','#fff','#fff'],
        borderWidth: 2
      }
    ]
  };
  // Datos para desglose de egresos (Shopify spend)
  const spendBreakdownData = {
    labels: ['Descuentos', 'Devoluciones', 'Comisiones'],
    datasets: [
      {
        data: [
          data.shopifyStats.totalDescuentos,
          data.shopifyStats.totalDevoluciones,
          data.shopifyStats.totalComisiones
        ],
        backgroundColor: [
          chartColors.warning.main,
          chartColors.danger.main,
          chartColors.success.main
        ],
        borderColor: ['#fff','#fff','#fff'],
        borderWidth: 2
      }
    ]
  };
  const breakdownOptions = {
    ...baseChartOptions,
    plugins: { ...baseChartOptions.plugins, legend: { position: 'right' } }
  };
  
  return (
    <Page title="Profit Completo" fullWidth>
      <BlockStack gap="500">
        {/* Header con filtros */}
        <Card>
          <BlockStack gap="400">
            <InlineStack align="space-between">
              <BlockStack gap="200">
                <Text as="h2" variant="headingLg">
                  💰 Análisis de Profit Completo - Shopify vs FEL
                </Text>
                <Badge tone="info">
                  {selectedTipo === 'dia' && `Día ${selectedDia}`}
                  {selectedTipo === 'mes' && `Mes ${selectedMes}`}
                  {` de ${selectedAnio}`}
                </Badge>
              </BlockStack>
            </InlineStack>
            
            <Divider />
            
            <InlineStack gap="400" align="end">
              <Select
                label="Tipo de Vista"
                options={tipoOptions}
                value={selectedTipo}
                onChange={setSelectedTipo}
              />
              
              {selectedTipo === "dia" && (
                <Select
                  label="Día"
                  options={diaOptions}
                  value={selectedDia}
                  onChange={setSelectedDia}
                />
              )}
              
              <Select
                label="Mes"
                options={mesOptions}
                value={selectedMes}
                onChange={setSelectedMes}
              />
              
              <Select
                label="Año"
                options={anioOptions}
                value={selectedAnio}
                onChange={setSelectedAnio}
              />
              
              <Button primary onClick={handleSubmit} loading={isLoading}>
                Actualizar
              </Button>
              
              <Button onClick={handleRefreshCache} outline>
                🔄 Actualizar Datos
              </Button>
            </InlineStack>
            
            {/* Toggles para mostrar/ocultar series */}
            <InlineStack gap="400">
              <Checkbox
                label="Mostrar Shopify"
                checked={showShopify}
                onChange={setShowShopify}
              />
              <Checkbox
                label="Mostrar FEL"
                checked={showFEL}
                onChange={setShowFEL}
              />
              <Checkbox
                label="Mostrar Egresos"
                checked={showEgresos}
                onChange={setShowEgresos}
              />
            </InlineStack>
          </BlockStack>
        </Card>
        
        {/* Métricas principales */}
        <InlineGrid columns={{ xs: 1, sm: 2, md: 2, lg: 4 }} gap="400">
          <MetricCard
            title="Total Shopify"
            value={`Q ${data.totalShopify.toFixed(2)}`}
            icon="🛍️"
            format="currency"
            delay={1}
            tone="success"
            subtitle={`${data.shopifyStats.totalPedidos} pedidos`}
          />
          
          <MetricCard
            title="Total FEL"
            value={`Q ${data.totalFEL.toFixed(2)}`}
            icon="📄"
            format="currency"
            delay={2}
            tone="info"
            subtitle={`${data.felData.totalPedidos} pedidos`}
          />
          
          <MetricCard
            title="Total Egresos"
            value={`Q ${data.totalEgresos.toFixed(2)}`}
            icon="💸"
            format="currency"
            delay={3}
            tone="critical"
            subtitle={`${data.egresosData.totalPagos} pagos`}
          />
          
          <MetricCard
            title="Profit Total"
            value={`Q ${data.profitTotal.toFixed(2)}`}
            icon="💎"
            format="currency"
            delay={4}
            tone={data.profitTotal >= 0 ? "success" : "critical"}
            subtitle={`${data.margenProfitTotal.toFixed(1)}% margen`}
          />
        </InlineGrid>
        
        {/* Segunda fila de métricas */}
        <InlineGrid columns={{ xs: 1, sm: 2, md: 3 }} gap="400">
          <MetricCard
            title="Diferencia Shopify vs FEL"
            value={`Q ${(data.totalShopify - data.totalFEL).toFixed(2)}`}
            icon="📊"
            format="currency"
            delay={5}
            tone={data.totalShopify > data.totalFEL ? "success" : "warning"}
            subtitle={`${((data.totalFEL / data.totalShopify) * 100).toFixed(1)}% en FEL`}
          />
          
          <MetricCard
            title="Ratio Egresos/Shopify"
            value={`${((data.totalEgresos / data.totalShopify) * 100).toFixed(1)}%`}
            icon="📈"
            format="percentage"
            delay={6}
            tone={data.margenProfitTotal > 20 ? "success" : data.margenProfitTotal > 10 ? "warning" : "critical"}
          />
          
          <MetricCard
            title="Ticket Promedio Shopify"
            value={`Q ${(data.totalShopify / data.shopifyStats.totalPedidos).toFixed(2)}`}
            icon="🎯"
            format="currency"
            delay={7}
          />
        </InlineGrid>
        
        {/* Desglose de Ventas Totales (Shopify) */}
        <InlineGrid columns={{ xs: 1, sm: 2, md: 3 }} gap="400">
          <MetricCard
            title="Ventas Netas"
            value={`Q ${data.shopifyStats.totalSubtotal.toFixed(2)}`}
            icon="📊"
            format="currency"
            delay={8}
          />
          <MetricCard
            title="Impuestos"
            value={`Q ${data.shopifyStats.totalImpuestos.toFixed(2)}`}
            icon="💵"
            format="currency"
            delay={9}
            tone="critical"
          />
          <MetricCard
            title="Envíos"
            value={`Q ${data.shopifyStats.totalEnvio.toFixed(2)}`}
            icon="🚚"
            format="currency"
            delay={10}
          />
          <MetricCard
            title="Descuentos"
            value={`Q ${data.shopifyStats.totalDescuentos.toFixed(2)}`}
            icon="🔖"
            format="currency"
            delay={11}
            tone="warning"
          />
          <MetricCard
            title="Devoluciones"
            value={`Q ${data.shopifyStats.totalDevoluciones.toFixed(2)}`}
            icon="↩️"
            format="currency"
            delay={12}
            tone="critical"
          />
          <MetricCard
            title="Comisiones"
            value={`Q ${data.shopifyStats.totalComisiones.toFixed(2)}`}
            icon="💳"
            format="currency"
            delay={13}
          />
        </InlineGrid>
        
        {/* Gráfica principal */}
        <Card>
          <BlockStack gap="400">
            <Text as="h3" variant="headingMd">
              📊 Comparación General
            </Text>
            <ChartWrapper delay={1}>
              <div style={{ height: "400px" }}>
                <Bar data={mainChartData} options={mainChartOptions} />
              </div>
            </ChartWrapper>
          </BlockStack>
        </Card>
        {/* Desglose de Ventas y Egresos */}
        <InlineGrid columns={{ xs: 1, md: 2 }} gap="400">
          <Card>
            <BlockStack gap="400">
              <Text as="h3" variant="headingMd">
                🏷️ Desglose de Ventas Totales
              </Text>
              <ChartWrapper delay={2}>
                <div style={{ height: "300px" }}>
                  <Doughnut data={salesBreakdownData} options={breakdownOptions} />
                </div>
              </ChartWrapper>
            </BlockStack>
          </Card>
          <Card>
            <BlockStack gap="400">
              <Text as="h3" variant="headingMd">
                🛒 Desglose de Egresos
              </Text>
              <ChartWrapper delay={3}>
                <div style={{ height: "300px" }}>
                  <Doughnut data={spendBreakdownData} options={breakdownOptions} />
                </div>
              </ChartWrapper>
            </BlockStack>
          </Card>
        </InlineGrid>
        
        {/* Gráfica de evolución temporal */}
        <Card>
          <BlockStack gap="400">
            <Text as="h3" variant="headingMd">
              📈 Evolución Temporal
            </Text>
            {/* Botones para mostrar/ocultar líneas */}
            <InlineStack gap="200">
              <Button plain pressed={showShopify} onClick={() => setShowShopify(prev => !prev)}>
                Shopify
              </Button>
              <Button plain pressed={showFEL} onClick={() => setShowFEL(prev => !prev)}>
                FEL
              </Button>
              <Button plain pressed={showEgresos} onClick={() => setShowEgresos(prev => !prev)}>
                Egresos
              </Button>
            </InlineStack>
            <Divider />
            <ChartWrapper delay={2}>
              <TemporalChart 
                data={data.ventasPorDia} 
                tipo={selectedTipo}
                showShopify={showShopify}
                showFEL={showFEL}
                showEgresos={showEgresos}
              />
            </ChartWrapper>
          </BlockStack>
        </Card>
        
        {/* Gráficas en grid */}
        <InlineGrid columns={{ xs: 1, md: 2 }} gap="400">
          {/* Canales de venta Shopify */}
          <Card>
            <BlockStack gap="400">
              <Text as="h3" variant="headingMd">
                🛒 Ventas por Canal (Shopify)
              </Text>
              <ChartWrapper delay={3}>
                <CanalesChart data={data.shopifyStats.ventasPorCanal} />
              </ChartWrapper>
            </BlockStack>
          </Card>
          
          {/* Comparación de márgenes */}
          <Card>
            <BlockStack gap="400">
              <Text as="h3" variant="headingMd">
                💹 Comparación de Márgenes
              </Text>
              <ChartWrapper delay={4}>
                <MargenesChart 
                  margenTotal={data.margenProfitTotal}
                  margenFEL={data.margenProfitFEL}
                />
              </ChartWrapper>
            </BlockStack>
          </Card>
        </InlineGrid>
        
        {/* Tabla comparativa de productos */}
        <Card>
          <BlockStack gap="400">
            <Text as="h3" variant="headingMd">
              📦 Top Productos - Shopify vs FEL
            </Text>
            <ProductosComparativaTable 
              productosShopify={data.shopifyStats.topProductosShopify}
              productosFEL={data.felData.topProductos}
            />
          </BlockStack>
        </Card>
        
        {/* Resumen y recomendaciones */}
        <Card>
          <BlockStack gap="400">
            <Text as="h3" variant="headingMd">
              💡 Análisis y Recomendaciones
            </Text>
            
            <BlockStack gap="200">
              {/* Estado del negocio */}
              {data.profitTotal >= 0 ? (
                <Banner status="success">
                  <Text as="p" variant="bodyMd">
                    ✅ El negocio está generando profit de Q {data.profitTotal.toFixed(2)} 
                    ({data.margenProfitTotal.toFixed(1)}% de margen sobre ventas Shopify)
                  </Text>
                </Banner>
              ) : (
                <Banner status="critical">
                  <Text as="p" variant="bodyMd">
                    ⚠️ El negocio tiene pérdidas de Q {Math.abs(data.profitTotal).toFixed(2)}
                  </Text>
                </Banner>
              )}
              
              {/* Análisis FEL vs Shopify */}
              <Text as="p" variant="bodyMd">
                📊 <strong>Facturación FEL:</strong> Representa el {((data.totalFEL / data.totalShopify) * 100).toFixed(1)}% 
                de las ventas totales en Shopify. {data.totalFEL < data.totalShopify * 0.9 && 
                'Considere revisar por qué no todas las ventas se están facturando.'}
              </Text>
              
              {/* Recomendaciones específicas */}
              <Divider />
              <Text as="h4" variant="headingSm">
                💡 Recomendaciones:
              </Text>
              
              <BlockStack gap="100">
                {data.margenProfitTotal < 15 && (
                  <Text as="p" variant="bodyMd">
                    • El margen de profit es bajo ({data.margenProfitTotal.toFixed(1)}%). 
                    Considere revisar precios o reducir costos operativos.
                  </Text>
                )}
                
                {data.totalFEL < data.totalShopify * 0.8 && (
                  <Text as="p" variant="bodyMd">
                    • Hay una diferencia significativa entre ventas Shopify y facturación FEL. 
                    Implemente procesos para asegurar la facturación de todas las ventas.
                  </Text>
                )}
                
                {data.shopifyStats.ventasPorCanal.length > 3 && (
                  <Text as="p" variant="bodyMd">
                    • Está vendiendo en {data.shopifyStats.ventasPorCanal.length} canales diferentes. 
                    Analice la rentabilidad por canal para optimizar recursos.
                  </Text>
                )}
                
                <Text as="p" variant="bodyMd">
                  • Mantenga un monitoreo constante de la relación entre ventas totales y egresos.
                </Text>
              </BlockStack>
            </BlockStack>
          </BlockStack>
        </Card>
      </BlockStack>
    </Page>
  );
}

// Componente para gráfica temporal
function TemporalChart({ data, tipo, showShopify, showFEL, showEgresos }) {
  const labels = tipo === 'dia' 
    ? Array.from({ length: 24 }, (_, i) => `${i}:00`)
    : Array.from({ length: 31 }, (_, i) => `Día ${i + 1}`);
  
  const chartData = {
    labels,
    datasets: [
      showShopify && {
        label: 'Shopify',
        data: labels.map((_, i) => data.shopify[tipo === 'dia' ? i : i + 1] || 0),
        borderColor: chartColors.primary.main,
        backgroundColor: chartColors.primary.light,
        tension: 0.4,
        fill: true,
      },
      showFEL && {
        label: 'FEL',
        data: labels.map((_, i) => data.fel[tipo === 'dia' ? i : i + 1] || 0),
        borderColor: chartColors.info.main,
        backgroundColor: chartColors.info.light,
        tension: 0.4,
        fill: true,
      },
      showEgresos && {
        label: 'Egresos',
        data: labels.map((_, i) => data.egresos[tipo === 'dia' ? i : i + 1] || 0),
        borderColor: chartColors.danger.main,
        backgroundColor: chartColors.danger.light,
        tension: 0.4,
        fill: true,
        borderDash: [5, 5],
      },
    ].filter(Boolean),
  };
  
  const options = {
    ...baseChartOptions,
    plugins: { ...baseChartOptions.plugins, legend: { display: false } },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return `Q ${value.toLocaleString()}`;
          }
        }
      }
    }
  };
  
  return (
    <div style={{ height: "350px" }}>
      <Line data={chartData} options={options} />
    </div>
  );
}

// Componente para gráfica de canales
function CanalesChart({ data }) {
  const chartData = {
    labels: data.map(c => c.canal),
    datasets: [
      {
        data: data.map(c => c.total),
        backgroundColor: chartColors.palette,
        borderWidth: 2,
        borderColor: '#fff',
        hoverOffset: 15,
      },
    ],
  };
  
  const options = {
    ...baseChartOptions,
    plugins: {
      ...baseChartOptions.plugins,
      legend: {
        position: 'right',
        labels: {
          generateLabels: function(chart) {
            const data = chart.data;
            return data.labels.map((label, i) => ({
              text: `${label} (${chart.data.datasets[0].data[i].toFixed(0)})`,
              fillStyle: data.datasets[0].backgroundColor[i],
              strokeStyle: '#fff',
              lineWidth: 2,
              hidden: false,
              index: i
            }));
          }
        }
      }
    }
  };
  
  return (
    <div style={{ height: "300px" }}>
      <Doughnut data={chartData} options={options} />
    </div>
  );
}

// Componente para gráfica de márgenes
function MargenesChart({ margenTotal, margenFEL }) {
  const chartData = {
    labels: ['Margen sobre Shopify', 'Margen sobre FEL'],
    datasets: [
      {
        label: 'Margen %',
        data: [margenTotal, margenFEL],
        backgroundColor: [
          margenTotal >= 20 ? chartColors.success.main : 
          margenTotal >= 10 ? chartColors.warning.main : 
          chartColors.danger.main,
          margenFEL >= 20 ? chartColors.success.main : 
          margenFEL >= 10 ? chartColors.warning.main : 
          chartColors.danger.main
        ],
        borderWidth: 2,
        borderRadius: 8,
      },
    ],
  };
  
  const options = {
    ...baseChartOptions,
    indexAxis: 'y',
    plugins: {
      ...baseChartOptions.plugins,
      legend: { display: false },
    },
    scales: {
      x: {
        beginAtZero: true,
        max: 100,
        ticks: {
          callback: function(value) {
            return value + '%';
          }
        }
      }
    }
  };
  
  return (
    <div style={{ height: "300px" }}>
      <Bar data={chartData} options={options} />
    </div>
  );
}

// Componente para tabla comparativa
function ProductosComparativaTable({ productosShopify, productosFEL }) {
  const rows = [];
  const maxLength = Math.max(productosShopify.length, productosFEL.length);
  
  for (let i = 0; i < Math.min(maxLength, 5); i++) {
    const shopify = productosShopify[i];
    const fel = productosFEL[i];
    
    rows.push([
      shopify ? shopify.nombre : '-',
      shopify ? `Q ${shopify.total.toFixed(2)}` : '-',
      fel ? fel.nombre : '-',
      fel ? `Q ${fel.total.toFixed(2)}` : '-',
    ]);
  }
  
  return (
    <DataTable
      columnContentTypes={["text", "numeric", "text", "numeric"]}
      headings={[
        "Producto Shopify",
        "Total Shopify",
        "Producto FEL",
        "Total FEL"
      ]}
      rows={rows}
    />
  );
}