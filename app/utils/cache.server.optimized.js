// Sistema de caché optimizado con compresión y TTL inteligente
import { LRUCache } from 'lru-cache';

class AdvancedMemoryCache {
  constructor() {
    // Cache principal con LRU
    this.cache = new LRUCache({
      max: 500, // máximo 500 entradas
      maxSize: 50 * 1024 * 1024, // 50MB máximo
      sizeCalculation: (value) => {
        return JSON.stringify(value).length;
      },
      ttl: 5 * 60 * 1000, // 5 minutos por defecto
    });
    
    // Cache de metadatos para optimizaciones
    this.metadata = new Map();
    
    // Estadísticas
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      evictions: 0,
    };
  }

  // TTL inteligente basado en el tipo de datos y hora del día
  getTTL(key) {
    const hour = new Date().getHours();
    const isBusinessHours = hour >= 8 && hour <= 18;
    
    const ttlConfig = {
      'dashboard_data': isBusinessHours ? 2 * 60 * 1000 : 10 * 60 * 1000,    // 2min/10min
      'financiero_data': isBusinessHours ? 5 * 60 * 1000 : 15 * 60 * 1000,   // 5min/15min
      'google_sheets_raw': isBusinessHours ? 1 * 60 * 1000 : 5 * 60 * 1000,  // 1min/5min
      'summary_data': 30 * 1000,                                              // 30 segundos
      'reports_data': 30 * 60 * 1000,                                         // 30 minutos
      'charts_data': 5 * 60 * 1000,                                           // 5 minutos
    };

    for (const [prefix, ttl] of Object.entries(ttlConfig)) {
      if (key.startsWith(prefix)) {
        return ttl;
      }
    }
    
    return 5 * 60 * 1000; // 5 minutos por defecto
  }

  // Compresión simple para datos grandes
  compress(data) {
    const jsonString = JSON.stringify(data);
    if (jsonString.length > 10000) { // Solo comprimir datos > 10KB
      try {
        // Compresión básica removiendo espacios y simplificando
        return {
          compressed: true,
          data: JSON.stringify(data, null, 0),
          originalSize: jsonString.length
        };
      } catch (e) {
        return { compressed: false, data };
      }
    }
    return { compressed: false, data };
  }

  decompress(item) {
    if (item.compressed) {
      try {
        return JSON.parse(item.data);
      } catch (e) {
        console.warn('[CACHE] Decompression failed:', e);
        return item.data;
      }
    }
    return item.data;
  }

  set(key, value) {
    const compressed = this.compress(value);
    const ttl = this.getTTL(key);
    
    this.cache.set(key, compressed, { ttl });
    
    // Metadata para analytics
    this.metadata.set(key, {
      setTime: Date.now(),
      accessCount: 0,
      size: compressed.originalSize || JSON.stringify(value).length,
      compressed: compressed.compressed
    });
    
    this.stats.sets++;
    
    console.log(`[CACHE SET] ${key} - TTL: ${ttl}ms - Compressed: ${compressed.compressed}`);
  }

  get(key) {
    const item = this.cache.get(key);
    
    if (!item) {
      this.stats.misses++;
      console.log(`[CACHE MISS] ${key}`);
      return null;
    }

    // Actualizar metadata
    const meta = this.metadata.get(key);
    if (meta) {
      meta.accessCount++;
      meta.lastAccess = Date.now();
    }

    this.stats.hits++;
    console.log(`[CACHE HIT] ${key} - Access count: ${meta?.accessCount || 0}`);
    
    return this.decompress(item);
  }

  delete(key) {
    const deleted = this.cache.delete(key);
    this.metadata.delete(key);
    
    if (deleted) {
      console.log(`[CACHE DELETE] ${key}`);
    }
    
    return deleted;
  }

  clear() {
    this.cache.clear();
    this.metadata.clear();
    console.log('[CACHE CLEARED]');
  }

  // Invalidación inteligente por patrón
  invalidatePattern(pattern) {
    const keys = Array.from(this.cache.keys());
    const keysToDelete = keys.filter(key => key.includes(pattern));
    
    keysToDelete.forEach(key => this.delete(key));
    
    console.log(`[CACHE INVALIDATE] Pattern: ${pattern}, Deleted: ${keysToDelete.length} entries`);
    return keysToDelete.length;
  }

  // Prewarm cache con datos críticos
  async prewarm(criticalDataFetchers) {
    console.log('[CACHE PREWARM] Starting...');
    
    const promises = Object.entries(criticalDataFetchers).map(async ([key, fetcher]) => {
      try {
        if (!this.cache.has(key)) {
          const data = await fetcher();
          this.set(key, data);
          console.log(`[CACHE PREWARM] ${key} loaded`);
        }
      } catch (error) {
        console.warn(`[CACHE PREWARM] Failed to load ${key}:`, error.message);
      }
    });

    await Promise.allSettled(promises);
    console.log('[CACHE PREWARM] Completed');
  }

  // Estadísticas detalladas
  getDetailedStats() {
    const cacheStats = {
      size: this.cache.size,
      calculatedSize: this.cache.calculatedSize,
      maxSize: this.cache.maxSize,
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: this.stats.hits / (this.stats.hits + this.stats.misses) * 100 || 0,
      sets: this.stats.sets,
    };

    // Análisis de metadatos
    const metaAnalysis = Array.from(this.metadata.entries()).reduce((acc, [key, meta]) => {
      const type = key.split('_')[0];
      if (!acc[type]) {
        acc[type] = { count: 0, totalSize: 0, totalAccess: 0, compressed: 0 };
      }
      acc[type].count++;
      acc[type].totalSize += meta.size;
      acc[type].totalAccess += meta.accessCount;
      if (meta.compressed) acc[type].compressed++;
      return acc;
    }, {});

    return { ...cacheStats, types: metaAnalysis };
  }

  // Cleanup automático mejorado
  cleanup() {
    // LRU se encarga automáticamente, pero podemos hacer limpieza de metadata huérfana
    const cacheKeys = new Set(this.cache.keys());
    const metaKeys = Array.from(this.metadata.keys());
    
    const orphanedMeta = metaKeys.filter(key => !cacheKeys.has(key));
    orphanedMeta.forEach(key => this.metadata.delete(key));
    
    if (orphanedMeta.length > 0) {
      console.log(`[CACHE CLEANUP] Removed ${orphanedMeta.length} orphaned metadata entries`);
    }
  }
}

