import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { Card, Text, BlockStack } from "@shopify/polaris";

// Lazy load de los componentes de charts
const Line = lazy(() => import('react-chartjs-2').then(module => ({ default: module.Line })));
const Bar = lazy(() => import('react-chartjs-2').then(module => ({ default: module.Bar })));
const Doughnut = lazy(() => import('react-chartjs-2').then(module => ({ default: module.Doughnut })));
const Pie = lazy(() => import('react-chartjs-2').then(module => ({ default: module.Pie })));
const PolarArea = lazy(() => import('react-chartjs-2').then(module => ({ default: module.PolarArea })));

// Componente de loading para charts
function ChartSkeleton({ height = "300px" }) {
  return (
    <div 
      style={{ 
        height, 
        backgroundColor: '#f6f6f7',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
      }}
    >
      <div style={{ 
        width: '24px', 
        height: '24px', 
        border: '2px solid #e1e3e5',
        borderTop: '2px solid #008060',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }} />
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

// Hook para detectar cuando el chart debe cargarse
function useIntersectionObserver(threshold = 0.1) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasBeenVisible, setHasBeenVisible] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
        if (entry.isIntersecting && !hasBeenVisible) {
          setHasBeenVisible(true);
        }
      },
      { threshold }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [threshold, hasBeenVisible]);

  return [ref, isIntersecting || hasBeenVisible];
}

// Componente principal de chart lazy
export function LazyChart({ 
  type = 'line', 
  data, 
  options, 
  title, 
  height = "300px",
  delay = 0,
  ...props 
}) {
  const [containerRef, shouldLoad] = useIntersectionObserver(0.1);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (shouldLoad) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, delay * 100);
      return () => clearTimeout(timer);
    }
  }, [shouldLoad, delay]);

  const getChartComponent = () => {
    switch (type.toLowerCase()) {
      case 'bar': return Bar;
      case 'doughnut': return Doughnut;
      case 'pie': return Pie;
      case 'polararea': return PolarArea;
      case 'line':
      default: return Line;
    }
  };

  const ChartComponent = getChartComponent();

  return (
    <Card>
      <BlockStack gap="400">
        {title && (
          <Text as="h3" variant="headingMd">
            {title}
          </Text>
        )}
        <div 
          ref={containerRef}
          style={{ height }}
        >
          {isVisible ? (
            <Suspense fallback={<ChartSkeleton height={height} />}>
              <div style={{ height: '100%' }}>
                <ChartComponent 
                  data={data} 
                  options={options} 
                  {...props}
                />
              </div>
            </Suspense>
          ) : (
            <ChartSkeleton height={height} />
          )}
        </div>
      </BlockStack>
    </Card>
  );
}

// Hook para precargar chart.js cuando el usuario interactúa
export function useChartPreloader() {
  useEffect(() => {
    const preloadCharts = () => {
      // Precargar Chart.js en el siguiente tick
      setTimeout(() => {
        import('chart.js');
        import('react-chartjs-2');
      }, 100);
    };

    // Precargar en hover, focus, o scroll
    const events = ['mouseenter', 'focusin', 'scroll'];
    
    events.forEach(event => {
      document.addEventListener(event, preloadCharts, { 
        once: true, 
        passive: true 
      });
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, preloadCharts);
      });
    };
  }, []);
}
