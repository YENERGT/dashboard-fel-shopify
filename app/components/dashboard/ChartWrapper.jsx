import { useEffect, useState, useRef } from 'react';

export function ChartWrapper({ children, delay = 0 }) {
  const [isVisible, setIsVisible] = useState(false);
  const chartRef = useRef(null);

  useEffect(() => {
    // Timer para controlar el delay de la animación
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay * 100);

    // Observer para animación cuando el elemento entra en viewport
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('chart-visible');
          }
        });
      },
      { threshold: 0.1 }
    );

    if (chartRef.current) {
      observer.observe(chartRef.current);
    }

    return () => {
      clearTimeout(timer);
      if (chartRef.current) {
        observer.unobserve(chartRef.current);
      }
    };
  }, [delay]);

  return (
    <div 
      ref={chartRef}
      className="chart-container"
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(20px)',
        transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
        willChange: 'opacity, transform'
      }}
    >
      {children}
    </div>
  );
}