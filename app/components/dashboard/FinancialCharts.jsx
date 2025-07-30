import { useRef } from 'react';
import { Card, Text, BlockStack, DataTable, Badge, InlineStack, Button, Box } from "@shopify/polaris";
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
  RadialLinearScale,
} from "chart.js";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import { ChartWrapper } from './ChartWrapper';
import { chartColors, createGradient, baseChartOptions, chartAnimations } from '../../utils/chartConfig';
import { Filler } from "chart.js";

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
  ArcElement,
  RadialLinearScale,
  Filler // Agregar esta línea
);


// Gráfica de comparación Ingresos vs Egresos vs Profit
export function IngresosVsEgresosChart({ totalIngresos = 0, totalEgresos = 0, profit = 0 }) {
  // Validación de datos
  if (isNaN(totalIngresos) || isNaN(totalEgresos) || isNaN(profit)) {
    console.warn('Datos inválidos en IngresosVsEgresosChart');
    return null;
  }
  const chartRef = useRef(null);
  
  const data = {
    labels: ['Ingresos', 'Egresos', 'Profit'],
    datasets: [
      {
        label: 'Monto en Q',
        data: [totalIngresos, totalEgresos, Math.abs(profit)],
        backgroundColor: (context) => {
          const chart = context.chart;
          const {ctx, chartArea} = chart;
          if (!chartArea) return null;
          
          const colors = [
            chartColors.success.gradient,
            chartColors.danger.gradient,
            profit >= 0 ? chartColors.info.gradient : chartColors.warning.gradient
          ];
          
          return createGradient(ctx, chartArea, colors[context.dataIndex]);
        },
        borderColor: [
          chartColors.success.main,
          chartColors.danger.main,
          profit >= 0 ? chartColors.info.main : chartColors.warning.main
        ],
        borderWidth: 3,
        borderRadius: {
          topLeft: 12,
          topRight: 12,
          bottomLeft: 0,
          bottomRight: 0
        },
        borderSkipped: false,
        hoverBackgroundColor: [
          chartColors.success.main,
          chartColors.danger.main,
          profit >= 0 ? chartColors.info.main : chartColors.warning.main
        ],
      },
    ],
  };

  const options = {
    ...baseChartOptions,
    plugins: {
      ...baseChartOptions.plugins,
      legend: { display: false },
      tooltip: {
        ...baseChartOptions.plugins.tooltip,
        callbacks: {
          title: function(tooltipItems) {
            const labels = ['💰 Ingresos', '💸 Egresos', profit >= 0 ? '📈 Profit' : '📉 Pérdida'];
            return labels[tooltipItems[0].dataIndex];
          },
      label: function(context) {
            const value = context.parsed?.y || 0;
            const label = context.dataIndex === 2 && profit < 0 ? '-' : '';
            return `Total: ${label}Q ${value.toLocaleString('es-GT', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}`;
          },
          afterLabel: function(context) {
  if (context.dataIndex === 2 && totalIngresos > 0) {
    const margen = (profit / totalIngresos * 100).toFixed(1);
    return `Margen: ${margen}%`;
  }
  return '';
}
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return `Q ${value.toLocaleString()}`;
          }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
          drawBorder: false
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    },
    animation: chartAnimations.bar
  };

  return (
    <Card>
      <BlockStack gap="400">
        <InlineStack align="space-between">
          <Text as="h3" variant="headingMd">
            💰 Comparación Ingresos vs Egresos
          </Text>
          <Badge tone={profit >= 0 ? 'success' : 'critical'}>
            {profit >= 0 ? '✅ Profit' : '⚠️ Pérdida'}
          </Badge>
        </InlineStack>
        <ChartWrapper delay={1}>
          <div style={{ height: "350px" }}>
            <Bar ref={chartRef} data={data} options={options} />
          </div>
        </ChartWrapper>
      </BlockStack>
    </Card>
  );
}

// Gráfica de gastos por categoría
export function GastosPorCategoriaChart({ categoriasOrdenadas = [] }) {
  // Validación de datos
  if (!Array.isArray(categoriasOrdenadas)) {
    console.warn('Datos inválidos en GastosPorCategoriaChart');
    return null;
  }
  if (!categoriasOrdenadas || categoriasOrdenadas.length === 0) return null;

  const chartRef = useRef(null);
  
  const coloresCategoria = {
    'Marketing': { color: chartColors.palette[0], icon: '📢' },
    'Tecnología': { color: chartColors.palette[1], icon: '💻' },
    'Personal': { color: chartColors.palette[2], icon: '👥' },
    'Oficina': { color: chartColors.palette[3], icon: '🏢' },
    'Inventario': { color: chartColors.palette[4], icon: '📦' },
    'Transporte': { color: chartColors.palette[5], icon: '🚚' },
    'Impuestos': { color: chartColors.palette[6], icon: '📋' },
    'Servicios Profesionales': { color: chartColors.palette[7], icon: '💼' },
    'Otros': { color: chartColors.palette[8], icon: '📌' }
  };

  // Plugin para mostrar texto en el centro
  const centerTextPlugin = {
    id: 'centerText',
    beforeDraw: (chart) => {
      const { ctx, chartArea } = chart;
      if (!chartArea) return;
      
      ctx.save();
      const centerX = (chartArea.left + chartArea.right) / 2;
      const centerY = (chartArea.top + chartArea.bottom) / 2;
      
      const total = categoriasOrdenadas.reduce((sum, cat) => sum + cat.total, 0);
      const text = [`Q ${total.toFixed(0)}`, 'Total'];
      
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      ctx.font = 'bold 24px Inter';
      ctx.fillStyle = chartColors.primary.main;
      ctx.fillText(text[0], centerX, centerY - 10);
      
      ctx.font = 'normal 14px Inter';
      ctx.fillStyle = '#6B7280';
      ctx.fillText(text[1], centerX, centerY + 15);
      
      ctx.restore();
    }
  };

  const data = {
    labels: categoriasOrdenadas.map(c => c.categoria),
    datasets: [
      {
        data: categoriasOrdenadas.map(c => c.total),
        backgroundColor: categoriasOrdenadas.map(c => {
          const config = coloresCategoria[c.categoria] || coloresCategoria['Otros'];
          return config.color;
        }),
        borderWidth: 3,
        borderColor: '#fff',
        hoverOffset: 20,
        spacing: 2,
      },
    ],
  };

  const options = {
    ...baseChartOptions,
    cutout: '65%',
    plugins: {
      ...baseChartOptions.plugins,
      legend: {
        position: 'right',
        labels: {
          padding: 15,
          font: { size: 12 },
          generateLabels: function(chart) {
            const data = chart.data;
            return data.labels.map((label, index) => {
              const categoria = categoriasOrdenadas[index];
              const config = coloresCategoria[label] || coloresCategoria['Otros'];
              return {
                text: `${config.icon} ${label} (${categoria.porcentaje.toFixed(1)}%)`,
                fillStyle: config.color,
                strokeStyle: '#fff',
                lineWidth: 2,
                hidden: false,
                index: index
              };
            });
          }
        }
      },
      tooltip: {
        ...baseChartOptions.plugins.tooltip,
        callbacks: {
          title: function(tooltipItems) {
            const categoria = categoriasOrdenadas[tooltipItems[0].dataIndex];
            const config = coloresCategoria[categoria.categoria] || coloresCategoria['Otros'];
            return `${config.icon} ${categoria.categoria}`;
          },
          label: function(context) {
            const categoria = categoriasOrdenadas[context.dataIndex];
            return [
              `Total: Q ${categoria.total.toLocaleString('es-GT', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}`,
              `${categoria.porcentaje.toFixed(1)}% del total`,
              `Posición: #${context.dataIndex + 1}`
            ];
          }
        }
      }
    },
    animation: chartAnimations.doughnut
  };

  return (
    <Card>
      <BlockStack gap="400">
        <Text as="h3" variant="headingMd">
          📊 Distribución de Gastos por Categoría
        </Text>
        <ChartWrapper delay={2}>
          <div style={{ height: "350px" }}>
            <Doughnut ref={chartRef} data={data} options={options} plugins={[centerTextPlugin]} />
          </div>
        </ChartWrapper>
      </BlockStack>
    </Card>
  );
}

// Gráfica de evolución temporal
// Gráfica de evolución temporal
export function EvolucionGastosChart({ gastosPorDia = {}, ventasDiarias = {}, tipo }) {
  const chartRef = useRef(null);
  
  let labels, datosIngresos, datosEgresos, titulo;
  
  if (tipo === 'año') {
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    labels = meses;
    datosIngresos = Array.from({ length: 12 }, (_, i) => ventasDiarias[i + 1] || 0);
    datosEgresos = Array.from({ length: 12 }, (_, i) => gastosPorDia[i + 1] || 0);
    titulo = "📈 Evolución Mensual de Ingresos vs Egresos";
  } else if (tipo === 'mes') {
    const dias = Array.from({ length: 31 }, (_, i) => i + 1);
    labels = dias.map(d => `Día ${d}`);
    datosIngresos = dias.map(d => ventasDiarias[d] || 0);
    datosEgresos = dias.map(d => gastosPorDia[d] || 0);
    titulo = "📈 Evolución Diaria de Ingresos vs Egresos";
  } else if (tipo === 'dia') {
    const horas = Array.from({ length: 24 }, (_, i) => i);
    labels = horas.map(h => `${h}:00`);
    datosIngresos = horas.map(h => ventasDiarias[h] || 0);
    datosEgresos = horas.map(h => gastosPorDia[h] || 0);
    titulo = "📈 Evolución por Hora de Ingresos vs Egresos";
  }

  // Calcular profit
  const datosProfit = datosIngresos.map((ingreso, i) => ingreso - datosEgresos[i]);

  const chartData = {
    labels: labels,
    datasets: [
      {
        label: "💰 Ingresos",
        data: datosIngresos,
        borderColor: chartColors.success.main,
        backgroundColor: (context) => {
          const ctx = context.chart.ctx;
          const chartArea = context.chart.chartArea;
          if (!chartArea) return chartColors.success.light;
          return createGradient(ctx, chartArea, chartColors.success.gradient);
        },
        tension: 0.4,
        fill: true,
        borderWidth: 3,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: '#fff',
        pointBorderColor: chartColors.success.main,
        pointBorderWidth: 2,
        pointHoverBackgroundColor: chartColors.success.main,
        pointHoverBorderColor: '#fff',
        pointHoverBorderWidth: 2,
      },
      {
        label: "💸 Egresos",
        data: datosEgresos,
        borderColor: chartColors.danger.main,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.4,
        fill: true,
        borderWidth: 2,
        borderDash: [3, 3],
        pointRadius: 0,
        pointHoverRadius: 4,
        pointHoverBackgroundColor: chartColors.danger.main,
        pointHoverBorderColor: '#fff',
      },
      {
        label: "📊 Profit/Pérdida",
        data: datosProfit,
        borderColor: chartColors.secondary.main,
        backgroundColor: 'transparent',
        tension: 0.4,
        fill: false,
        borderWidth: 2,
        borderDash: [5, 5],
        pointRadius: 0,
        pointHoverRadius: 4,
        pointHoverBackgroundColor: chartColors.secondary.main,
        pointHoverBorderColor: '#fff',
      },
    ],
  };

  const options = {
    ...baseChartOptions,
    ...chartAnimations.line,
    plugins: {
      ...baseChartOptions.plugins,
      legend: {
        display: true,
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
            family: "'Inter', sans-serif"
          },
          boxWidth: 40,
          boxHeight: 2
        }
      },
      title: {
        display: false
      },
      tooltip: {
        ...baseChartOptions.plugins.tooltip,
        callbacks: {
          title: function(tooltipItems) {
            return tooltipItems[0].label;
          },
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += `Q ${context.parsed.y.toLocaleString('es-GT', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}`;
            }
            return label;
          }
          // NO FOOTER - removido completamente
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return `Q ${value.toLocaleString('es-GT')}`;
          },
          font: {
            size: 11
          }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
          drawBorder: false
        }
      },
      x: {
        ticks: {
          font: {
            size: 11
          }
        },
        grid: {
          display: false
        }
      }
    }
  };

  return (
    <Card>
      <BlockStack gap="400">
        <Text as="h3" variant="headingMd">
          {titulo}
        </Text>
        <ChartWrapper delay={3}>  
          <div style={{ height: "350px", position: "relative" }}>
            <Line ref={chartRef} data={chartData} options={options} />
          </div>
        </ChartWrapper>
      </BlockStack>
    </Card>
  );
}

