import { Badge, InlineStack, Box, InlineGrid } from "@shopify/polaris";
import { Card, Text, BlockStack } from "@shopify/polaris";
import { useEffect, useRef } from 'react';
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
  Filler,
} from "chart.js";
import { Line, Bar, Doughnut, Pie, PolarArea } from "react-chartjs-2";
import { ChartWrapper } from './ChartWrapper';
import { chartColors, createGradient, baseChartOptions, chartAnimations } from '../../utils/chartConfig';

// Registrar Filler para gradientes
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
  Filler
);

// Plugin personalizado para efectos hover
const hoverEffect = {
  id: 'hoverEffect',
  beforeDraw: (chart, args, options) => {
    const { ctx } = chart;
    ctx.save();
    
    // Agregar sombra en hover
    if (chart._active && chart._active.length) {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
    }
    
    ctx.restore();
  }
};

ChartJS.register(hoverEffect);

export function VentasChart({ ventasDiarias, ventasDiariasAnterior, tipo }) {
  const chartRef = useRef(null);
  
  let labels, datosActuales, datosPeriodoAnterior, titulo;
  
  if (tipo === 'dia') {
    const horas = Array.from({ length: 24 }, (_, i) => i);
    labels = horas.map(h => `${h}:00`);
    datosActuales = horas.map(h => ventasDiarias[h] || 0);
    datosPeriodoAnterior = horas.map(h => (ventasDiariasAnterior && ventasDiariasAnterior[h]) || 0);
    titulo = "📈 Ventas por Hora del Día";
  } else if (tipo === 'mes') {
    const dias = Array.from({ length: 31 }, (_, i) => i + 1);
    labels = dias.map(d => `Día ${d}`);
    datosActuales = dias.map(d => ventasDiarias[d] || 0);
    datosPeriodoAnterior = dias.map(d => (ventasDiariasAnterior && ventasDiariasAnterior[d]) || 0);
    titulo = "📈 Ventas por Día del Mes";
  } else if (tipo === 'año') {
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    labels = meses;
    datosActuales = Array.from({ length: 12 }, (_, i) => ventasDiarias[i + 1] || 0);
    datosPeriodoAnterior = Array.from({ length: 12 }, (_, i) => (ventasDiariasAnterior && ventasDiariasAnterior[i + 1]) || 0);
    titulo = "📈 Ventas por Mes del Año";
  }

  const calcularMediaMovil = (datos, periodo = 3) => {
    return datos.map((_, index) => {
      if (index < periodo - 1) return null;
      const suma = datos.slice(index - periodo + 1, index + 1).reduce((a, b) => a + b, 0);
      return suma / periodo;
    });
  };

  const mediaMovil = calcularMediaMovil(datosActuales);

  const chartData = {
    labels: labels,
    datasets: [
      {
        label: "Período Actual",
        data: datosActuales,
        borderColor: chartColors.primary.main,
        backgroundColor: (context) => {
          const ctx = context.chart.ctx;
          const chartArea = context.chart.chartArea;
          if (!chartArea) return chartColors.primary.light;
          return createGradient(ctx, chartArea, chartColors.primary.gradient);
        },
        tension: 0.4,
        fill: true,
        borderWidth: 3,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: '#fff',
        pointBorderColor: chartColors.primary.main,
        pointBorderWidth: 2,
        pointHoverBackgroundColor: chartColors.primary.main,
        pointHoverBorderColor: '#fff',
        pointHoverBorderWidth: 2,
      },
      {
        label: "Media Móvil",
        data: mediaMovil,
        borderColor: chartColors.danger.main,
        backgroundColor: 'transparent',
        tension: 0.4,
        fill: false,
        borderWidth: 2,
        borderDash: [5, 5],
        pointRadius: 0,
        pointHoverRadius: 4,
        pointHoverBackgroundColor: chartColors.danger.main,
        pointHoverBorderColor: '#fff',
      },
      {
        label: tipo === 'dia' ? "Día Anterior" : tipo === 'mes' ? "Mes Anterior" : "Año Anterior",
        data: datosPeriodoAnterior,
        borderColor: 'rgba(156, 163, 175, 0.8)',
        backgroundColor: 'rgba(156, 163, 175, 0.1)',
        tension: 0.4,
        fill: true,
        borderWidth: 2,
        borderDash: [3, 3],
        pointRadius: 0,
        pointHoverRadius: 3,
      },
    ],
  };

  const options = {
    ...baseChartOptions,
    ...chartAnimations.line,
    plugins: {
  ...baseChartOptions.plugins,
  legend: {
    display: true,  // ✅ Asegurar que esté visible
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
      },
      footer: function(tooltipItems) {
        let sum = 0;
        tooltipItems.forEach(function(tooltipItem) {
          sum += tooltipItem.parsed.y;
        });
        return 'Total: Q ' + sum.toLocaleString('es-GT', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        });
      }
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
        <ChartWrapper delay={1}>  
          <div style={{ height: "350px", position: "relative" }}>
            <Line ref={chartRef} data={chartData} options={options} />
          </div>
        </ChartWrapper>
      </BlockStack>
    </Card>
  );
}


