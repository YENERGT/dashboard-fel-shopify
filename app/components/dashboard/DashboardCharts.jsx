import { Card, Text, BlockStack } from "@shopify/polaris";
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
import { Line, Bar, Doughnut, Pie, PolarArea } from "react-chartjs-2";

// Registrar todos los componentes necesarios
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

// Opciones comunes para gráficos
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

export function VentasPorDiaChart({ ventasDiarias, tipo }) {
  const dias = Object.keys(ventasDiarias).sort((a, b) => parseInt(a) - parseInt(b));
  
  const data = {
    labels: dias.map(d => `Día ${d}`),
    datasets: [
      {
        label: "Ventas por Día",
        data: dias.map(d => ventasDiarias[d]),
        borderColor: "rgb(76, 175, 80)",
        backgroundColor: "rgba(76, 175, 80, 0.2)",
        tension: 0.4,
        fill: true,
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
            return `Ventas: Q ${context.parsed.y.toFixed(2)}`;
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
          📈 Ventas por Día
        </Text>
        <div style={{ height: "300px" }}>
          <Line data={data} options={options} />
        </div>
      </BlockStack>
    </Card>
  );
}

export function VentasPorHoraChart({ ventasPorHora }) {
  const horas = Array.from({ length: 24 }, (_, i) => i);
  
  const data = {
    labels: horas.map(h => `${h}:00`),
    datasets: [
      {
        label: "Ventas por Hora",
        data: horas.map(h => ventasPorHora[h] || 0),
        backgroundColor: "rgba(255, 159, 64, 0.6)",
        borderColor: "rgba(255, 159, 64, 1)",
        borderWidth: 1,
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
            return `Q ${context.parsed.y.toFixed(2)}`;
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
        }
      }
    }
  };

  return (
    <Card>
      <BlockStack gap="400">
        <Text as="h3" variant="headingMd">
          🕐 Ventas por Hora
        </Text>
        <div style={{ height: "300px" }}>
          <Bar data={data} options={options} />
        </div>
      </BlockStack>
    </Card>
  );
}

export function TopProductosChart({ topProductos }) {
  const data = {
    labels: topProductos.slice(0, 10).map(p => 
      p.nombre.length > 30 ? p.nombre.substring(0, 27) + '...' : p.nombre
    ),
    datasets: [
      {
        label: "Cantidad Vendida",
        data: topProductos.slice(0, 10).map(p => p.cantidad),
        backgroundColor: [
          '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
          '#FF9F40', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'
        ],
        borderWidth: 2,
        borderColor: '#fff',
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
            const producto = topProductos[context.dataIndex];
            return [
              `Cantidad: ${producto.cantidad}`,
              `Total: Q ${producto.total.toFixed(2)}`
            ];
          }
        }
      }
    },
  };

  return (
    <Card>
      <BlockStack gap="400">
        <Text as="h3" variant="headingMd">
          📦 Top 10 Productos Más Vendidos
        </Text>
        <div style={{ height: "300px" }}>
          <Doughnut data={data} options={options} />
        </div>
      </BlockStack>
    </Card>
  );
}

export function EstadosPedidosChart({ estadosPedidos }) {
  const estados = {
    'paid': { label: 'Pagado', color: '#4CAF50' },
    'pending': { label: 'Pendiente', color: '#FF9800' },
    'cancelled': { label: 'Cancelado', color: '#F44336' }
  };

  const labels = [];
  const valores = [];
  const colores = [];

  Object.keys(estados).forEach(key => {
    if (estadosPedidos[key] > 0) {
      labels.push(estados[key].label);
      valores.push(estadosPedidos[key]);
      colores.push(estados[key].color);
    }
  });

  const data = {
    labels: labels,
    datasets: [
      {
        data: valores,
        backgroundColor: colores,
        borderWidth: 2,
        borderColor: '#fff',
      },
    ],
  };

  const options = {
    ...commonOptions,
    plugins: {
      ...commonOptions.plugins,
      tooltip: {
        callbacks: {
          label: function(context) {
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((context.parsed / total) * 100).toFixed(1);
            return `${context.label}: ${context.parsed} (${percentage}%)`;
          }
        }
      }
    },
  };

  return (
    <Card>
      <BlockStack gap="400">
        <Text as="h3" variant="headingMd">
          📊 Estados de Pedidos
        </Text>
        <div style={{ height: "300px" }}>
          <Pie data={data} options={options} />
        </div>
      </BlockStack>
    </Card>
  );
}

