import { useEffect, useRef } from 'react';

export function ChartWrapper({ children, delay = 0 }) {
  const chartRef = useRef(null);

  useEffect(() => {
    if (chartRef.current) {
      // Agregar animación de entrada
      chartRef.current.style.opacity = '0';
      chartRef.current.style.transform = 'scale(0.95)';
      
      setTimeout(() => {
        chartRef.current.style.transition = 'all 0.5s ease-out';
        chartRef.current.style.opacity = '1';
        chartRef.current.style.transform = 'scale(1)';
      }, delay * 100);
    }
  }, [delay]);

  return (
    <div ref={chartRef} className="chart-container">
      {children}
    </div>
  );
}