import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";
import tokensStyles from "./styles/tokens.css?url";

// CSS crítico inline para carga inmediata
const criticalCSS = `
/* CSS Crítico Inline - Usando Design Tokens */
@import url('/styles/tokens.css');

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
  font-family: var(--font-family-primary); 
  background-color: var(--color-bg-primary); 
  color: var(--color-text-primary); 
  line-height: var(--line-height-normal); 
  transition: background-color var(--transition-base);
}

.polaris-app-provider { height: 100vh; }
.polaris-frame { display: flex; height: 100vh; }
.polaris-frame__main { 
  flex: 1; 
  padding: var(--space-4); 
  background: var(--color-bg-primary);
}
.polaris-card, .dashboard-card { 
  background: var(--dashboard-card-bg); 
  border: var(--border-width-thin) solid var(--dashboard-card-border); 
  border-radius: var(--dashboard-card-radius); 
  padding: var(--dashboard-card-padding); 
  margin-bottom: var(--space-4);
  box-shadow: var(--dashboard-card-shadow);
  transition: box-shadow var(--transition-base);
}
.polaris-card:hover, .dashboard-card:hover {
  box-shadow: var(--shadow-md);
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
.skeleton-card { height: 200px; border-radius: var(--p-border-radius-base); margin-bottom: var(--p-space-4); }
`;

export const links = () => [
  // Tokens CSS - carga inmediata
  { rel: "stylesheet", href: tokensStyles },
  // Preload crítico
  { rel: "preload", href: polarisStyles, as: "style" },
  // CSS no crítico con lazy loading
  { 
    rel: "stylesheet", 
    href: polarisStyles,
    media: "print",
    onLoad: "this.media='all'"
  }
];

export default function App() {
  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        
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

{/* Preload recursos críticos */}
<link rel="modulepreload" href="/build/entry.client.js" />
<link rel="preload" href="/build/root.js" as="script" />

{/* Resource hints para navegación */}
<link rel="prefetch" href="/app/dashboard" />
<link rel="prefetch" href="/app/analisis-financiero" />
      </head>
      <body>
        <Outlet />
        <ScrollRestoration />
        <Scripts />
        
        {/* Script para cargar CSS no crítico después */}
        <script dangerouslySetInnerHTML={{
          __html: `
            // Cargar CSS completo después de load
            window.addEventListener('load', function() {
              const links = document.querySelectorAll('link[media="print"]');
              links.forEach(link => link.media = 'all');
            });
          `
        }} />
      </body>
    </html>
  );
}