// Gráfica de top empresas
export function TopEmpresasGastosChart({ topEmpresas = [] }) {
  // Validación de datos
  if (!Array.isArray(topEmpresas)) {
    console.warn('Datos inválidos en TopEmpresasGastosChart');
    return null;
  }
  if (!topEmpresas || topEmpresas.length === 0) return null;

  const chartRef = useRef(null);
  const maxValue = Math.max(...topEmpresas.map(e => e.total));

  const data = {
    labels: topEmpresas.map(e => 
      e.empresa.length > 25 ? e.empresa.substring(0, 22) + '...' : e.empresa
    ),
    datasets: [
      {
        label: 'Gasto Total',
        data: topEmpresas.map(e => e.total),
        backgroundColor: (context) => {
  // Validar que context.parsed existe
  if (!context || !context.parsed) {
    return 'rgba(239, 68, 68, 0.5)'; // Color por defecto
  }
  const value = context.parsed.x || 0;
  const alpha = maxValue > 0 ? value / maxValue : 0;
  return `rgba(239, 68, 68, ${0.3 + (alpha * 0.5)})`;
},
        borderColor: chartColors.danger.main,
        borderWidth: 2,
        borderRadius: {
          topLeft: 0,
          topRight: 8,
          bottomLeft: 0,
          bottomRight: 8
        },
        borderSkipped: false,
        barPercentage: 0.8,
        categoryPercentage: 0.9,
      },
    ],
  };

  const options = {
    ...baseChartOptions,
    indexAxis: 'y',
    plugins: {
      ...baseChartOptions.plugins,
      legend: { display: false },
      tooltip: {
        ...baseChartOptions.plugins.tooltip,
        callbacks: {
          title: function(tooltipItems) {
            return topEmpresas[tooltipItems[0].dataIndex].empresa;
          },
          label: function(context) {
            const empresa = topEmpresas[context.dataIndex];
            return [
              `Total: Q ${empresa.total.toLocaleString('es-GT', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}`,
              `${empresa.porcentaje.toFixed(1)}% del total`,
              `Posición: #${context.dataIndex + 1}`
            ];
          },
          afterLabel: function(context) {
            if (context.dataIndex === 0) {
              return '🏆 Mayor proveedor';
            }
            return '';
          }
        }
      }
    },
    scales: {
      x: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return `Q ${value.toLocaleString()}`;
          }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
          drawBorder: false
        }
      },
      y: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            size: 11
          }
        }
      }
    },
    animation: {
      ...chartAnimations.bar,
      delay: (context) => context.dataIndex * 100
    }
  };

  return (
    <Card>
      <BlockStack gap="400">
        <InlineStack align="space-between">
          <Text as="h3" variant="headingMd">
            🏢 Top 10 Empresas por Gastos
          </Text>
          <Badge tone="attention">
            {topEmpresas.length} proveedores
          </Badge>
        </InlineStack>
        <ChartWrapper delay={4}>
          <div style={{ height: "350px" }}>
            <Bar ref={chartRef} data={data} options={options} />
          </div>
        </ChartWrapper>
      </BlockStack>
    </Card>
  );
}

