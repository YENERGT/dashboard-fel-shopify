import { Card, Text, BlockStack, DataTable } from "@shopify/polaris";
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
  RadialLinearScale
);

const commonOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: 'bottom',
      labels: {
        padding: 15,
        font: {
          size: 11
        }
      }
    }
  }
};

// Gráfica de comparación Ingresos vs Egresos vs Profit
export function IngresosVsEgresosChart({ totalIngresos, totalEgresos, profit }) {
  const data = {
    labels: ['Ingresos', 'Egresos', 'Profit'],
    datasets: [
      {
        label: 'Monto en Q',
        data: [totalIngresos, totalEgresos, profit],
        backgroundColor: [
          'rgba(76, 175, 80, 0.7)',
          'rgba(244, 67, 54, 0.7)',
          profit >= 0 ? 'rgba(33, 150, 243, 0.7)' : 'rgba(255, 152, 0, 0.7)'
        ],
        borderColor: [
          'rgb(76, 175, 80)',
          'rgb(244, 67, 54)',
          profit >= 0 ? 'rgb(33, 150, 243)' : 'rgb(255, 152, 0)'
        ],
        borderWidth: 2,
      },
    ],
  };

  const options = {
    ...commonOptions,
    plugins: {
      ...commonOptions.plugins,
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `${context.label}: Q ${context.parsed.y.toFixed(2)}`;
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
        }
      }
    }
  };

  return (
    <Card>
      <BlockStack gap="400">
        <Text as="h3" variant="headingMd">
          💰 Comparación Ingresos vs Egresos
        </Text>
        <div style={{ height: "350px" }}>
          <Bar data={data} options={options} />
        </div>
      </BlockStack>
    </Card>
  );
}

