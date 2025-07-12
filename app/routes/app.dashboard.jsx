import { json } from "@remix-run/node";
import { exportToCSV } from "../utils/exportData";
import { useLoaderData, useSubmit } from "@remix-run/react";
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
import { useState, useCallback } from "react";
import { getGoogleSheetsData } from "../utils/googleSheets.server";
import { processSheetData } from "../utils/processData.server";
import { 
  VentasPorDiaChart, 
  VentasPorHoraChart,
  TopProductosChart,
  EstadosPedidosChart,
  MetodosPagoChart,
  VentasPorCiudadChart,
  VentasPorDepartamentoChart,
  CategoriaProductosChart,
  MarcasVehiculosChart,
  TopNITsChart
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
      const { clearCache } = await import("../utils/cache.server");
      clearCache();
    }
    
    const rawData = await getGoogleSheetsData();
    const processedData = processSheetData(rawData, tipo, dia, mes, anio);
    
    return json({
      success: true,
      data: processedData,
      filters: { tipo, dia, mes, anio }
    });
  } catch (error) {
    console.error("Error:", error);
    return json({
      success: false,
      error: error.message
    });
  }
}

export default function Dashboard() {
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
  columns={{
    xs: 1,
    sm: 2,
    md: 3,
    lg: 6
  }} 
  gap={{
    xs: "200",
    sm: "300",
    md: "400"
  }}
>
  <Card>
    <BlockStack gap="200">
      <InlineStack align="space-between">
        <Text as="h3" variant="headingMd" tone="subdued">
          💰 Total Ventas
        </Text>
        {data.comparacion && (
          <Badge tone={data.comparacion.totalVentas.cambio >= 0 ? "success" : "critical"}>
            {data.comparacion.totalVentas.cambio >= 0 ? "↑" : "↓"} {Math.abs(data.comparacion.totalVentas.cambio).toFixed(1)}%
          </Badge>
        )}
      </InlineStack>
      <Text as="p" variant="heading2xl" tone="success">
        Q {data.totalVentas.toFixed(2)}
      </Text>
      {data.comparacion && (
        <Text as="p" variant="bodySm" tone="subdued">
          vs Q {data.comparacion.totalVentas.anterior.toFixed(2)}
        </Text>
      )}
    </BlockStack>
  </Card>

  <Card>
    <BlockStack gap="200">
      <InlineStack align="space-between">
        <Text as="h3" variant="headingMd" tone="subdued">
          📋 Total IVA (12%)
        </Text>
        {data.comparacion && (
          <Badge tone={data.comparacion.totalIVA.cambio >= 0 ? "success" : "critical"}>
            {data.comparacion.totalIVA.cambio >= 0 ? "↑" : "↓"} {Math.abs(data.comparacion.totalIVA.cambio).toFixed(1)}%
          </Badge>
        )}
      </InlineStack>
      <Text as="p" variant="heading2xl">
        Q {data.totalIVA.toFixed(2)}
      </Text>
      {data.comparacion && (
        <Text as="p" variant="bodySm" tone="subdued">
          vs Q {data.comparacion.totalIVA.anterior.toFixed(2)}
        </Text>
      )}
    </BlockStack>
  </Card>

  <Card>
    <BlockStack gap="200">
      <InlineStack align="space-between">
        <Text as="h3" variant="headingMd" tone="subdued">
          💵 Ventas Netas
        </Text>
        {data.comparacion && (
          <Badge tone={data.comparacion.ventasNetas.cambio >= 0 ? "success" : "critical"}>
            {data.comparacion.ventasNetas.cambio >= 0 ? "↑" : "↓"} {Math.abs(data.comparacion.ventasNetas.cambio).toFixed(1)}%
          </Badge>
        )}
      </InlineStack>
      <Text as="p" variant="heading2xl">
        Q {data.ventasNetas.toFixed(2)}
      </Text>
      {data.comparacion && (
        <Text as="p" variant="bodySm" tone="subdued">
          vs Q {data.comparacion.ventasNetas.anterior.toFixed(2)}
        </Text>
      )}
    </BlockStack>
  </Card>

  <Card>
    <BlockStack gap="200">
      <InlineStack align="space-between">
        <Text as="h3" variant="headingMd" tone="subdued">
          📦 Total Pedidos
        </Text>
        {data.comparacion && (
          <Badge tone={data.comparacion.totalPedidos.cambio >= 0 ? "success" : "critical"}>
            {data.comparacion.totalPedidos.cambio >= 0 ? "↑" : "↓"} {Math.abs(data.comparacion.totalPedidos.cambio).toFixed(1)}%
          </Badge>
        )}
      </InlineStack>
      <Text as="p" variant="heading2xl" tone="info">
        {data.totalPedidos}
      </Text>
      {data.comparacion && (
        <Text as="p" variant="bodySm" tone="subdued">
          vs {data.comparacion.totalPedidos.anterior}
        </Text>
      )}
    </BlockStack>
  </Card>

  <Card>
    <BlockStack gap="200">
      <InlineStack align="space-between">
        <Text as="h3" variant="headingMd" tone="subdued">
          📊 Promedio/Pedido
        </Text>
        {data.comparacion && (
          <Badge tone={data.comparacion.promedioPorPedido.cambio >= 0 ? "success" : "critical"}>
            {data.comparacion.promedioPorPedido.cambio >= 0 ? "↑" : "↓"} {Math.abs(data.comparacion.promedioPorPedido.cambio).toFixed(1)}%
          </Badge>
        )}
      </InlineStack>
      <Text as="p" variant="heading2xl">
        Q {data.promedioPorPedido.toFixed(2)}
      </Text>
      {data.comparacion && (
        <Text as="p" variant="bodySm" tone="subdued">
          vs Q {data.comparacion.promedioPorPedido.anterior.toFixed(2)}
        </Text>
      )}
    </BlockStack>
  </Card>

  <Card>
    <BlockStack gap="200">
      <Text as="h3" variant="headingMd" tone="subdued">
        📅 Días con Ventas
      </Text>
      <Text as="p" variant="heading2xl">
        {data.diasConVentas}
      </Text>
    </BlockStack>
  </Card>
</InlineGrid>

{/* Segunda fila de métricas */}
<InlineGrid 
  columns={{
    xs: 1,
    sm: 1,
    md: 3
  }} 
  gap={{
    xs: "200",
    sm: "300",
    md: "400"
  }}
>
  <Card>
    <BlockStack gap="200">
      <InlineStack align="space-between">
        <Text as="h3" variant="headingMd" tone="subdued">
          📈 Promedio Diario
        </Text>
        {data.comparacion && (
          <Badge tone={data.comparacion.promedioDiario.cambio >= 0 ? "success" : "critical"}>
            {data.comparacion.promedioDiario.cambio >= 0 ? "↑" : "↓"} {Math.abs(data.comparacion.promedioDiario.cambio).toFixed(1)}%
          </Badge>
        )}
      </InlineStack>
      <Text as="p" variant="headingXl">
        Q {data.promedioDiario.toFixed(2)}
      </Text>
      {data.comparacion && (
        <Text as="p" variant="bodySm" tone="subdued">
          vs Q {data.comparacion.promedioDiario.anterior.toFixed(2)}
        </Text>
      )}
    </BlockStack>
  </Card>

  <Card>
    <BlockStack gap="200">
      <Text as="h3" variant="headingMd" tone="subdued">
        💹 Venta Máxima
      </Text>
      <Text as="p" variant="headingXl" tone="success">
        Q {data.ventaMaxima.toFixed(2)}
      </Text>
    </BlockStack>
  </Card>

  <Card>
    <BlockStack gap="200">
      <Text as="h3" variant="headingMd" tone="subdued">
        📉 Venta Mínima
      </Text>
      <Text as="p" variant="headingXl" tone="critical">
        Q {data.ventaMinima.toFixed(2)}
      </Text>
    </BlockStack>
  </Card>
</InlineGrid> 

        {/* Gráfica principal de ventas */}
{data.ventasDiarias && Object.keys(data.ventasDiarias).length > 0 && (
  <div style={{ marginBottom: "20px" }}>
    <VentasPorDiaChart 
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
    <TopProductosChart topProductos={data.topProductos} />
  )}
  
  {data.estadosPedidos && (
    <EstadosPedidosChart estadosPedidos={data.estadosPedidos} />
  )}
  
  {data.topCiudades && data.topCiudades.length > 0 && (
    <VentasPorCiudadChart topCiudades={data.topCiudades} />
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
    <VentasPorDepartamentoChart topDepartamentos={data.topDepartamentos} />
  )}
  
  {data.metodosPago && data.metodosPago.length > 0 && (
    <MetodosPagoChart metodosPago={data.metodosPago} />
  )}
  
  {data.categoriasProductos && Object.keys(data.categoriasProductos).length > 0 && (
    <CategoriaProductosChart categoriasProductos={data.categoriasProductos} />
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
    <MarcasVehiculosChart topMarcas={data.topMarcas} />
  )}
  
  {data.topNITs && data.topNITs.length > 0 && (
    <TopNITsChart topNITs={data.topNITs} />
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
                <DataTable
                  columnContentTypes={["text", "numeric", "numeric", "numeric", "numeric"]}
                  headings={["Cliente", "Total", "Pedidos", "Ticket Promedio", "% del Total"]}
                  rows={data.topClientes.map((cliente) => [
                    cliente.nombre,
                    `Q ${cliente.total.toFixed(2)}`,
                    cliente.pedidos.toString(),
                    `Q ${cliente.ticketPromedio.toFixed(2)}`,
                    `${((cliente.total / data.totalVentas) * 100).toFixed(1)}%`
                  ])}
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
                <DataTable
                  columnContentTypes={["text", "numeric", "numeric", "numeric"]}
                  headings={["Producto", "Cantidad", "Total", "Precio Promedio"]}
                  rows={data.topProductos.map((producto) => [
                    producto.nombre.length > 50 ? producto.nombre.substring(0, 47) + '...' : producto.nombre,
                    producto.cantidad.toString(),
                    `Q ${producto.total.toFixed(2)}`,
                    `Q ${(producto.total / producto.cantidad).toFixed(2)}`
                  ])}
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
                  <DataTable
                    columnContentTypes={["text", "numeric", "numeric", "numeric", "numeric"]}
                    headings={["Ciudad", "Pedidos", "Total Ventas", "Ticket Promedio", "% del Total"]}
                    rows={data.topCiudades.map((ciudad) => [
                      ciudad.ciudad,
                      ciudad.cantidad.toString(),
                      `Q ${ciudad.total.toFixed(2)}`,
                      `Q ${(ciudad.total / ciudad.cantidad).toFixed(2)}`,
                      `${((ciudad.total / data.totalVentas) * 100).toFixed(1)}%`
                    ])}
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
                  <DataTable
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
                  <DataTable
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