// Continuación del archivo...

export function HorasChart({ ventasPorHora }) {
  const chartRef = useRef(null);
  const horas = Array.from({ length: 24 }, (_, i) => i);
  
  // Identificar hora pico
  const maxVenta = Math.max(...horas.map(h => ventasPorHora[h] || 0));
  const horaPico = horas.find(h => (ventasPorHora[h] || 0) === maxVenta);
  
  const data = {
    labels: horas.map(h => `${h}:00`),
    datasets: [
      {
        label: "Ventas por Hora",
        data: horas.map(h => ventasPorHora[h] || 0),
        backgroundColor: (context) => {
          const value = context.parsed.y;
          const alpha = value / maxVenta; // Intensidad basada en valor
          return `rgba(251, 146, 60, ${0.3 + (alpha * 0.7)})`;
        },
        borderColor: chartColors.warning.main,
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
        hoverBackgroundColor: chartColors.warning.main,
        hoverBorderColor: chartColors.warning.main,
        hoverBorderWidth: 3,
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
          label: function(context) {
            const hora = context.dataIndex;
            const isPico = hora === horaPico;
            let label = `Q ${context.parsed.y.toFixed(2)}`;
            if (isPico) {
              label += ' 🔥 (Hora pico)';
            }
            return label;
          },
          afterLabel: function(context) {
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((context.parsed.y / total) * 100).toFixed(1);
            return `${percentage}% del total diario`;
          }
        }
      },
      // Plugin personalizado para resaltar hora pico
      annotation: {
        annotations: {
          horaPico: {
            type: 'line',
            xMin: horaPico,
            xMax: horaPico,
            borderColor: 'rgba(255, 99, 132, 0.5)',
            borderWidth: 2,
            borderDash: [5, 5],
            label: {
              content: 'Hora Pico',
              enabled: true,
              position: 'top'
            }
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return `Q ${value}`;
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
    animation: {
      ...chartAnimations.bar,
      onComplete: function(animation) {
        // Animar el valor máximo después de la animación principal
        const chart = animation.chart;
        const ctx = chart.ctx;
        ctx.font = 'bold 12px Arial';
        ctx.fillStyle = chartColors.warning.main;
        ctx.textAlign = 'center';
        
        const meta = chart.getDatasetMeta(0);
        const maxBar = meta.data[horaPico];
        if (maxBar) {
          ctx.fillText('PICO', maxBar.x, maxBar.y - 10);
        }
      }
    }
  };

  return (
    <Card>
      <BlockStack gap="400">
        <InlineStack align="space-between">
          <Text as="h3" variant="headingMd">
            🕐 Ventas por Hora
          </Text>
          <Badge tone="warning">
            Hora pico: {horaPico}:00
          </Badge>
        </InlineStack>
        <ChartWrapper delay={2}>
          <div style={{ height: "300px" }}>
            <Bar ref={chartRef} data={data} options={options} />
          </div>
        </ChartWrapper>
      </BlockStack>
    </Card>
  );
}

export function ProductosChart({ topProductos }) {
  const chartRef = useRef(null);
  
  const data = {
    labels: topProductos.slice(0, 10).map(p => 
      p.nombre.length > 25 ? p.nombre.substring(0, 22) + '...' : p.nombre
    ),
    datasets: [
      {
        data: topProductos.slice(0, 10).map(p => p.cantidad),
        backgroundColor: chartColors.palette,
        borderWidth: 3,
        borderColor: '#fff',
        hoverOffset: 15,
        spacing: 2,
      },
    ],
  };

  const options = {
    ...baseChartOptions,
    cutout: '60%', // Convertir en doughnut
    plugins: {
      ...baseChartOptions.plugins,
      legend: {
        ...baseChartOptions.plugins.legend,
        position: 'right',
        labels: {
          ...baseChartOptions.plugins.legend.labels,
          generateLabels: function(chart) {
            const data = chart.data;
            if (data.labels && data.datasets.length) {
              return data.labels.map((label, i) => {
                const dataset = data.datasets[0];
                const value = dataset.data[i];
                const producto = topProductos[i];
                
                return {
                  text: `${label} (${value})`,
                  fillStyle: dataset.backgroundColor[i],
                  strokeStyle: '#fff',
                  lineWidth: 2,
                  hidden: false,
                  index: i,
                  // Datos adicionales para tooltip
                  extra: {
                    total: producto.total,
                    precio: producto.total / producto.cantidad
                  }
                };
              });
            }
            return [];
          }
        }
      },
      tooltip: {
        ...baseChartOptions.plugins.tooltip,
        callbacks: {
          title: function(tooltipItems) {
            return topProductos[tooltipItems[0].dataIndex].nombre;
          },
          label: function(context) {
            const producto = topProductos[context.dataIndex];
            return [
              `Cantidad: ${producto.cantidad} unidades`,
              `Total: Q ${producto.total.toLocaleString('es-GT', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}`,
              `Precio promedio: Q ${(producto.total / producto.cantidad).toFixed(2)}`
            ];
          },
          footer: function(tooltipItems) {
            const index = tooltipItems[0].dataIndex;
            const producto = topProductos[index];
            const totalGeneral = topProductos.reduce((sum, p) => sum + p.total, 0);
            const porcentaje = ((producto.total / totalGeneral) * 100).toFixed(1);
            return `📊 ${porcentaje}% del total`;
          }
        }
      },
      // Plugin para mostrar total en el centro
      centerText: {
        display: true,
        text: function(chart) {
          const total = topProductos.slice(0, 10).reduce((sum, p) => sum + p.cantidad, 0);
          return [`${total}`, 'Productos'];
        }
      }
    },
    animation: {
      animateRotate: true,
      animateScale: true,
      duration: 2000,
      easing: 'easeInOutQuart'
    }
  };

  // Plugin personalizado para texto central
  const centerTextPlugin = {
    id: 'centerText',
    beforeDraw: function(chart, args, options) {
      if (options.display) {
        const { ctx, chartArea: { left, right, top, bottom } } = chart;
        const centerX = (left + right) / 2;
        const centerY = (top + bottom) / 2;
        
        ctx.save();
        
        const text = options.text(chart);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Número grande
        ctx.font = 'bold 28px Inter';
        ctx.fillStyle = chartColors.primary.main;
        ctx.fillText(text[0], centerX, centerY - 10);
        
        // Texto pequeño
        ctx.font = 'normal 14px Inter';
        ctx.fillStyle = '#6B7280';
        ctx.fillText(text[1], centerX, centerY + 15);
        
        ctx.restore();
      }
    }
  };

  ChartJS.register(centerTextPlugin);

  return (
    <Card>
      <BlockStack gap="400">
        <Text as="h3" variant="headingMd">
          📦 Top 10 Productos Más Vendidos
        </Text>
        <ChartWrapper delay={3}>
          <div style={{ height: "300px" }}>
            <Doughnut ref={chartRef} data={data} options={options} />
          </div>
        </ChartWrapper>
      </BlockStack>
    </Card>
  );
}

export function EstadosChart({ estadosPedidos }) {
  const estados = {
    'paid': { label: 'Pagado', color: chartColors.success.main, emoji: '✅' },
    'pending': { label: 'Pendiente', color: chartColors.warning.main, emoji: '⏳' },
    'cancelled': { label: 'Cancelado', color: chartColors.danger.main, emoji: '❌' }
  };

  const labels = [];
  const valores = [];
  const colores = [];
  const emojis = [];

  Object.keys(estados).forEach(key => {
    if (estadosPedidos[key] > 0) {
      labels.push(estados[key].label);
      valores.push(estadosPedidos[key]);
      colores.push(estados[key].color);
      emojis.push(estados[key].emoji);
    }
  });

  const total = valores.reduce((a, b) => a + b, 0);

  const data = {
    labels: labels,
    datasets: [
      {
        data: valores,
        backgroundColor: colores.map(color => color.replace('1)', '0.8)')),
        borderColor: colores,
        borderWidth: 3,
        hoverOffset: 20,
      },
    ],
  };

  const options = {
    ...baseChartOptions,
    plugins: {
      ...baseChartOptions.plugins,
      legend: {
        display: false // Creamos una leyenda personalizada
      },
      tooltip: {
        ...baseChartOptions.plugins.tooltip,
        callbacks: {
          title: function(tooltipItems) {
            const index = tooltipItems[0].dataIndex;
            return `${emojis[index]} ${labels[index]}`;
          },
          label: function(context) {
            const value = context.parsed;
            const percentage = ((value / total) * 100).toFixed(1);
            return [
              `Cantidad: ${value} pedidos`,
              `Porcentaje: ${percentage}%`
            ];
          }
        }
      }
    }
  };

  return (
    <Card>
      <BlockStack gap="400">
        <Text as="h3" variant="headingMd">
          📊 Estados de Pedidos
        </Text>
        <ChartWrapper delay={4}>
          <div style={{ height: "250px" }}>
            <Pie data={data} options={options} />
          </div>
        </ChartWrapper>
        {/* Leyenda personalizada */}
        <InlineGrid columns={3} gap="200">
          {labels.map((label, index) => (
            <Box key={label}>
              <InlineStack gap="100" align="center">
                <Box>
                  <div style={{
                    width: '12px',
                    height: '12px',
                    backgroundColor: colores[index],
                    borderRadius: '50%'
                  }} />
                </Box>
                <Text as="span" variant="bodySm">
                  {emojis[index]} {label}
                </Text>
                <Badge tone={
                  label === 'Pagado' ? 'success' : 
                  label === 'Pendiente' ? 'warning' : 
                  'critical'
                }>
                  {valores[index]}
                </Badge>
              </InlineStack>
            </Box>
          ))}
        </InlineGrid>
      </BlockStack>
    </Card>
  );
}

// Continuación del archivo...

export function MetodosChart({ metodosPago }) {
  const chartRef = useRef(null);
  
  // Mapeo de íconos y colores para métodos de pago
  const metodosConfig = {
    'Efectivo': { icon: '💵', color: chartColors.success.main },
    'Tarjeta': { icon: '💳', color: chartColors.info.main },
    'Transferencia': { icon: '🏦', color: chartColors.primary.main },
    'Cheque': { icon: '📄', color: chartColors.warning.main },
    'Crédito': { icon: '📊', color: chartColors.secondary.main },
    'Otro': { icon: '📱', color: chartColors.palette[5] }
  };

  const data = {
    labels: metodosPago.map(m => m.metodo),
    datasets: [
      {
        label: "Total por Método",
        data: metodosPago.map(m => m.total),
        backgroundColor: metodosPago.map(m => {
          const config = metodosConfig[m.metodo] || metodosConfig['Otro'];
          return config.color.replace('1)', '0.8)');
        }),
        borderColor: metodosPago.map(m => {
          const config = metodosConfig[m.metodo] || metodosConfig['Otro'];
          return config.color;
        }),
        borderWidth: 2,
        borderRadius: {
          topLeft: 8,
          topRight: 8,
          bottomLeft: 0,
          bottomRight: 0
        },
        barPercentage: 0.7,
        categoryPercentage: 0.8,
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
            const metodo = metodosPago[tooltipItems[0].dataIndex];
            const config = metodosConfig[metodo.metodo] || metodosConfig['Otro'];
            return `${config.icon} ${metodo.metodo}`;
          },
          label: function(context) {
            const metodo = metodosPago[context.dataIndex];
            const total = metodosPago.reduce((sum, m) => sum + m.total, 0);
            const porcentaje = ((metodo.total / total) * 100).toFixed(1);
            
            return [
              `Total: Q ${metodo.total.toLocaleString('es-GT', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}`,
              `Transacciones: ${metodo.cantidad}`,
              `${porcentaje}% del total`,
              `Ticket promedio: Q ${(metodo.total / metodo.cantidad).toFixed(2)}`
            ];
          }
        }
      },
      // Plugin para mostrar valores en las barras
      datalabels: {
        anchor: 'end',
        align: 'end',
        offset: 4,
        color: function(context) {
          return context.dataset.borderColor[context.dataIndex];
        },
        font: {
          weight: 'bold',
          size: 11
        },
        formatter: function(value, context) {
          const metodo = metodosPago[context.dataIndex];
          const config = metodosConfig[metodo.metodo] || metodosConfig['Otro'];
          return `${config.icon} Q ${value.toLocaleString('es-GT')}`;
        }
      }
    },
    scales: {
      x: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return `Q ${value.toLocaleString('es-GT')}`;
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
            size: 12,
            weight: '500'
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
        <Text as="h3" variant="headingMd">
          💳 Métodos de Pago
        </Text>
        <ChartWrapper delay={5}>
          <div style={{ height: "300px" }}>
            <Bar ref={chartRef} data={data} options={options} />
          </div>
        </ChartWrapper>
      </BlockStack>
    </Card>
  );
}

export function CiudadesChart({ topCiudades }) {
  if (!topCiudades || topCiudades.length === 0) return null;

  const chartRef = useRef(null);
  const maxValue = Math.max(...topCiudades.map(c => c.total));

  const data = {
    labels: topCiudades.slice(0, 8).map(c => c.ciudad),
    datasets: [
      {
        label: "Ventas por Ciudad",
        data: topCiudades.slice(0, 8).map(c => c.total),
        backgroundColor: (context) => {
          const ctx = context.chart.ctx;
          const chartArea = context.chart.chartArea;
          if (!chartArea) return chartColors.info.light;
          
          const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
          gradient.addColorStop(0, chartColors.info.light);
          gradient.addColorStop(1, chartColors.info.main);
          return gradient;
        },
        borderColor: chartColors.info.main,
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
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
            const ciudad = topCiudades[tooltipItems[0].dataIndex];
            return `📍 ${ciudad.ciudad}`;
          },
          label: function(context) {
            const ciudad = topCiudades[context.dataIndex];
            const totalGeneral = topCiudades.reduce((sum, c) => sum + c.total, 0);
            const porcentaje = ((ciudad.total / totalGeneral) * 100).toFixed(1);
            
            return [
              `Total: Q ${ciudad.total.toLocaleString('es-GT', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}`,
              `Pedidos: ${ciudad.cantidad}`,
              `${porcentaje}% del total nacional`,
              `Ticket promedio: Q ${(ciudad.total / ciudad.cantidad).toFixed(2)}`
            ];
          }
        }
      }
    },
    scales: {
      x: {
        ticks: {
          maxRotation: 45,
          minRotation: 45,
          font: {
            size: 11
          }
        },
        grid: {
          display: false
        }
      },
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return `Q ${value.toLocaleString('es-GT')}`;
          }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
          drawBorder: false
        }
      }
    },
    animation: {
      ...chartAnimations.bar,
      onComplete: function() {
        const chart = chartRef.current;
        if (!chart) return;
        
        const ctx = chart.ctx;
        ctx.save();
        
        // Agregar emoji de corona a la ciudad top
        const meta = chart.getDatasetMeta(0);
        const topBar = meta.data[0];
        
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('👑', topBar.x, topBar.y - 10);
        
        ctx.restore();
      }
    }
  };

  return (
    <Card>
      <BlockStack gap="400">
        <InlineStack align="space-between">
          <Text as="h3" variant="headingMd">
            🏙️ Ventas por Ciudad
          </Text>
          <Badge tone="info">
            {topCiudades.length} ciudades
          </Badge>
        </InlineStack>
        <ChartWrapper delay={6}>
          <div style={{ height: "300px" }}>
            <Bar ref={chartRef} data={data} options={options} />
          </div>
        </ChartWrapper>
      </BlockStack>
    </Card>
  );
}