// Gráfica de gastos por categoría
export function GastosPorCategoriaChart({ categoriasOrdenadas }) {
  if (!categoriasOrdenadas || categoriasOrdenadas.length === 0) return null;

  const colores = {
    'Marketing': '#FF6384',
    'Tecnología': '#36A2EB',
    'Personal': '#FFCE56',
    'Oficina': '#4BC0C0',
    'Inventario': '#9966FF',
    'Transporte': '#FF9F40',
    'Impuestos': '#FF6B6B',
    'Servicios Profesionales': '#4ECDC4',
    'Otros': '#999999'
  };

  const data = {
    labels: categoriasOrdenadas.map(c => c.categoria),
    datasets: [
      {
        data: categoriasOrdenadas.map(c => c.total),
        backgroundColor: categoriasOrdenadas.map(c => colores[c.categoria] || '#999999'),
        borderWidth: 2,
        borderColor: '#fff',
      },
    ],
  };

  const options = {
    ...commonOptions,
    plugins: {
      ...commonOptions.plugins,
      legend: {
        position: 'right',
        labels: {
          generateLabels: function(chart) {
            const data = chart.data;
            return data.labels.map((label, index) => {
              const categoria = categoriasOrdenadas[index];
              return {
                text: `${label} (${categoria.porcentaje.toFixed(1)}%)`,
                fillStyle: data.datasets[0].backgroundColor[index],
                hidden: false,
                index: index
              };
            });
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const categoria = categoriasOrdenadas[context.dataIndex];
            return [
              `Total: Q ${categoria.total.toFixed(2)}`,
              `Porcentaje: ${categoria.porcentaje.toFixed(1)}%`
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
          📊 Distribución de Gastos por Categoría
        </Text>
        <div style={{ height: "350px" }}>
          <Doughnut data={data} options={options} />
        </div>
      </BlockStack>
    </Card>
  );
}

// Gráfica de evolución temporal
export function EvolucionGastosChart({ gastosPorDia, ventasDiarias, tipo }) {
  let labels, datosGastos, datosIngresos, titulo;
  
  if (tipo === 'año') {
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    labels = meses;
    datosGastos = Array.from({ length: 12 }, (_, i) => gastosPorDia[i + 1] || 0);
    datosIngresos = Array.from({ length: 12 }, (_, i) => ventasDiarias[i + 1] || 0);
    titulo = "📈 Evolución Mensual de Ingresos vs Egresos";
  } else if (tipo === 'mes') {
    const dias = Array.from({ length: 31 }, (_, i) => i + 1);
    labels = dias.map(d => `Día ${d}`);
    datosGastos = dias.map(d => gastosPorDia[d] || 0);
    datosIngresos = dias.map(d => ventasDiarias[d] || 0);
    titulo = "📈 Evolución Diaria de Ingresos vs Egresos";
  } else {
    const horas = Array.from({ length: 24 }, (_, i) => i);
    labels = horas.map(h => `${h}:00`);
    datosGastos = horas.map(h => gastosPorDia[h] || 0);
    datosIngresos = horas.map(h => ventasDiarias[h] || 0);
    titulo = "📈 Evolución por Hora de Ingresos vs Egresos";
  }

  const data = {
    labels: labels,
    datasets: [
      {
        label: 'Ingresos',
        data: datosIngresos,
        borderColor: 'rgb(76, 175, 80)',
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        borderWidth: 2,
        tension: 0.4,
        fill: true,
      },
      {
        label: 'Egresos',
        data: datosGastos,
        borderColor: 'rgb(244, 67, 54)',
        backgroundColor: 'rgba(244, 67, 54, 0.1)',
        borderWidth: 2,
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const options = {
    ...commonOptions,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      ...commonOptions.plugins,
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: Q ${context.parsed.y.toFixed(2)}`;
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
        <div style={{ height: "350px" }}>
          <Line data={data} options={options} />
        </div>
      </BlockStack>
    </Card>
  );
}

// Gráfica de top empresas
export function TopEmpresasGastosChart({ topEmpresas }) {
  if (!topEmpresas || topEmpresas.length === 0) return null;

  const data = {
    labels: topEmpresas.map(e => 
      e.empresa.length > 25 ? e.empresa.substring(0, 22) + '...' : e.empresa
    ),
    datasets: [
      {
        label: 'Gasto Total',
        data: topEmpresas.map(e => e.total),
        backgroundColor: 'rgba(255, 99, 132, 0.7)',
        borderColor: 'rgb(255, 99, 132)',
        borderWidth: 1,
      },
    ],
  };

  const options = {
    ...commonOptions,
    indexAxis: 'y',
    plugins: {
      ...commonOptions.plugins,
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: function(context) {
            const empresa = topEmpresas[context.dataIndex];
            return [
              `Total: Q ${empresa.total.toFixed(2)}`,
              `Porcentaje: ${empresa.porcentaje.toFixed(1)}%`
            ];
          }
        }
      }
    },
    scales: {
      x: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return `Q ${value}`;
          }
        }
      }
    }
  };

  return (
    <Card>
      <BlockStack gap="400">
        <Text as="h3" variant="headingMd">
          🏢 Top 10 Empresas por Gastos
        </Text>
        <div style={{ height: "350px" }}>
          <Bar data={data} options={options} />
        </div>
      </BlockStack>
    </Card>
  );
}

// Tabla de detalles de gastos
export function TablaDetalleGastos({ detalleGastos }) {
  if (!detalleGastos || detalleGastos.length === 0) return null;

  const rows = detalleGastos.slice(0, 20).map(gasto => [
    new Date(gasto.fecha).toLocaleDateString('es-GT'),
    gasto.empresa,
    gasto.producto.length > 40 ? gasto.producto.substring(0, 37) + '...' : gasto.producto,
    gasto.categoria,
    `Q ${gasto.monto.toFixed(2)}`
  ]);

  return (
    <Card>
      <BlockStack gap="400">
        <Text as="h3" variant="headingMd">
          📋 Últimos 20 Gastos Registrados
        </Text>
        <DataTable
          columnContentTypes={["text", "text", "text", "text", "numeric"]}
          headings={["Fecha", "Empresa", "Producto/Servicio", "Categoría", "Monto"]}
          rows={rows}
        />
      </BlockStack>
    </Card>
  );
}