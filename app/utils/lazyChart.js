// Lazy loading de Chart.js para reducir bundle inicial
let chartJsPromise = null;

export async function loadChartJS() {
  if (chartJsPromise) {
    return chartJsPromise;
  }

  chartJsPromise = import('chart.js/auto').then((module) => {
    const Chart = module.default;
    
    // Configuración global optimizada
    Chart.defaults.font.family = 'var(--p-font-family-sans)';
    Chart.defaults.responsive = true;
    Chart.defaults.maintainAspectRatio = false;
    Chart.defaults.animation.duration = 750; // Reducir animaciones
    Chart.defaults.plugins.legend.display = true;
    
    return Chart;
  });

  return chartJsPromise;
}

// Cache para instancias de gráficos
const chartCache = new Map();

export function getCachedChart(canvasId) {
  return chartCache.get(canvasId);
}

export function setCachedChart(canvasId, chart) {
  chartCache.set(canvasId, chart);
}

export function destroyChart(canvasId) {
  const chart = chartCache.get(canvasId);
  if (chart) {
    chart.destroy();
    chartCache.delete(canvasId);
  }
}

// Intersection Observer para cargar gráficos solo cuando sean visibles
export function createChartObserver(callback) {
  return new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          callback(entry.target);
        }
      });
    },
    {
      rootMargin: '100px', // Cargar 100px antes de ser visible
      threshold: 0.1
    }
  );
}

// Utilidad para crear gráficos con lazy loading
export async function createLazyChart(canvas, config) {
  const Chart = await loadChartJS();
  const existingChart = getCachedChart(canvas.id);
  
  if (existingChart) {
    existingChart.destroy();
  }
  
  const chart = new Chart(canvas, config);
  setCachedChart(canvas.id, chart);
  
  return chart;
}