import { EnhancedDataTable } from "../components/dashboard/EnhancedDataTable";
import { MetricCard } from "../components/dashboard/MetricCard";
import { json } from "@remix-run/node";
import { exportToCSV } from "../utils/exportData";
import { useLoaderData, useSubmit, useNavigation } from "@remix-run/react";
import { getCachedData, invalidateCache } from "../utils/cache.server";
import {
  Page,
  Layout,
  Card,
  DataTable,
  Text,
  BlockStack,
  InlineGrid,
  Select,
  Button,
  InlineStack,
  Badge,
  Divider,
} from "@shopify/polaris";
import { useState, useCallback, useEffect } from "react";
import { getGoogleSheetsData } from "../utils/googleSheets.server";
import { processSheetData } from "../utils/processData.server";
import { 
  VentasChart,          // ✅ Correcto (antes era VentasPorDiaChart)
  HorasChart,           // ✅ Correcto (antes era VentasPorHoraChart)
  ProductosChart,       // ✅ Correcto (antes era TopProductosChart)
  EstadosChart,         // ✅ Correcto (antes era EstadosPedidosChart)
  MetodosChart,         // ✅ Correcto (antes era MetodosPagoChart)
  CiudadesChart,        // ✅ Correcto (antes era VentasPorCiudadChart)
  DepartamentosChart,   // ✅ Correcto (antes era VentasPorDepartamentoChart)
  CategoriasChart,      // ✅ Correcto (antes era CategoriaProductosChart)
  MarcasChart,          // ✅ Correcto (antes era MarcasVehiculosChart)
  NITsChart             // ✅ Correcto (antes era TopNITsChart)
} from "../components/dashboard/DashboardCharts";

export async function loader({ request }) {
  try {
    const url = new URL(request.url);
    const tipo = url.searchParams.get("tipo") || "mes";
    const dia = url.searchParams.get("dia") || "";
    const mes = url.searchParams.get("mes") || (new Date().getMonth() + 1).toString();
    const anio = url.searchParams.get("anio") || new Date().getFullYear().toString();
    
    const refreshCache = url.searchParams.get("refreshCache") === "true";
    
    if (refreshCache) {
      invalidateCache('dashboard_data');
      invalidateCache('google_sheets_raw');
      console.log('[DASHBOARD] Cache invalidated by user request');
    }
    
    // Crear clave única para este conjunto de filtros
    const cacheKey = `dashboard_data_${tipo}_${dia}_${mes}_${anio}`;
    
    const processedData = await getCachedData(cacheKey, async () => {
      console.log(`[DASHBOARD] Processing data for ${tipo} - ${dia}/${mes}/${anio}`);
      
      const rawData = await getGoogleSheetsData();
      const processed = processSheetData(rawData, tipo, dia, mes, anio);
      
      console.log(`[DASHBOARD] Processed ${rawData?.length || 0} raw records`);
      return processed;
    });
    
    return json({
      success: true,
      data: processedData,
      filters: { tipo, dia, mes, anio },
      cached: true // Indicar que los datos pueden venir del caché
    });
  } catch (error) {
    console.error("[DASHBOARD] Error:", error);
    return json({
      success: false,
      error: error.message,
      cached: false
    });
  }
}

