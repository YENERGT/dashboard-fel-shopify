// Paleta de colores profesional
export const chartColors = {
  primary: {
    main: 'rgba(0, 128, 96, 1)',
    light: 'rgba(0, 128, 96, 0.2)',
    gradient: ['rgba(0, 128, 96, 0.8)', 'rgba(0, 128, 96, 0.2)']
  },
  secondary: {
    main: 'rgba(99, 102, 241, 1)',
    light: 'rgba(99, 102, 241, 0.2)',
    gradient: ['rgba(99, 102, 241, 0.8)', 'rgba(99, 102, 241, 0.2)']
  },
  success: {
    main: 'rgba(34, 197, 94, 1)',
    light: 'rgba(34, 197, 94, 0.2)',
    gradient: ['rgba(34, 197, 94, 0.8)', 'rgba(34, 197, 94, 0.2)']
  },
  warning: {
    main: 'rgba(251, 146, 60, 1)',
    light: 'rgba(251, 146, 60, 0.2)',
    gradient: ['rgba(251, 146, 60, 0.8)', 'rgba(251, 146, 60, 0.2)']
  },
  danger: {
    main: 'rgba(239, 68, 68, 1)',
    light: 'rgba(239, 68, 68, 0.2)',
    gradient: ['rgba(239, 68, 68, 0.8)', 'rgba(239, 68, 68, 0.2)']
  },
  info: {
    main: 'rgba(59, 130, 246, 1)',
    light: 'rgba(59, 130, 246, 0.2)',
    gradient: ['rgba(59, 130, 246, 0.8)', 'rgba(59, 130, 246, 0.2)']
  },
  palette: [
    '#008060', '#6366f1', '#22c55e', '#fb923c', '#ef4444',
    '#3b82f6', '#a855f7', '#ec4899', '#14b8a6', '#f59e0b'
  ]
};

// Crear gradientes
export const createGradient = (ctx, chartArea, colors) => {
  if (!ctx || !chartArea || !colors) return null;
  
  try {
    const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
    gradient.addColorStop(0, colors[1]);
    gradient.addColorStop(1, colors[0]);
    return gradient;
  } catch (error) {
    console.warn('Error creating gradient:', error);
    return colors[0]; // Fallback to solid color
  }
};

// Configuración base mejorada
export const baseChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    intersect: false,
    mode: 'index'
  },
  animation: {
    duration: 2000,
    easing: 'easeInOutQuart',
    onComplete: function() {
      // Callback cuando termina la animación
    }
  },
  plugins: {
    legend: {
      display: true,
      position: 'bottom',
      labels: {
        padding: 20,
        usePointStyle: true,
        font: {
          size: 12,
          family: "'Inter', sans-serif"
        },
        generateLabels: function(chart) {
          try {
            const data = chart.data;
            if (data.labels && data.datasets && data.datasets.length > 0) {
              return data.labels.map((label, i) => {
                const dataset = data.datasets[0];
                const value = dataset.data?.[i] || 0;
                const validData = dataset.data?.filter(v => v != null && !isNaN(v)) || [];
                const total = validData.reduce((a, b) => (a || 0) + (b || 0), 0);
                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
                
                return {
                  text: `${label}: ${percentage}%`,
                  fillStyle: Array.isArray(dataset.backgroundColor) 
                    ? dataset.backgroundColor[i] 
                    : dataset.backgroundColor,
                  strokeStyle: dataset.borderColor 
                    ? (Array.isArray(dataset.borderColor) 
                      ? dataset.borderColor[i] 
                      : dataset.borderColor)
                    : undefined,
                  lineWidth: 2,
                  hidden: false,
                  index: i
                };
              });
            }
          } catch (error) {
            console.warn('Error generating labels:', error);
          }
          return [];
        }
      }
    },
    tooltip: {
      enabled: true,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      titleColor: '#fff',
      bodyColor: '#fff',
      borderColor: '#ddd',
      borderWidth: 1,
      titleFont: {
        size: 14,
        weight: 'bold'
      },
      bodyFont: {
        size: 13
      },
      padding: 12,
      boxPadding: 6,
      usePointStyle: true,
      callbacks: {
        labelTextColor: function() {
          return '#fff';
        }
      }
    }
  }
};

// Animaciones personalizadas para diferentes tipos de gráficos
export const chartAnimations = {
  line: {
    tension: {
      duration: 1000,
      easing: 'linear',
      from: 1,
      to: 0.4,
      loop: false
    },
    y: {
      duration: 2000,
      from: (ctx) => {
        try {
          return ctx.chart.height;
        } catch {
          return 0;
        }
      },
      to: (ctx) => {
        try {
          return ctx.parsed?.y ?? ctx.raw?.y ?? 0;
        } catch {
          return 0;
        }
      },
      easing: 'easeOutElastic'
    }
  },
  bar: {
    y: {
      duration: 1500,
      from: (ctx) => {
        try {
          return ctx.chart.scales.y.getPixelForValue(0);
        } catch {
          return 0;
        }
      },
      easing: 'easeOutBounce'
    }
  },
  doughnut: {
    animateRotate: true,
    animateScale: true,
    animation: {
      animateRotate: true,
      animateScale: true,
      duration: 2000,
      easing: 'easeInOutQuart'
    }
  }
};