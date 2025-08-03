// Configuración de headers optimizada para el servidor
export function getOptimizedHeaders() {
  return {
    // Cache headers
    'Cache-Control': 'public, max-age=300, s-maxage=600, stale-while-revalidate=86400',
    
    // Compresión
    'Content-Encoding': 'gzip, br',
    'Vary': 'Accept-Encoding',
    
    // Security headers optimizados
    'X-Frame-Options': 'SAMEORIGIN',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    
    // Performance hints
    'X-DNS-Prefetch-Control': 'on',
    'X-Preload': 'true',
    
    // Connection keep-alive
    'Connection': 'keep-alive',
    'Keep-Alive': 'timeout=5, max=1000'
  };
}

// Server-side rendering optimizations
export function optimizeSSR(request, responseHeaders) {
  const userAgent = request.headers.get('user-agent') || '';
  const isBot = /bot|crawler|spider/i.test(userAgent);
  
  // Diferentes estrategias para bots vs usuarios
  if (isBot) {
    responseHeaders.set('Cache-Control', 'public, max-age=3600, s-maxage=7200');
  } else {
    responseHeaders.set('Cache-Control', 'public, max-age=300, s-maxage=600');
  }
  
  // Preload hints para recursos críticos
  responseHeaders.set('Link', [
    '</assets/app.css>; rel=preload; as=style',
    '</assets/app.js>; rel=preload; as=script',
    '<https://fonts.googleapis.com>; rel=preconnect',
    '<https://sheets.googleapis.com>; rel=dns-prefetch'
  ].join(', '));
  
  return responseHeaders;
}

// Middleware para compresión en Express
export function setupCompression(app) {
  // Solo en producción
  if (process.env.NODE_ENV === 'production') {
    const compression = require('compression');
    
    app.use(compression({
      filter: (req, res) => {
        if (req.headers['x-no-compression']) return false;
        return compression.filter(req, res);
      },
      level: 6, // Balance entre velocidad y compresión
      threshold: 1024, // Solo comprimir archivos > 1KB
    }));
  }
}

// Headers para archivos estáticos
export function getStaticAssetHeaders(filePath) {
  const isImmutable = /\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2)$/.test(filePath);
  const isVersioned = /\-[a-f0-9]{8,}\./i.test(filePath);
  
  if (isVersioned) {
    // Archivos con hash pueden cachearse indefinidamente
    return {
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Expires': new Date(Date.now() + 31536000 * 1000).toUTCString()
    };
  }
  
  if (isImmutable) {
    // Otros assets estáticos
    return {
      'Cache-Control': 'public, max-age=86400',
      'Expires': new Date(Date.now() + 86400 * 1000).toUTCString()
    };
  }
  
  // HTML y otros archivos dinámicos
  return {
    'Cache-Control': 'public, max-age=300, s-maxage=600'
  };
}
