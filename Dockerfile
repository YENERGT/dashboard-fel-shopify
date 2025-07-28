FROM node:18-slim
 
WORKDIR /app

# Instalar dependencias del sistema para PhantomJS y Prisma
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      openssl \
      libfontconfig1 \
      libfreetype6 \
      bzip2 && \
    rm -rf /var/lib/apt/lists/*

# Copiar archivos de configuración
COPY package*.json ./
COPY remix.config.js ./
COPY prisma ./prisma/

# Instalar dependencias
RUN npm install --legacy-peer-deps

# Copiar el resto de la aplicación
COPY . .

# Generar Prisma Client
RUN npx prisma generate

# Construir la aplicación
RUN npm run build

# Crear la base de datos SQLite
RUN npx prisma migrate deploy

# Variables de entorno para producción
ENV NODE_ENV=production
ENV PORT=8080
ENV DATABASE_URL="file:./prisma/dev.sqlite"

# Exponer puerto
EXPOSE 8080

# Comando para iniciar
CMD ["node", "server.js"]