// Tabla de detalles de gastos
export function TablaDetalleGastos({ detalleGastos }) {
  if (!detalleGastos || detalleGastos.length === 0) return null;

  // Mapeo de íconos para categorías
  const iconosCategoria = {
    'Marketing': '📢',
    'Tecnología': '💻',
    'Personal': '👥',
    'Oficina': '🏢',
    'Inventario': '📦',
    'Transporte': '🚚',
    'Impuestos': '📋',
    'Servicios Profesionales': '💼',
    'Otros': '📌'
  };

  const rows = detalleGastos.slice(0, 20).map((gasto, index) => {
    const fecha = new Date(gasto.fecha);
    const esHoy = fecha.toDateString() === new Date().toDateString();
    const icono = iconosCategoria[gasto.categoria] || '📌';
    
    return [
      <InlineStack gap="100" blockAlign="center">
        {esHoy && <Badge tone="success" size="small">Hoy</Badge>}
        <Text variant="bodyMd">
          {fecha.toLocaleDateString('es-GT')}
        </Text>
      </InlineStack>,
      <Text variant="bodyMd" fontWeight="medium">
        {gasto.empresa.length > 30 ? gasto.empresa.substring(0, 27) + '...' : gasto.empresa}
      </Text>,
      <Text variant="bodyMd" tone="subdued">
        {gasto.producto.length > 40 ? gasto.producto.substring(0, 37) + '...' : gasto.producto}
      </Text>,
      <InlineStack gap="100">
        <Text variant="bodyMd">{icono}</Text>
        <Text variant="bodyMd">{gasto.categoria}</Text>
      </InlineStack>,
      <InlineStack gap="100" align="end">
        <Text variant="bodyMd" fontWeight="semibold" tone={gasto.monto > 1000 ? 'critical' : 'base'}>
          Q {gasto.monto.toLocaleString('es-GT', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })}
        </Text>
      </InlineStack>
    ];
  });

  return (
    <Card>
      <BlockStack gap="400">
        <InlineStack align="space-between">
          <Text as="h3" variant="headingMd">
            📋 Últimos 20 Gastos Registrados
          </Text>
          <Button plain monochrome size="slim">
            Ver todos
          </Button>
        </InlineStack>
        
        <div style={{ overflowX: 'auto' }}>
          <DataTable
            columnContentTypes={["text", "text", "text", "text", "numeric"]}
            headings={[
              <Text variant="headingSm" as="span">Fecha</Text>,
              <Text variant="headingSm" as="span">Empresa</Text>,
              <Text variant="headingSm" as="span">Producto/Servicio</Text>,
              <Text variant="headingSm" as="span">Categoría</Text>,
              <Text variant="headingSm" as="span" alignment="end">Monto</Text>
            ]}
            rows={rows}
            hoverable
            hasZebraStriping
          />
        </div>
        
        {detalleGastos.length > 20 && (
          <Box paddingBlockStart="200">
            <Text variant="bodySm" tone="subdued" alignment="center">
              Mostrando 20 de {detalleGastos.length} registros
            </Text>
          </Box>
        )}
      </BlockStack>
    </Card>
  );
}