export function DepartamentosChart({ topDepartamentos }) {
  if (!topDepartamentos || topDepartamentos.length === 0) return null;

  const chartRef = useRef(null);
  
  // Colores por región
  const coloresRegion = {
    'Guatemala': '#2563EB', // Azul
    'Sacatepéquez': '#3B82F6',
    'Chimaltenango': '#60A5FA',
    'Escuintla': '#10B981', // Verde
    'Santa Rosa': '#34D399',
    'Suchitepéquez': '#6EE7B7',
    'Retalhuleu': '#F59E0B', // Amarillo
    'San Marcos': '#FBBF24',
    'Huehuetenango': '#FCD34D',
    'Quetzaltenango': '#8B5CF6', // Morado
    'Totonicapán': '#A78BFA',
    'Sololá': '#C4B5FD',
    'Quiché': '#EF4444', // Rojo
    'Baja Verapaz': '#F87171',
    'Alta Verapaz': '#FCA5A5',
    'Petén': '#10B981', // Verde oscuro
    'Izabal': '#059669',
    'Zacapa': '#047857',
    'Chiquimula': '#F97316', // Naranja
    'Jalapa': '#FB923C',
    'Jutiapa': '#FDBA74',
    'Default': '#6B7280' // Gris
  };

  const data = {
    labels: topDepartamentos.slice(0, 6).map(d => d.departamento),
    datasets: [
      {
        data: topDepartamentos.slice(0, 6).map(d => d.total),
        backgroundColor: topDepartamentos.slice(0, 6).map(d => 
          coloresRegion[d.departamento] || coloresRegion['Default']
        ),
        borderWidth: 3,
        borderColor: '#fff',
        hoverOffset: 20,
      },
    ],
  };

  const totalNacional = topDepartamentos.reduce((sum, d) => sum + d.total, 0);

  const options = {
    ...baseChartOptions,
    cutout: '40%',
    plugins: {
      ...baseChartOptions.plugins,
      legend: {
        position: 'right',
        labels: {
          generateLabels: function(chart) {
            const data = chart.data;
            const total = data.datasets[0].data.reduce((a, b) => a + b, 0);
            
            return data.labels.map((label, index) => {
              const value = data.datasets[0].data[index];
              const percentage = ((value / total) * 100).toFixed(1);
              const depto = topDepartamentos[index];
              
              return {
                text: `${label} (${percentage}%)`,
                fillStyle: data.datasets[0].backgroundColor[index],
                strokeStyle: '#fff',
                lineWidth: 2,
                hidden: false,
                index: index,
                // Información adicional
                extra: {
                  pedidos: depto.cantidad,
                  ticketPromedio: depto.total / depto.cantidad
                }
              };
            });
          },
          padding: 15,
          font: {
            size: 11
          }
        }
      },
      tooltip: {
        ...baseChartOptions.plugins.tooltip,
        callbacks: {
          title: function(tooltipItems) {
            const depto = topDepartamentos[tooltipItems[0].dataIndex];
            return `🗺️ ${depto.departamento}`;
          },
          label: function(context) {
            const depto = topDepartamentos[context.dataIndex];
            const porcentaje = ((depto.total / totalNacional) * 100).toFixed(1);
            
            return [
              `Total: Q ${depto.total.toLocaleString('es-GT', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}`,
              `Pedidos: ${depto.cantidad}`,
              `${porcentaje}% del total nacional`,
              `Ticket promedio: Q ${(depto.total / depto.cantidad).toFixed(2)}`
            ];
          }
        }
      }
    }
  };

  return (
    <Card>
      <BlockStack gap="400">
        <InlineStack align="space-between">
          <Text as="h3" variant="headingMd">
            📍 Ventas por Departamento
          </Text>
          <Badge tone="success">
            {topDepartamentos.length} departamentos
          </Badge>
        </InlineStack>
        <ChartWrapper delay={7}> 
          <div style={{ height: "300px" }}>
            <Doughnut ref={chartRef} data={data} options={options} />
          </div>
        </ChartWrapper>
      </BlockStack>
    </Card>
  );
}