// Instancia singleton del cache optimizado
const optimizedCache = new AdvancedMemoryCache();

// Cleanup automático cada 5 minutos
setInterval(() => {
  optimizedCache.cleanup();
}, 5 * 60 * 1000);

export { optimizedCache };

// API compatible con el cache anterior
export async function getCachedData(key, fetchFunction, options = {}) {
  let data = optimizedCache.get(key);
  
  if (!data) {
    console.log(`[CACHE MISS] ${key} - Fetching fresh data...`);
    data = await fetchFunction();
    optimizedCache.set(key, data);
  }
  
  return data;
}

export function invalidateCache(pattern) {
  return optimizedCache.invalidatePattern(pattern);
}

// Nueva función para cache inteligente con refresh en background
export async function getSmartCachedData(key, fetchFunction, options = {}) {
  const { backgroundRefresh = true, staleTolerance = 0.7 } = options;
  
  let data = optimizedCache.get(key);
  const meta = optimizedCache.metadata.get(key);
  
  if (data && meta && backgroundRefresh) {
    const age = Date.now() - meta.setTime;
    const ttl = optimizedCache.getTTL(key);
    
    // Si los datos están al 70% de su TTL, refrescar en background
    if (age > (ttl * staleTolerance)) {
      // Devolver datos existentes inmediatamente
      setTimeout(async () => {
        try {
          console.log(`[SMART CACHE] Background refresh for ${key}`);
          const freshData = await fetchFunction();
          optimizedCache.set(key, freshData);
        } catch (error) {
          console.warn(`[SMART CACHE] Background refresh failed for ${key}:`, error.message);
        }
      }, 0);
    }
  }
  
  if (!data) {
    console.log(`[SMART CACHE MISS] ${key} - Fetching fresh data...`);
    data = await fetchFunction();
    optimizedCache.set(key, data);
  }
  
  return data;
}

// Función para prewarm de datos críticos
export async function prewarmCriticalData() {
  const hour = new Date().getHours();
  const isBusinessHours = hour >= 8 && hour <= 18;
  
  if (isBusinessHours) {
    // Solo hacer prewarm en horas de negocio para no desperdiciar recursos
    const { getGoogleSheetsData } = await import('./googleSheets.server');
    
    await optimizedCache.prewarm({
      'google_sheets_raw_current': () => getGoogleSheetsData(),
    });
  }
}

// Backward compatibility
export const appCache = optimizedCache;
