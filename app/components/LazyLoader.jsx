import { useState, useRef, useEffect } from 'react';

// Componente para lazy loading de imágenes
export function LazyImage({ 
  src, 
  alt, 
  placeholder = null, 
  className = '', 
  style = {},
  onLoad = null 
}) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [imageSrc, setImageSrc] = useState(placeholder);
  const imgRef = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setImageSrc(src);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '50px' }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [src]);

  const handleLoad = () => {
    setLoaded(true);
    setError(false);
    onLoad?.();
  };

  const handleError = () => {
    setError(true);
    setLoaded(false);
  };

  return (
    <div 
      ref={imgRef}
      className={`lazy-image-container ${className}`}
      style={{
        ...style,
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {!loaded && !error && placeholder && (
        <div 
          className="lazy-image-placeholder"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: placeholder.startsWith('#') ? placeholder : `url(${placeholder})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(5px)',
            transform: 'scale(1.1)'
          }}
        />
      )}
      
      {imageSrc && (
        <img
          src={imageSrc}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'opacity 0.3s ease',
            opacity: loaded ? 1 : 0
          }}
        />
      )}
      
      {error && (
        <div 
          className="lazy-image-error"
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: '#666',
            textAlign: 'center'
          }}
        >
          Error al cargar imagen
        </div>
      )}
    </div>
  );
}

// Hook para preload de recursos críticos
export function useResourcePreloader() {
  const preloadResource = (url, type = 'script') => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = url;
    link.as = type;
    
    if (type === 'script') {
      link.crossOrigin = 'anonymous';
    }
    
    document.head.appendChild(link);
  };

  const preloadImage = (src) => {
    const img = new Image();
    img.src = src;
  };

  const preloadFont = (url, family) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = url;
    link.as = 'font';
    link.type = 'font/woff2';
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  };

  return { preloadResource, preloadImage, preloadFont };
}

// Componente para lazy loading de scripts
export function LazyScript({ 
  src, 
  onLoad = null, 
  defer = true, 
  async = false 
}) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = src;
    script.defer = defer;
    script.async = async;
    
    script.onload = () => {
      setLoaded(true);
      onLoad?.();
    };
    
    script.onerror = () => {
      setError(true);
    };

    document.head.appendChild(script);
    
    return () => {
      document.head.removeChild(script);
    };
  }, [src, defer, async, onLoad]);

  return null; // No renderiza nada
}
