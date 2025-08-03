import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";
import tokensStyles from "./styles/tokens.css?url";
import dashboardEnhancedStyles from "./styles/dashboard-enhanced.css?url";
import dashboardFinalStyles from "./styles/dashboard-final.css?url";

// CSS crítico inline para carga inmediata
const criticalCSS = `
/* CSS Crítico Inline - Usando Design Tokens */
/* Variables de compatibilidad con Polaris */
:root {
  --p-font-family-sans: var(--font-family-primary);
  --p-color-bg: var(--color-bg-primary);
  --p-color-bg-surface: var(--color-bg-surface);
  --p-color-border: var(--color-border-light);
  --p-color-text: var(--color-text-primary);
  --p-color-text-secondary: var(--color-text-secondary);
  --p-color-primary: var(--color-primary);
  --p-space-1: var(--space-1);
  --p-space-2: var(--space-2);
  --p-space-3: var(--space-3);
  --p-space-4: var(--space-4);
  --p-space-5: var(--space-5);
  --p-border-radius-base: var(--border-radius-base);
}

*, *::before, *::after { box-sizing: border-box; }
body { 
  margin: 0; padding: 0; 
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
  background-color: #fafbfb; 
  color: #202223; 
  line-height: 1.5; 
}

.polaris-app-provider { height: 100vh; }
.polaris-frame { display: flex; height: 100vh; }
.polaris-frame__main { 
  flex: 1; 
  padding: 1rem; 
  background: #fafbfb;
}
.polaris-card, .dashboard-card { 
  background: #ffffff; 
  border: 1px solid #e1e3e5; 
  border-radius: 0.5rem; 
  padding: 1.5rem; 
  margin-bottom: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: box-shadow 0.3s ease;
}
.polaris-card:hover, .dashboard-card:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.skeleton { 
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%); 
  background-size: 200% 100%; 
  animation: loading 1.5s infinite; 
}
@keyframes loading { 
  0% { background-position: 200% 0; } 
  100% { background-position: -200% 0; } 
}
.skeleton-text { height: 1rem; border-radius: 4px; margin-bottom: 0.5rem; }
.skeleton-card { height: 200px; border-radius: 0.5rem; margin-bottom: 1rem; }
`;

export const links = () => [
  // Preload crítico - DNS prefetch
  { rel: "dns-prefetch", href: "//fonts.googleapis.com" },
  { rel: "dns-prefetch", href: "//fonts.gstatic.com" },
  { rel: "dns-prefetch", href: "//sheets.googleapis.com" },
  
  // Preconnect para recursos críticos
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
  
  // CSS crítico primero
  { rel: "stylesheet", href: tokensStyles },
  { rel: "stylesheet", href: dashboardEnhancedStyles },
  
  // CSS no crítico con loading optimizado
  { 
    rel: "preload", 
    href: polarisStyles, 
    as: "style",
    onLoad: "this.onload=null;this.rel='stylesheet'"
  },
  { 
    rel: "preload", 
    href: dashboardFinalStyles, 
    as: "style",
    onLoad: "this.onload=null;this.rel='stylesheet'"
  },
  
  // NProgress con preload
  { 
    rel: "preload", 
    href: "https://unpkg.com/nprogress@0.2.0/nprogress.css",
    as: "style",
    onLoad: "this.onload=null;this.rel='stylesheet'"
  },
  
  // Resource hints para navegación
  { rel: "prefetch", href: "/app/dashboard" },
  { rel: "prefetch", href: "/app/analisis-financiero" },
];

export default function App() {
  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        
        {/* PWA Meta tags */}
        <meta name="theme-color" content="#008060" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <link rel="manifest" href="/manifest.json" />
        
        {/* CSS crítico inline para carga inmediata */}
        <style dangerouslySetInnerHTML={{ __html: criticalCSS }} />
        
        <Meta />
        <Links />

        {/* DNS Prefetch para servicios externos */}
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//fonts.gstatic.com" />
        <link rel="dns-prefetch" href="//sheets.googleapis.com" />

        {/* Preconnect para recursos críticos */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* Resource hints para navegación */}
        <link rel="prefetch" href="/app/dashboard" />
        <link rel="prefetch" href="/app/analisis-financiero" />
      </head>
      <body>
        <Outlet />
        <ScrollRestoration />
        <Scripts />
        
        {/* Service Worker Registration */}
        <script dangerouslySetInnerHTML={{
          __html: `
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js')
                  .then(function(registration) {
                    console.log('SW registered: ', registration);
                  })
                  .catch(function(registrationError) {
                    console.log('SW registration failed: ', registrationError);
                  });
              });
            }
          `
        }} />
        
        {/* Script optimizado para carga progresiva */}
        <script dangerouslySetInnerHTML={{
          __html: `
            // Critical path optimization
            (function() {
              // Preload key resources after DOMContentLoaded
              document.addEventListener('DOMContentLoaded', function() {
                // Load non-critical CSS
                const stylesToLoad = [
                  '${polarisStyles}',
                  '${dashboardFinalStyles}',
                  'https://unpkg.com/nprogress@0.2.0/nprogress.css'
                ];
                
                stylesToLoad.forEach(function(href) {
                  const link = document.createElement('link');
                  link.rel = 'stylesheet';
                  link.href = href;
                  link.media = 'all';
                  document.head.appendChild(link);
                });
              });
              
              // Initialize NProgress early
              if (typeof NProgress !== 'undefined') {
                NProgress.configure({ 
                  showSpinner: false,
                  trickleSpeed: 200,
                  minimum: 0.08
                });
              }
              
              // Performance tracking
              if ('performance' in window) {
                window.addEventListener('load', function() {
                  setTimeout(function() {
                    const perfData = performance.getEntriesByType('navigation')[0];
                    if (perfData && console.debug) {
                      console.debug('Page Load Performance:', {
                        DOM: Math.round(perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart),
                        Load: Math.round(perfData.loadEventEnd - perfData.loadEventStart),
                        Total: Math.round(perfData.loadEventEnd - perfData.fetchStart)
                      });
                    }
                  }, 0);
                });
              }
            })();
          `
        }} />
        {/* NProgress script con loading optimizado */}
        <script 
          src="https://unpkg.com/nprogress@0.2.0/nprogress.js"
          defer
        ></script>
      </body>
    </html>
  );
}