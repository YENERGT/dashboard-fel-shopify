import React, { memo, useMemo } from 'react';
import { Card, Text, BlockStack } from "@shopify/polaris";
import { ChartWrapper } from './ChartWrapper';

// Componente memoizado para evitar re-renders innecesarios
export const MemoizedVentasChart = memo(({ ventasDiarias, ventasDiariasAnterior, tipo }) => {
  // Memoizar el procesamiento de datos
  const chartData = useMemo(() => {
    if (!ventasDiarias || Object.keys(ventasDiarias).length === 0) return null;
    
    const labels = Object.keys(ventasDiarias).sort();
    const data = labels.map(label => ventasDiarias[label] || 0);
    const dataAnterior = labels.map(label => ventasDiariasAnterior?.[label] || 0);
    
    return {
      labels,
      datasets: [
        {
          label: `Ventas ${tipo === 'dia' ? 'por Hora' : tipo === 'mes' ? 'por Día' : 'por Mes'}`,
          data,
          borderColor: '#008060',
          backgroundColor: 'rgba(0, 128, 96, 0.1)',
          tension: 0.4,
          fill: true,
        },
        ...(ventasDiariasAnterior ? [{
          label: 'Período Anterior',
          data: dataAnterior,
          borderColor: '#6B7280',
          backgroundColor: 'rgba(107, 114, 128, 0.1)',
          tension: 0.4,
          fill: false,
          borderDash: [5, 5],
        }] : [])
      ]
    };
  }, [ventasDiarias, ventasDiariasAnterior, tipo]);

  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index'
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#008060',
        borderWidth: 1,
        displayColors: true,
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: Q ${context.parsed.y.toLocaleString('es-GT', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}`;
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
          }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    }
  }), []);

  if (!chartData) return null;

  return (
    <Card>
      <BlockStack gap="400">
        <Text as="h3" variant="headingMd">
          📈 Evolución de Ventas
        </Text>
        <ChartWrapper delay={1}>
          <div style={{ height: "400px" }}>
            <Line data={chartData} options={chartOptions} />
          </div>
        </ChartWrapper>
      </BlockStack>
    </Card>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function para evitar re-renders innecesarios
  return (
    JSON.stringify(prevProps.ventasDiarias) === JSON.stringify(nextProps.ventasDiarias) &&
    JSON.stringify(prevProps.ventasDiariasAnterior) === JSON.stringify(nextProps.ventasDiariasAnterior) &&
    prevProps.tipo === nextProps.tipo
  );
});

MemoizedVentasChart.displayName = 'MemoizedVentasChart';

// Componente memoizado para métricas
export const MemoizedMetricCard = memo(({ 
  title, 
  value, 
  icon, 
  change, 
  format = "number",
  delay = 0,
  tone = null,
  subtitle = null
}) => {
  const formattedValue = useMemo(() => {
    if (format === "currency") {
      const numValue = typeof value === 'string' ? parseFloat(value.replace(/[Q,]/g, '')) : value;
      return `Q ${numValue.toLocaleString('es-GT', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })}`;
    }
    
    if (format === "number") {
      const numValue = typeof value === 'string' ? parseInt(value.replace(/,/g, '')) : value;
      return numValue.toLocaleString('es-GT');
    }
    
    return value;
  }, [value, format]);

  const changeDisplay = useMemo(() => {
    if (!change) return null;
    
    const isPositive = change > 0;
    const prefix = isPositive ? '+' : '';
    const suffix = '%';
    
    return {
      value: `${prefix}${change.toFixed(1)}${suffix}`,
      tone: isPositive ? 'success' : 'critical',
      icon: isPositive ? '↗' : '↘'
    };
  }, [change]);

  return (
    <Card>
      <BlockStack gap="300">
        <InlineStack align="space-between">
          <Text as="p" variant="bodyMd" tone="subdued">
            {icon} {title}
          </Text>
          {changeDisplay && (
            <Badge tone={changeDisplay.tone} size="small">
              {changeDisplay.icon} {changeDisplay.value}
            </Badge>
          )}
        </InlineStack>
        
        <Text as="h3" variant="headingLg" tone={tone}>
          {formattedValue}
        </Text>
        
        {subtitle && (
          <Text as="p" variant="bodySm" tone="subdued">
            {subtitle}
          </Text>
        )}
      </BlockStack>
    </Card>
  );
});

MemoizedMetricCard.displayName = 'MemoizedMetricCard';
