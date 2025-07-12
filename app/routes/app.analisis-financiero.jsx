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
} from "@shopify/polaris";
import { useState, useCallback } from "react";
import { authenticate } from "../shopify.server";

export async function loader({ request }) {
  await authenticate.admin(request);
  
  try {
    const url = new URL(request.url);
    const tipo = url.searchParams.get("tipo") || "mes";
    const dia = url.searchParams.get("dia") || "";
    const mes = url.searchParams.get("mes") || (new Date().getMonth() + 1).toString();
    const anio = url.searchParams.get("anio") || new Date().getFullYear().toString();
    
    // Por ahora retornamos datos de prueba
    return json({
      success: true,
      data: {
        totalIngresos: 0,
        totalEgresos: 0,
        profit: 0,
        margenProfit: 0,
        gastosPorCategoria: {},
        gastosPorEmpresa: [],
        tendenciaGastos: 'neutral'
      },
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
        <InlineGrid columns={{ xs: 1, sm: 2, md: 4 }} gap="400">
          <Card>
            <BlockStack gap="200">
              <Text as="h3" variant="headingMd" tone="subdued">
                💵 Total Ingresos
              </Text>
              <Text as="p" variant="heading2xl" tone="success">
                Q {data.totalIngresos.toFixed(2)}
              </Text>
            </BlockStack>
          </Card>

          <Card>
            <BlockStack gap="200">
              <Text as="h3" variant="headingMd" tone="subdued">
                💸 Total Egresos
              </Text>
              <Text as="p" variant="heading2xl" tone="critical">
                Q {data.totalEgresos.toFixed(2)}
              </Text>
            </BlockStack>
          </Card>

          <Card>
            <BlockStack gap="200">
              <Text as="h3" variant="headingMd" tone="subdued">
                📊 Profit
              </Text>
              <Text as="p" variant="heading2xl" tone={data.profit >= 0 ? "success" : "critical"}>
                Q {data.profit.toFixed(2)}
              </Text>
            </BlockStack>
          </Card>

          <Card>
            <BlockStack gap="200">
              <Text as="h3" variant="headingMd" tone="subdued">
                📈 Margen de Profit
              </Text>
              <Text as="p" variant="heading2xl">
                {data.margenProfit.toFixed(1)}%
              </Text>
            </BlockStack>
          </Card>
        </InlineGrid>

        {/* Placeholder para gráficas */}
        <Card>
          <Text as="p" variant="bodyMd">
            Las gráficas y análisis detallados se agregarán en los siguientes pasos...
          </Text>
        </Card>
      </BlockStack>
    </Page>
  );
}