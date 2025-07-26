// Sistema de caché en memoria para datos de Google Sheets
class MemoryCache {
  constructor() {
    this.cache = new Map();
    this.timestamps = new Map();
    this.defaultTTL = 5 * 60 * 1000; // 5 minutos por defecto
  }

  // Configurar TTL personalizado por tipo de datos
  getTTL(key) {
    const ttlConfig = {
      'dashboard_data': 3 * 60 * 1000,        // 3 min - datos dashboard
      'financiero_data': 10 * 60 * 1000,      // 10 min - datos financieros
      'google_sheets_raw': 2 * 60 * 1000,     // 2 min - datos raw de sheets
      'summary_data': 1 * 60 * 1000,          // 1 min - resúmenes
      'reports_data': 15 * 60 * 1000,         // 15 min - reportes generados
    };

    for (const [prefix, ttl] of Object.entries(ttlConfig)) {
      if (key.startsWith(prefix)) {
        return ttl;
      }
    }
    
    return this.defaultTTL;
  }

  set(key, value) {
    this.cache.set(key, value);
    this.timestamps.set(key, Date.now());
    
    // Log para debugging
    console.log(`[CACHE SET] ${key} - TTL: ${this.getTTL(key)}ms`);
  }

  get(key) {
    const value = this.cache.get(key);
    const timestamp = this.timestamps.get(key);
    
    if (!value || !timestamp) {
      return null;
    }

    const ttl = this.getTTL(key);
    const age = Date.now() - timestamp;
    
    if (age > ttl) {
      // Cache expirado
      this.delete(key);
      console.log(`[CACHE EXPIRED] ${key} - Age: ${age}ms`);
      return null;
    }
    
    console.log(`[CACHE HIT] ${key} - Age: ${age}ms`);
    return value;
  }

  delete(key) {
    this.cache.delete(key);
    this.timestamps.delete(key);
    console.log(`[CACHE DELETE] ${key}`);
  }

  clear() {
    this.cache.clear();
    this.timestamps.clear();
    console.log('[CACHE CLEARED]');
  }

  // Limpiar cache expirado automáticamente
  cleanup() {
    const now = Date.now();
    const keysToDelete = [];

    for (const [key, timestamp] of this.timestamps.entries()) {
      const ttl = this.getTTL(key);
      if (now - timestamp > ttl) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.delete(key));
    
    if (keysToDelete.length > 0) {
      console.log(`[CACHE CLEANUP] Removed ${keysToDelete.length} expired entries`);
    }
  }

  // Estadísticas del cache
  getStats() {
    this.cleanup(); // Limpiar antes de obtener stats
    
    return {
      entries: this.cache.size,
      types: Array.from(this.cache.keys()).reduce((acc, key) => {
        const type = key.split('_')[0];
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {}),
      oldestEntry: Math.min(...Array.from(this.timestamps.values())),
      totalMemory: JSON.stringify(Array.from(this.cache.values())).length
    };
  }
}

// Instancia singleton del cache
const appCache = new MemoryCache();

// Limpiar cache cada 2 minutos
setInterval(() => {
  appCache.cleanup();
}, 2 * 60 * 1000);

export { appCache };

// Funciones helper para usar en los loaders
export async function getCachedData(key, fetchFunction) {
  let data = appCache.get(key);
  
  if (!data) {
    console.log(`[CACHE MISS] ${key} - Fetching fresh data...`);
    data = await fetchFunction();
    appCache.set(key, data);
  }
  
  return data;
}

export function invalidateCache(pattern) {
  const keys = Array.from(appCache.cache.keys());
  const keysToDelete = keys.filter(key => key.includes(pattern));
  
  keysToDelete.forEach(key => appCache.delete(key));
  
  console.log(`[CACHE INVALIDATE] Pattern: ${pattern}, Deleted: ${keysToDelete.length} entries`);
}
