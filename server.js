import { createRequestHandler } from "@remix-run/express";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import compression from "compression";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

// Trust proxy para Cloud Run
app.set('trust proxy', true);

// Compresión optimizada para producción
if (process.env.NODE_ENV === 'production') {
  app.use(compression({
    filter: (req, res) => {
      if (req.headers['x-no-compression']) return false;
      return compression.filter(req, res);
    },
    level: 6,
    threshold: 1024,
  }));
}

// Headers de seguridad y performance
app.use((req, res, next) => {
  // Security headers
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Performance headers
  res.setHeader('X-DNS-Prefetch-Control', 'on');
  
  next();
});

// Cache optimizado para assets estáticos
app.use("/assets", express.static(path.join(__dirname, "build/client/assets"), {
  maxAge: process.env.NODE_ENV === 'production' ? '1y' : '1h',
  etag: true,
  lastModified: true,
  setHeaders: (res, path) => {
    // Assets con hash pueden cachearse indefinidamente
    if (/\-[a-f0-9]{8,}\./i.test(path)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
  }
}));

// Cache para archivos públicos
app.use(express.static(path.join(__dirname, "public"), {
  maxAge: process.env.NODE_ENV === 'production' ? '1d' : '1h',
  etag: true
}));

// Cache para build client
app.use(express.static(path.join(__dirname, "build/client"), {
  maxAge: process.env.NODE_ENV === 'production' ? '1d' : '1h',
  etag: true
}));

// Manejar todas las peticiones con Remix
app.all("*", createRequestHandler({
  build: () => import("./build/server/index.js"),
  mode: process.env.NODE_ENV || "production",
  getLoadContext: () => ({
    // Contexto adicional para loaders
    startTime: Date.now()
  })
}));

const port = process.env.PORT || 8080;

app.listen(port, "0.0.0.0", () => {
  console.log(`🚀 Server optimizado ejecutándose en http://0.0.0.0:${port}`);
  console.log(`📊 Modo: ${process.env.NODE_ENV || "production"}`);
  console.log(`⚡ Compresión: ${process.env.NODE_ENV === 'production' ? 'Habilitada' : 'Deshabilitada'}`);
});