// Continuación del archivo...

export function CategoriasChart({ categoriasProductos }) {
  if (!categoriasProductos || Object.keys(categoriasProductos).length === 0) return null;

  const chartRef = useRef(null);
  const categorias = Object.entries(categoriasProductos)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  // Configuración de colores e íconos por categoría
  const categoriasConfig = {
    'Frenos': { color: '#DC2626', icon: '🛑', gradient: ['#DC2626', '#FCA5A5'] },
    'Filtros': { color: '#2563EB', icon: '🔧', gradient: ['#2563EB', '#93C5FD'] },
    'Lubricantes': { color: '#CA8A04', icon: '🛢️', gradient: ['#CA8A04', '#FDE047'] },
    'Sensores': { color: '#059669', icon: '📡', gradient: ['#059669', '#6EE7B7'] },
    'Bombas': { color: '#7C3AED', icon: '⚙️', gradient: ['#7C3AED', '#C4B5FD'] },
    'Mangueras': { color: '#EA580C', icon: '🔗', gradient: ['#EA580C', '#FDBA74'] },
    'Válvulas': { color: '#0891B2', icon: '🚰', gradient: ['#0891B2', '#67E8F9'] },
    'Fajas/Correas': { color: '#BE185D', icon: '🔄', gradient: ['#BE185D', '#FBCFE8'] },
    'Otros': { color: '#6B7280', icon: '📦', gradient: ['#6B7280', '#D1D5DB'] }
  };

  const data = {
    labels: categorias.map(([cat]) => cat),
    datasets: [
      {
        data: categorias.map(([, total]) => total),
        backgroundColor: (context) => {
          const ctx = context.chart.ctx;
          const chartArea = context.chart.chartArea;
          if (!chartArea) return categorias.map(([cat]) => {
            const config = categoriasConfig[cat] || categoriasConfig['Otros'];
            return config.color;
          });
          
          return categorias.map(([cat], index) => {
            const config = categoriasConfig[cat] || categoriasConfig['Otros'];
            const gradient = ctx.createRadialGradient(
              chartArea.left + chartArea.width / 2,
              chartArea.top + chartArea.height / 2,
              0,
              chartArea.left + chartArea.width / 2,
              chartArea.top + chartArea.height / 2,
              chartArea.width / 2
            );
            gradient.addColorStop(0, config.gradient[0]);
            gradient.addColorStop(1, config.gradient[1]);
            return gradient;
          });
        },
        borderWidth: 3,
        borderColor: '#fff',
        hoverBorderColor: categorias.map(([cat]) => {
          const config = categoriasConfig[cat] || categoriasConfig['Otros'];
          return config.color;
        }),
      },
    ],
  };

  const totalVentas = categorias.reduce((sum, [, value]) => sum + value, 0);

  const options = {
    ...baseChartOptions,
    scales: {
      r: {
        beginAtZero: true,
        ticks: {
          display: false
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      }
    },
    plugins: {
      ...baseChartOptions.plugins,
      legend: {
        position: 'right',
        labels: {
          padding: 15,
          font: { size: 11 },
          generateLabels: function(chart) {
            const data = chart.data;
            return data.labels.map((label, index) => {
              const value = data.datasets[0].data[index];
              const config = categoriasConfig[label] || categoriasConfig['Otros'];
              const percentage = ((value / totalVentas) * 100).toFixed(1);
              
              return {
                text: `${config.icon} ${label} (${percentage}%)`,
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
            const categoria = categorias[tooltipItems[0].dataIndex][0];
            const config = categoriasConfig[categoria] || categoriasConfig['Otros'];
            return `${config.icon} ${categoria}`;
          },
          label: function(context) {
            const [categoria, total] = categorias[context.dataIndex];
            const porcentaje = ((total / totalVentas) * 100).toFixed(1);
            
            return [
              `Total: Q ${total.toLocaleString('es-GT', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}`,
              `${porcentaje}% del total`,
              `Categoría ${context.dataIndex === 0 ? 'líder 🏆' : `#${context.dataIndex + 1}`}`
            ];
          }
        }
      }
    }
  };

  return (
    <Card>
      <BlockStack gap="400">
        <Text as="h3" variant="headingMd">
          🏷️ Categorías de Productos
        </Text>
        <ChartWrapper delay={8}>
          <div style={{ height: "300px" }}>
            <PolarArea ref={chartRef} data={data} options={options} />
          </div>
        </ChartWrapper>
      </BlockStack>
    </Card>
  );
}

export function MarcasChart({ topMarcas }) {
  if (!topMarcas || topMarcas.length === 0) return null;

  const chartRef = useRef(null);
  
  const coloresMarcas = {
    'TOYOTA': { color: '#EB0A1E', logo: '🚗' },
    'HONDA': { color: '#CC0000', logo: '🏍️' },
    'NISSAN': { color: '#C3002F', logo: '🚙' },
    'MAZDA': { color: '#7C878E', logo: '🚘' },
    'MITSUBISHI': { color: '#E60012', logo: '🚐' },
    'FORD': { color: '#003478', logo: '🛻' },
    'CHEVROLET': { color: '#D4AF37', logo: '🚕' },
    'VOLKSWAGEN': { color: '#00B1EB', logo: '🚌' },
    'HYUNDAI': { color: '#002C5F', logo: '🚗' },
    'KIA': { color: '#C21A30', logo: '🚙' },
    'Otras': { color: '#999999', logo: '🚛' }
  };

  const maxCantidad = Math.max(...topMarcas.map(m => m.cantidad));

  const data = {
    labels: topMarcas.map(m => m.marca),
    datasets: [
      {
        label: "Productos por Marca",
        data: topMarcas.map(m => m.cantidad),
        backgroundColor: topMarcas.map(m => {
          const config = coloresMarcas[m.marca] || coloresMarcas['Otras'];
          return config.color + 'CC'; // 80% opacity
        }),
        borderColor: topMarcas.map(m => {
          const config = coloresMarcas[m.marca] || coloresMarcas['Otras'];
          return config.color;
        }),
        borderRadius: {
          topLeft: 8,
          topRight: 8,
          bottomLeft: (context) => context.dataIndex === topMarcas.length - 1 ? 8 : 0,
          bottomRight: (context) => context.dataIndex === topMarcas.length - 1 ? 8 : 0
        },
        borderWidth: 2,
        borderSkipped: false,
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
            const marca = topMarcas[tooltipItems[0].dataIndex];
            const config = coloresMarcas[marca.marca] || coloresMarcas['Otras'];
            return `${config.logo} ${marca.marca}`;
          },
          label: function(context) {
            const marca = topMarcas[context.dataIndex];
            const totalMarcas = topMarcas.reduce((sum, m) => sum + m.cantidad, 0);
            const porcentaje = ((marca.cantidad / totalMarcas) * 100).toFixed(1);
            
            return [
              `Cantidad: ${marca.cantidad} productos`,
              `Total: Q ${marca.total.toLocaleString('es-GT', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}`,
              `${porcentaje}% del inventario`,
              `Valor promedio: Q ${(marca.total / marca.cantidad).toFixed(2)}`
            ];
          },
          footer: function(tooltipItems) {
            const marca = topMarcas[tooltipItems[0].dataIndex];
            if (marca.cantidad === maxCantidad) {
              return '🏆 Marca líder';
            }
            return '';
          }
        }
      }
    },
    scales: {
      x: {
        ticks: {
          maxRotation: 45,
          minRotation: 45,
          font: {
            size: 11,
            weight: '500'
          },
          callback: function(value, index) {
            const marca = topMarcas[index];
            const config = coloresMarcas[marca.marca] || coloresMarcas['Otras'];
            return config.logo + ' ' + marca.marca;
          }
        },
        grid: {
          display: false
        }
      },
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          callback: function(value) {
            return value + ' pzs';
          }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
          drawBorder: false
        }
      }
    },
    animation: {
      ...chartAnimations.bar,
      onComplete: function() {
        const chart = chartRef.current;
        if (!chart) return;
        
        const ctx = chart.ctx;
        const meta = chart.getDatasetMeta(0);
        
        ctx.save();
        ctx.font = 'bold 11px Arial';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#333';
        
        // Mostrar valores encima de las barras
        meta.data.forEach((bar, index) => {
          const marca = topMarcas[index];
          const y = bar.y - 5;
          ctx.fillText(marca.cantidad, bar.x, y);
        });
        
        ctx.restore();
      }
    }
  };

  return (
    <Card>
      <BlockStack gap="400">
        <InlineStack align="space-between">
          <Text as="h3" variant="headingMd">
            🚗 Ventas por Marca de Vehículo
          </Text>
          <Badge tone="info">
            {topMarcas.length} marcas
          </Badge>
        </InlineStack>
        <ChartWrapper delay={9}>  
          <div style={{ height: "300px" }}>
            <Bar ref={chartRef} data={data} options={options} />
          </div>
        </ChartWrapper>
      </BlockStack>
    </Card>
  );
}