export function MetodosPagoChart({ metodosPago }) {
  const data = {
    labels: metodosPago.map(m => m.metodo),
    datasets: [
      {
        label: "Total por Método",
        data: metodosPago.map(m => m.total),
        backgroundColor: [
          '#2196F3', '#E91E63', '#00BCD4', '#4CAF50', '#9C27B0',
          '#FF9800', '#795548', '#607D8B'
        ],
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
            const metodo = metodosPago[context.dataIndex];
            return [
              `Total: Q ${metodo.total.toFixed(2)}`,
              `Transacciones: ${metodo.cantidad}`
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
          💳 Métodos de Pago
        </Text>
        <div style={{ height: "300px" }}>
          <Bar data={data} options={options} />
        </div>
      </BlockStack>
    </Card>
  );
}

export function VentasPorCiudadChart({ topCiudades }) {
  if (!topCiudades || topCiudades.length === 0) return null;

  const data = {
    labels: topCiudades.slice(0, 8).map(c => c.ciudad),
    datasets: [
      {
        label: "Ventas por Ciudad",
        data: topCiudades.slice(0, 8).map(c => c.total),
        backgroundColor: 'rgba(33, 150, 243, 0.6)',
        borderColor: 'rgba(33, 150, 243, 1)',
        borderWidth: 1,
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
            const ciudad = topCiudades[context.dataIndex];
            return [
              `Total: Q ${ciudad.total.toFixed(2)}`,
              `Pedidos: ${ciudad.cantidad}`
            ];
          }
        }
      }
    },
    scales: {
      x: {
        ticks: {
          maxRotation: 45,
          minRotation: 45
        }
      },
      y: {
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
          🏙️ Ventas por Ciudad
        </Text>
        <div style={{ height: "300px" }}>
          <Bar data={data} options={options} />
        </div>
      </BlockStack>
    </Card>
  );
}

export function VentasPorDepartamentoChart({ topDepartamentos }) {
  if (!topDepartamentos || topDepartamentos.length === 0) return null;

  const colores = [
    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
    '#FF9F40', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'
  ];

  const data = {
    labels: topDepartamentos.slice(0, 6).map(d => d.departamento),
    datasets: [
      {
        data: topDepartamentos.slice(0, 6).map(d => d.total),
        backgroundColor: colores,
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
            const total = data.datasets[0].data.reduce((a, b) => a + b, 0);
            return data.labels.map((label, index) => {
              const value = data.datasets[0].data[index];
              const percentage = ((value / total) * 100).toFixed(1);
              return {
                text: `${label} (${percentage}%)`,
                fillStyle: data.datasets[0].backgroundColor[index],
                hidden: false,
                index: index
              };
            });
          }
        }
      }
    }
  };

  return (
    <Card>
      <BlockStack gap="400">
        <Text as="h3" variant="headingMd">
          📍 Ventas por Departamento
        </Text>
        <div style={{ height: "300px" }}>
          <Doughnut data={data} options={options} />
        </div>
      </BlockStack>
    </Card>
  );
}

export function CategoriaProductosChart({ categoriasProductos }) {
  if (!categoriasProductos || Object.keys(categoriasProductos).length === 0) return null;

  const categorias = Object.entries(categoriasProductos)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  const colores = {
    'Frenos': '#FF6384',
    'Filtros': '#36A2EB',
    'Lubricantes': '#FFCE56',
    'Sensores': '#4BC0C0',
    'Bombas': '#9966FF',
    'Mangueras': '#FF9F40',
    'Válvulas': '#FF6B6B',
    'Fajas/Correas': '#4ECDC4',
    'Otros': '#868686'
  };

  const data = {
    labels: categorias.map(([cat]) => cat),
    datasets: [
      {
        data: categorias.map(([, total]) => total),
        backgroundColor: categorias.map(([cat]) => colores[cat] || '#868686'),
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
          padding: 10,
          font: { size: 11 }
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
        <div style={{ height: "300px" }}>
          <PolarArea data={data} options={options} />
        </div>
      </BlockStack>
    </Card>
  );
}

export function MarcasVehiculosChart({ topMarcas }) {
  if (!topMarcas || topMarcas.length === 0) return null;

  const coloresMarcas = {
    'TOYOTA': '#EB0A1E',
    'HONDA': '#CC0000',
    'NISSAN': '#C3002F',
    'MAZDA': '#7C878E',
    'MITSUBISHI': '#E60012',
    'FORD': '#003478',
    'CHEVROLET': '#D4AF37',
    'VOLKSWAGEN': '#00B1EB',
    'HYUNDAI': '#002C5F',
    'KIA': '#C21A30',
    'Otras': '#999999'
  };

  const data = {
    labels: topMarcas.map(m => m.marca),
    datasets: [
      {
        label: "Productos por Marca",
        data: topMarcas.map(m => m.cantidad),
        backgroundColor: topMarcas.map(m => coloresMarcas[m.marca] || '#999999'),
        borderRadius: 8,
        borderWidth: 1,
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
            const marca = topMarcas[context.dataIndex];
            return [
              `Cantidad: ${marca.cantidad} productos`,
              `Total: Q ${marca.total.toFixed(2)}`
            ];
          }
        }
      }
    },
    scales: {
      x: {
        ticks: {
          maxRotation: 45,
          minRotation: 45
        }
      },
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1
        }
      }
    }
  };

  return (
    <Card>
      <BlockStack gap="400">
        <Text as="h3" variant="headingMd">
          🚗 Ventas por Marca de Vehículo
        </Text>
        <div style={{ height: "300px" }}>
          <Bar data={data} options={options} />
        </div>
      </BlockStack>
    </Card>
  );
}

export function TopNITsChart({ topNITs }) {
  if (!topNITs || topNITs.length === 0) return null;

  const data = {
    labels: topNITs.map(([nit]) => nit),
    datasets: [
      {
        label: "Transacciones por NIT",
        data: topNITs.map(([, count]) => count),
        backgroundColor: 'rgba(153, 102, 255, 0.6)',
        borderColor: 'rgba(153, 102, 255, 1)',
        borderRadius: 8,
        borderWidth: 2,
      },
    ],
  };

  const options = {
    ...commonOptions,
    plugins: {
      ...commonOptions.plugins,
      legend: { display: false }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1
        }
      }
    }
  };

  return (
    <Card>
      <BlockStack gap="400">
        <Text as="h3" variant="headingMd">
          🆔 NITs más Frecuentes
        </Text>
        <div style={{ height: "300px" }}>
          <Bar data={data} options={options} />
        </div>
      </BlockStack>
    </Card>
  );
}