import { useEffect, useRef, useState, useCallback, useMemo } from 'react';

// Hook para performance monitoring
export function usePerformanceMonitor(componentName) {
  const renderCount = useRef(0);
  const startTime = useRef(performance.now());

  useEffect(() => {
    renderCount.current++;
    const endTime = performance.now();
    const renderTime = endTime - startTime.current;
    
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[PERF] ${componentName}: Render #${renderCount.current}, Time: ${renderTime.toFixed(2)}ms`);
    }
    
    startTime.current = endTime;
  });

  return renderCount.current;
}

// Hook para lazy loading con Intersection Observer
export function useLazyLoading(threshold = 0.1, rootMargin = '50px') {
  const [isVisible, setIsVisible] = useState(false);
  const [hasBeenVisible, setHasBeenVisible] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasBeenVisible) {
          setIsVisible(true);
          setHasBeenVisible(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [threshold, rootMargin, hasBeenVisible]);

  return [ref, isVisible, hasBeenVisible];
}

// Hook para Virtual Scrolling en tablas grandes
export function useVirtualScrolling(items, containerHeight = 400, itemHeight = 40) {
  const [visibleItems, setVisibleItems] = useState([]);
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef();

  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const totalHeight = items.length * itemHeight;
  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(startIndex + visibleCount + 1, items.length);

  useEffect(() => {
    const visible = items.slice(startIndex, endIndex).map((item, index) => ({
      ...item,
      index: startIndex + index,
      top: (startIndex + index) * itemHeight
    }));
    setVisibleItems(visible);
  }, [items, startIndex, endIndex, itemHeight]);

  const handleScroll = (e) => {
    setScrollTop(e.target.scrollTop);
  };

  return {
    visibleItems,
    totalHeight,
    containerRef,
    handleScroll,
    containerProps: {
      ref: containerRef,
      onScroll: handleScroll,
      style: {
        height: containerHeight,
        overflowY: 'auto'
      }
    }
  };
}

// Hook para lazy loading de imágenes
export function useLazyImage(src, placeholder = null) {
  const [imageSrc, setImageSrc] = useState(placeholder);
  const [isLoaded, setIsLoaded] = useState(false);
  const imgRef = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setImageSrc(src);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [src]);

  const handleLoad = () => setIsLoaded(true);

  return { imageSrc, isLoaded, imgRef, handleLoad };
}

// Hook para debouncing de búsquedas
export function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

// Hook para preload de datos en hover
export function usePreloadOnHover(preloadFunction, dependencies = []) {
  const [isPreloaded, setIsPreloaded] = useState(false);
  const elementRef = useRef();

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handleMouseEnter = () => {
      if (!isPreloaded) {
        preloadFunction();
        setIsPreloaded(true);
      }
    };

    element.addEventListener('mouseenter', handleMouseEnter, { once: true });
    
    return () => {
      element.removeEventListener('mouseenter', handleMouseEnter);
    };
  }, [preloadFunction, isPreloaded, ...dependencies]);

  return elementRef;
}

// Hook para batch de updates
export function useBatchedUpdates() {
  const [updates, setUpdates] = useState([]);
  const timeoutRef = useRef();

  const addUpdate = (updateFunction) => {
    setUpdates(prev => [...prev, updateFunction]);
    
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setUpdates(currentUpdates => {
        currentUpdates.forEach(update => update());
        return [];
      });
    }, 16); // ~60fps
  };

  return addUpdate;
}

// Hook para throttling de eventos
export function useThrottle(callback, delay) {
  const throttleRef = useRef();
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  return (...args) => {
    if (!throttleRef.current) {
      callbackRef.current(...args);
      throttleRef.current = setTimeout(() => {
        throttleRef.current = null;
      }, delay);
    }
  };
}

// Hook para memoización persistente
export function usePersistentMemo(factory, deps, key) {
  const [value, setValue] = useState(() => {
    try {
      const cached = sessionStorage.getItem(`memo_${key}`);
      return cached ? JSON.parse(cached) : factory();
    } catch {
      return factory();
    }
  });

  useEffect(() => {
    const newValue = factory();
    setValue(newValue);
    
    try {
      sessionStorage.setItem(`memo_${key}`, JSON.stringify(newValue));
    } catch {
      // Ignore storage errors
    }
  }, deps);

  return value;
}

// Hook para optimistic updates
export function useOptimisticUpdate(initialValue, updateFunction) {
  const [value, setValue] = useState(initialValue);
  const [isOptimistic, setIsOptimistic] = useState(false);

  const optimisticUpdate = async (newValue, serverUpdate) => {
    const previousValue = value;
    setValue(newValue);
    setIsOptimistic(true);

    try {
      const serverValue = await serverUpdate(newValue);
      setValue(serverValue);
    } catch (error) {
      setValue(previousValue);
      throw error;
    } finally {
      setIsOptimistic(false);
    }
  };

  return [value, optimisticUpdate, isOptimistic];
}

// Hook para intersection observer con múltiples elementos
export function useMultipleIntersectionObserver(threshold = 0.1) {
  const [entries, setEntries] = useState(new Map());
  const observer = useRef();

  useEffect(() => {
    observer.current = new IntersectionObserver(
      (observedEntries) => {
        setEntries(prev => {
          const newEntries = new Map(prev);
          observedEntries.forEach(entry => {
            newEntries.set(entry.target, entry);
          });
          return newEntries;
        });
      },
      { threshold }
    );

    return () => observer.current?.disconnect();
  }, [threshold]);

  const observe = (element) => {
    if (observer.current && element) {
      observer.current.observe(element);
    }
  };

  const unobserve = (element) => {
    if (observer.current && element) {
      observer.current.unobserve(element);
      setEntries(prev => {
        const newEntries = new Map(prev);
        newEntries.delete(element);
        return newEntries;
      });
    }
  };

  return { entries, observe, unobserve };
}
