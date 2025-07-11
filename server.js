import { createRequestHandler } from "@remix-run/express";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

// Trust proxy para Cloud Run
app.set('trust proxy', true);

// Servir archivos estáticos con las rutas correctas
app.use("/assets", express.static(path.join(__dirname, "build/client/assets")));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname, "build/client")));

// Manejar todas las peticiones con Remix
app.all("*", createRequestHandler({
  build: () => import("./build/server/index.js"),
  mode: process.env.NODE_ENV || "production",
}));

const port = process.env.PORT || 8080;

app.listen(port, "0.0.0.0", () => {
  console.log(`Server listening on http://0.0.0.0:${port}`);
});