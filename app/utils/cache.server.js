// Cache simple en memoria
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

export function getCachedData(key) {
  const cached = cache.get(key);
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log('Datos obtenidos del caché:', key);
    return cached.data;
  }
  
  return null;
}

export function setCachedData(key, data) {
  cache.set(key, {
    data,
    timestamp: Date.now()
  });
  console.log('Datos guardados en caché:', key);
}

export function clearCache() {
  cache.clear();
  console.log('Caché limpiado');
}

// Limpiar caché automáticamente cada 10 minutos
setInterval(() => {
  for (const [key, value] of cache.entries()) {
    if (Date.now() - value.timestamp > CACHE_DURATION) {
      cache.delete(key);
      console.log('Entrada de caché expirada eliminada:', key);
    }
  }
}, 10 * 60 * 1000);