export function NITsChart({ topNITs }) {
  if (!topNITs || topNITs.length === 0) return null;

  const chartRef = useRef(null);
  const maxTransacciones = Math.max(...topNITs.map(([, count]) => count));

  const data = {
    labels: topNITs.map(([nit]) => {
      // Ocultar parte del NIT por privacidad
      if (nit.length > 4) {
        return nit.substring(0, 3) + '***' + nit.substring(nit.length - 2);
      }
      return nit;
    }),
    datasets: [
      {
        label: "Transacciones por NIT",
        data: topNITs.map(([, count]) => count),
        backgroundColor: (context) => {
          const value = context.parsed.y;
          const intensity = value / maxTransacciones;
          return `rgba(${153 - (intensity * 50)}, ${102 + (intensity * 50)}, 255, ${0.6 + (intensity * 0.4)})`;
        },
        borderColor: chartColors.secondary.main,
        borderRadius: 12,
        borderWidth: 2,
        barThickness: 'flex',
        maxBarThickness: 50,
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
            return `🆔 Cliente Frecuente #${tooltipItems[0].dataIndex + 1}`;
          },
          label: function(context) {
            const [nit, count] = topNITs[context.dataIndex];
            const total = topNITs.reduce((sum, [, c]) => sum + c, 0);
            const porcentaje = ((count / total) * 100).toFixed(1);
            
            return [
              `NIT: ${nit}`,
              `Transacciones: ${count}`,
              `${porcentaje}% del total`,
              context.dataIndex === 0 ? '🏆 Cliente más frecuente' : ''
            ].filter(Boolean);
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          callback: function(value) {
            return value + ' trans.';
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
            size: 10,
            family: 'monospace'
          }
        },
        grid: {
          display: false
        }
      }
    },
    animation: {
      ...chartAnimations.bar,
      delay: (context) => context.dataIndex * 50
    }
  };

  return (
    <Card>
      <BlockStack gap="400">
        <InlineStack align="space-between">
          <Text as="h3" variant="headingMd">
            🆔 NITs más Frecuentes
          </Text>
          <Badge tone="attention">
            Top 10 clientes
          </Badge>
        </InlineStack>
        <ChartWrapper delay={10}>
          <div style={{ height: "300px" }}>
            <Bar ref={chartRef} data={data} options={options} />
          </div>
        </ChartWrapper>
      </BlockStack>
    </Card>
  );
}
