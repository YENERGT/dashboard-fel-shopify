import { Link } from "@remix-run/react";
import { useEffect, useRef } from "react";

export function PrefetchLink({ 
  to, 
  children, 
  prefetch = "intent", 
  className,
  style,
  ...props 
}) {
  const linkRef = useRef(null);

  useEffect(() => {
    const link = linkRef.current;
    if (!link) return;

    // Prefetch cuando el usuario hace hover
    const handleMouseEnter = () => {
      // Crear link invisible para prefetch
      const prefetchLink = document.createElement('link');
      prefetchLink.rel = 'prefetch';
      prefetchLink.href = to;
      document.head.appendChild(prefetchLink);
    };

    // Prefetch cuando el link entra en viewport (lazy)
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            handleMouseEnter();
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '50px' }
    );

    link.addEventListener('mouseenter', handleMouseEnter, { once: true });
    observer.observe(link);

    return () => {
      link.removeEventListener('mouseenter', handleMouseEnter);
      observer.disconnect();
    };
  }, [to]);

  return (
    <Link
      ref={linkRef}
      to={to}
      prefetch={prefetch}
      className={className}
      style={style}
      {...props}
    >
      {children}
    </Link>
  );
}

// Hook para prefetch programático
export function usePrefetch() {
  const prefetchRoute = (route) => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = route;
    document.head.appendChild(link);
  };

  return { prefetchRoute };
}