export default function Dashboard() {
  const { success, data, filters, error } = useLoaderData();
  const submit = useSubmit();
  const navigation = useNavigation();
  
  const [selectedTipo, setSelectedTipo] = useState(filters?.tipo || "mes");
  const [selectedDia, setSelectedDia] = useState(filters?.dia || "");
  const [selectedMes, setSelectedMes] = useState(filters?.mes || (new Date().getMonth() + 1).toString());
  const [selectedAnio, setSelectedAnio] = useState(filters?.anio || new Date().getFullYear().toString());

  const handleTipoChange = useCallback((value) => setSelectedTipo(value), []);
  const handleDiaChange = useCallback((value) => setSelectedDia(value), []);
  const handleMesChange = useCallback((value) => setSelectedMes(value), []);
  const handleAnioChange = useCallback((value) => setSelectedAnio(value), []);

  // Efecto para animaciones
  useEffect(() => {
  // Agregar clases de animación a las cards cuando se carga la página
  const cards = document.querySelectorAll('.dashboard-card, .polaris-card');
  cards.forEach((card, index) => {
    card.style.animationDelay = `${index * 0.1}s`;
    card.classList.add('animate__animated', 'animate__fadeInUp');
  });
    
    // Inicializar NProgress si está disponible
    if (typeof window !== 'undefined' && window.NProgress) {
    window.NProgress.configure({ 
      showSpinner: false,
      trickleSpeed: 200 
    });
  }
}, [data]);
  
  // Mostrar loading bar en transiciones
  useEffect(() => {
  if (navigation.state === "loading" && typeof window !== 'undefined' && window.NProgress) {
    window.NProgress.start();
  } else if (navigation.state !== "loading" && typeof window !== 'undefined' && window.NProgress) {
    window.NProgress.done();
  }
}, [navigation.state]);

  const handleSubmit = useCallback(() => {
    const formData = new FormData();
    formData.append("tipo", selectedTipo);
    formData.append("dia", selectedDia);
    formData.append("mes", selectedMes);
    formData.append("anio", selectedAnio);
    submit(formData, { method: "get" });
  }, [selectedTipo, selectedDia, selectedMes, selectedAnio, submit]);

  const handleRefreshCache = useCallback(async () => {
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
      <Page title="Dashboard FEL - Error">
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
    <Page title="Dashboard FEL" fullWidth>
      <BlockStack gap="500">
        {/* Header con filtros */}
        <Card>
          <BlockStack gap="400">
            <InlineStack align="space-between">
              <BlockStack gap="200">
                <Text as="h2" variant="headingLg">
                  Sistema de Análisis de Facturas Electrónicas
                </Text>
                <Badge tone="info">
                  {data.tipoVisualizacion === 'dia' && `Día ${selectedDia}`}
                  {data.tipoVisualizacion === 'mes' && `Mes ${selectedMes}`}
                  {data.tipoVisualizacion === 'año' && `Año ${selectedAnio}`}
                </Badge>
              </BlockStack>
              <Badge tone={data.tendencia === 'up' ? 'success' : data.tendencia === 'down' ? 'critical' : 'info'}>
                {data.tendencia === 'up' && '↑ Tendencia al alza'}
                {data.tendencia === 'down' && '↓ Tendencia a la baja'}
                {data.tendencia === 'neutral' && '→ Tendencia estable'}
              </Badge>
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
              
              <Button onClick={() => exportToCSV(data)}>
                📥 Exportar CSV
              </Button>
              
              <Button onClick={handleRefreshCache} outline>
                🔄 Actualizar Datos
              </Button>
            </InlineStack>
          </BlockStack>
        </Card>
        
       {/* Métricas principales - Primera fila */}
<InlineGrid 
  columns={{ xs: 1, sm: 2, md: 2, lg: 4 }} 
  gap={{ xs: "400", sm: "400", md: "400", lg: "400" }}
>
  <MetricCard
    title="Total Ventas"
    value={`Q ${data.totalVentas.toFixed(2)}`}
    icon="💰"
    format="currency"
    delay={1}
    change={data.comparacion?.totalVentas?.cambio}
  />
  
  <MetricCard
    title="Total Pedidos"
    value={data.totalPedidos.toString()}
    icon="📦"
    format="number"
    delay={2}
    change={data.comparacion?.totalPedidos?.cambio}
  />
  
  <MetricCard
    title="Ticket Promedio"
    value={`Q ${data.promedioPorPedido.toFixed(2)}`}
    icon="🎯"
    format="currency"
    delay={3}
    change={data.comparacion?.promedioPorPedido?.cambio}
  />
  
  <MetricCard
    title="Total IVA"
    value={`Q ${data.totalIVA.toFixed(2)}`}
    icon="📊"
    format="currency"
    delay={4}
  />
</InlineGrid>

{/* Segunda fila de métricas */}
<InlineGrid 
  columns={{ xs: 1, sm: 1, md: 3 }} 
  gap={{ xs: "400", sm: "400", md: "400" }}
>
  <MetricCard
    title="Promedio Diario"
    value={`Q ${data.promedioDiario.toFixed(2)}`}
    icon="📈"
    format="currency"
    delay={5}
    change={data.comparacion?.promedioDiario?.cambio}
  />

  <MetricCard
    title="Venta Máxima"
    value={`Q ${data.ventaMaxima.toFixed(2)}`}
    icon="💹"
    format="currency"
    delay={6}
  />

  <MetricCard
    title="Venta Mínima"
    value={`Q ${data.ventaMinima.toFixed(2)}`}
    icon="📉"
    format="currency"
    delay={7}
  />
</InlineGrid> 

        {/* Gráfica principal de ventas */}
{data.ventasDiarias && Object.keys(data.ventasDiarias).length > 0 && (
  <div style={{ marginBottom: "20px" }}>
    <VentasChart 
      ventasDiarias={data.ventasDiarias} 
      ventasDiariasAnterior={data.ventasDiariasAnterior}
      tipo={data.tipoVisualizacion} 
    />
  </div>
)}

{/* Primera fila de gráficas */}
<InlineGrid 
  columns={{
    xs: 1,
    sm: 1,
    md: 2,
    lg: 3
  }} 
  gap={{
    xs: "300",
    sm: "400",
    md: "400"
  }}
>
  {data.topProductos && data.topProductos.length > 0 && (
<ProductosChart topProductos={data.topProductos} />
  )}
  
  {data.estadosPedidos && (
<EstadosChart estadosPedidos={data.estadosPedidos} />
  )}
  
  {data.topCiudades && data.topCiudades.length > 0 && (
<CiudadesChart topCiudades={data.topCiudades} />
  )}
</InlineGrid>

{/* Segunda fila de gráficas */}
<InlineGrid 
  columns={{
    xs: 1,
    sm: 1,
    md: 2,
    lg: 3
  }} 
  gap={{
    xs: "300",
    sm: "400",
    md: "400"
  }}
>
  {data.topDepartamentos && data.topDepartamentos.length > 0 && (
<DepartamentosChart topDepartamentos={data.topDepartamentos} />
  )}
  
  {data.metodosPago && data.metodosPago.length > 0 && (
<MetodosChart metodosPago={data.metodosPago} />
  )}
  
  {data.categoriasProductos && Object.keys(data.categoriasProductos).length > 0 && (
<CategoriasChart categoriasProductos={data.categoriasProductos} />
  )}
</InlineGrid>

{/* Tercera fila de gráficas */}
<InlineGrid 
  columns={{
    xs: 1,
    sm: 1,
    md: 2,
    lg: 3
  }} 
  gap={{
    xs: "300",
    sm: "400",
    md: "400"
  }}
>
  {data.topMarcas && data.topMarcas.length > 0 && (
<MarcasChart topMarcas={data.topMarcas} />
  )}
  
  {data.topNITs && data.topNITs.length > 0 && (
<NITsChart topNITs={data.topNITs} />
  )}
  
  {/* Espacio vacío para mantener la alineación */}
  <div></div>
</InlineGrid>
        

        {/* Tabla de Top 10 Clientes */}
        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text as="h3" variant="headingLg">
                  🏆 Top 10 Clientes
                </Text>
                <EnhancedDataTable
                  columnContentTypes={["text", "numeric", "numeric", "numeric", "numeric"]}
                  headings={["Cliente", "Total", "Pedidos", "Ticket Promedio", "% del Total"]}
                  rows={data.topClientes.map((cliente) => [
                    cliente.nombre,
                    `Q ${cliente.total.toFixed(2)}`,
                    cliente.pedidos.toString(),
                    `Q ${cliente.ticketPromedio.toFixed(2)}`,
                    `${((cliente.total / data.totalVentas) * 100).toFixed(1)}%`
                  ])}
                  delay={10}
                />
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>

        {/* Tabla de Top Productos */}
        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text as="h3" variant="headingLg">
                  📦 Top 15 Productos Más Vendidos
                </Text>
                <EnhancedDataTable
                  columnContentTypes={["text", "numeric", "numeric", "numeric"]}
                  headings={["Producto", "Cantidad", "Total", "Precio Promedio"]}
                  rows={data.topProductos.map((producto) => [
                    producto.nombre.length > 50 ? producto.nombre.substring(0, 47) + '...' : producto.nombre,
                    producto.cantidad.toString(),
                    `Q ${producto.total.toFixed(2)}`,
                    `Q ${(producto.total / producto.cantidad).toFixed(2)}`
                  ])}
                  delay={10}
                />
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>

        {/* Tabla de Ciudades */}
        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text as="h3" variant="headingLg">
                  🏙️ Top Ciudades por Ventas
                </Text>
                {data.topCiudades && data.topCiudades.length > 0 ? (
                  <EnhancedDataTable
                    columnContentTypes={["text", "numeric", "numeric", "numeric", "numeric"]}
                    headings={["Ciudad", "Pedidos", "Total Ventas", "Ticket Promedio", "% del Total"]}
                    rows={data.topCiudades.map((ciudad) => [
                      ciudad.ciudad,
                      ciudad.cantidad.toString(),
                      `Q ${ciudad.total.toFixed(2)}`,
                      `Q ${(ciudad.total / ciudad.cantidad).toFixed(2)}`,
                      `${((ciudad.total / data.totalVentas) * 100).toFixed(1)}%`
                    ])}
                    delay={10}
                  />
                ) : (
                  <Text as="p" variant="bodyMd" tone="subdued">
                    No hay datos de ciudades disponibles
                  </Text>
                )}
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>

        {/* Tabla de Marcas */}
        {data.topMarcas && data.topMarcas.length > 0 && (
          <Layout>
            <Layout.Section>
              <Card>
                <BlockStack gap="400">
                  <Text as="h3" variant="headingLg">
                    🚗 Análisis de Marcas de Vehículos
                  </Text>
                  <EnhancedDataTable
                    columnContentTypes={["text", "numeric", "numeric", "numeric"]}
                    headings={["Marca", "Cantidad de Productos", "Total en Ventas", "% del Total"]}
                    rows={data.topMarcas.map((marca) => {
                      const totalMarcas = data.topMarcas.reduce((sum, m) => sum + m.total, 0);
                      return [
                        marca.marca,
                        marca.cantidad.toString(),
                        `Q ${marca.total.toFixed(2)}`,
                        `${((marca.total / totalMarcas) * 100).toFixed(1)}%`
                      ];
                    })}
                    delay={10}
                  />
                </BlockStack>
              </Card>
            </Layout.Section>
          </Layout>
        )}

        {/* Tabla de Métodos de Pago */}
        {data.metodosPago && data.metodosPago.length > 0 && (
          <Layout>
            <Layout.Section>
              <Card>
                <BlockStack gap="400">
                  <Text as="h3" variant="headingLg">
                    💳 Análisis de Métodos de Pago
                  </Text>
                  <EnhancedDataTable
                    columnContentTypes={["text", "numeric", "numeric", "numeric", "numeric"]}
                    headings={["Método de Pago", "Transacciones", "Total Procesado", "Promedio/Transacción", "% del Total"]}
                    rows={data.metodosPago.map((metodo) => {
                      const totalPagos = data.metodosPago.reduce((sum, m) => sum + m.total, 0);
                      return [
                        metodo.metodo,
                        metodo.cantidad.toString(),
                        `Q ${metodo.total.toFixed(2)}`,
                        `Q ${(metodo.total / metodo.cantidad).toFixed(2)}`,
                        `${((metodo.total / totalPagos) * 100).toFixed(1)}%`
                      ];
                    })}
                    delay={10}
                  />
                </BlockStack>
              </Card>
            </Layout.Section>
          </Layout>
        )}
      </BlockStack>
    </Page>
  );
}