// Gráfica de tendencia de profit
export function TendenciaProfitChart({ profitMensual = [] }) {
  // Validación de datos
  if (!Array.isArray(profitMensual)) {
    console.warn('Datos inválidos en TendenciaProfitChart');
    return null;
  }
  if (!profitMensual || profitMensual.length === 0) return null;

  const chartRef = useRef(null);
  const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  
  const data = {
    labels: meses.slice(0, profitMensual.length),
    datasets: [
      {
        label: 'Profit Mensual',
        data: profitMensual,
        borderColor: (context) => {
  // Validar que context.parsed existe
  if (!context || !context.parsed) {
    return chartColors.secondary.main; // Color por defecto
  }
  const value = context.parsed.y || 0;
  return value >= 0 ? chartColors.success.main : chartColors.danger.main;
},
        backgroundColor: (context) => {
  const chart = context.chart;
  const {ctx, chartArea} = chart;
  if (!chartArea) return null;
  
  // Validar que context.parsed existe
  if (!context || !context.parsed || context.parsed.y === undefined) {
    return createGradient(ctx, chartArea, chartColors.secondary.gradient);
  }
  
  const value = context.parsed.y;
  const gradient = value >= 0 ? chartColors.success.gradient : chartColors.danger.gradient;
  return createGradient(ctx, chartArea, gradient);
},
        borderWidth: 3,
        tension: 0.4,
        fill: 'origin',
        pointRadius: 6,
        pointHoverRadius: 10,
        pointBackgroundColor: '#fff',
        pointBorderWidth: 3,
        segment: {
  borderColor: (ctx) => {
    // Validar que los puntos existen
    if (!ctx || !ctx.p0 || !ctx.p1 || !ctx.p0.parsed || !ctx.p1.parsed) {
      return chartColors.secondary.main;
    }
    const prev = ctx.p0.parsed.y || 0;
    const curr = ctx.p1.parsed.y || 0;
    if (prev < 0 && curr >= 0) return chartColors.success.main;
    if (prev >= 0 && curr < 0) return chartColors.danger.main;
    return curr >= 0 ? chartColors.success.main : chartColors.danger.main;
  }
}
      },
    ],
  };

  const options = {
    ...baseChartOptions,
    plugins: {
      ...baseChartOptions.plugins,
      legend: { display: false },
      tooltip: {
        ...baseChartOptions.plugins.tooltip,
        callbacks: {
          title: function(tooltipItems) {
            return `${tooltipItems[0].label} 2024`;
          },
          label: function(context) {
            const value = context.parsed?.y || 0;
            const label = value >= 0 ? 'Ganancia' : 'Pérdida';
            const icon = value >= 0 ? '✅' : '⚠️';
            return `${icon} ${label}: Q ${Math.abs(value).toLocaleString('es-GT', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: false,
        ticks: {
          callback: function(value) {
            const label = value < 0 ? '-Q ' : 'Q ';
            return label + Math.abs(value).toLocaleString();
          }
        },
        grid: {
          color: (context) => {
            if (context.tick.value === 0) return 'rgba(0, 0, 0, 0.3)';
            return 'rgba(0, 0, 0, 0.05)';
          },
          lineWidth: (context) => {
            if (context.tick.value === 0) return 2;
            return 1;
          }
        }
      }
    }
  };

  return (
    <Card>
      <BlockStack gap="400">
        <Text as="h3" variant="headingMd">
          📈 Tendencia de Profit Mensual
        </Text>
        <ChartWrapper delay={5}>
          <div style={{ height: "300px" }}>
            <Line ref={chartRef} data={data} options={options} />
          </div>
        </ChartWrapper>
      </BlockStack>
    </Card>
  );
}

// Gráfica de flujo de caja
export function FlujoCajaChart({ flujoSemanal = [] }) {
  // Validación de datos
  if (!Array.isArray(flujoSemanal)) {
    console.warn('Datos inválidos en FlujoCajaChart');
    return null;
  }
  if (!flujoSemanal || flujoSemanal.length === 0) return null;

  const chartRef = useRef(null);
  const semanas = ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4'];
  
  const data = {
    labels: semanas,
    datasets: [
      {
        label: '💵 Entradas',
        data: flujoSemanal.map(s => s.entradas || 0),
        backgroundColor: chartColors.success.main,
        borderColor: chartColors.success.main,
        borderWidth: 2,
        borderRadius: 8,
        categoryPercentage: 0.8,
        barPercentage: 0.9,
      },
      {
        label: '💸 Salidas',
        data: flujoSemanal.map(s => s.salidas || 0),
        backgroundColor: chartColors.danger.main,
        borderColor: chartColors.danger.main,
        borderWidth: 2,
        borderRadius: 8,
        categoryPercentage: 0.8,
        barPercentage: 0.9,
      },
      {
        label: '📊 Balance',
        data: flujoSemanal.map(s => (s.entradas || 0) - (s.salidas || 0)),
        type: 'line',
        borderColor: chartColors.info.main,
        backgroundColor: 'transparent',
        borderWidth: 3,
        borderDash: [5, 5],
        tension: 0.4,
        pointRadius: 8,
        pointBackgroundColor: chartColors.info.main,
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        yAxisID: 'y1',
      },
    ],
  };

  const options = {
    ...baseChartOptions,
    plugins: {
      ...baseChartOptions.plugins,
      tooltip: {
        ...baseChartOptions.plugins.tooltip,
        callbacks: {
          label: function(context) {
            const value = context.parsed?.y || 0;
            return `${context.dataset.label}: Q ${value.toLocaleString('es-GT', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}`;
          }
        }
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        position: 'left',
        ticks: {
          callback: function(value) {
            return `Q ${value.toLocaleString()}`;
          }
        }
      },
      y1: {
        beginAtZero: true,
        position: 'right',
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          callback: function(value) {
            return `Q ${value.toLocaleString()}`;
          }
        }
      }
    }
  };

  return (
    <Card>
      <BlockStack gap="400">
        <Text as="h3" variant="headingMd">
          💰 Flujo de Caja Semanal
        </Text>
        <ChartWrapper delay={6}>
          <div style={{ height: "300px" }}>
            <Bar ref={chartRef} data={data} options={options} />
          </div>
        </ChartWrapper>
      </BlockStack>
    </Card>
  );
}

// End of file