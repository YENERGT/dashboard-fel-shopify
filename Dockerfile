FROM node:18-slim
 
WORKDIR /app

# Instalar dependencias del sistema para Puppeteer (Chrome) y Prisma
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      ca-certificates \
      fonts-liberation \
      libappindicator3-1 \
      libasound2 \
      libatk1.0-0 \
      libatk-bridge2.0-0 \
      libc6 \
      libcairo2 \
      libdrm2 \
      libexpat1 \
      libfontconfig1 \
      libgbm1 \
      libgcc1 \
      libgconf-2-4 \
      libgdk-pixbuf2.0-0 \
      libglib2.0-0 \
      libgtk-3-0 \
      libkrb5-3 \
      libnspr4 \
      libnss3 \
      libpango-1.0-0 \
      libstdc++6 \
      libx11-6 \
      libx11-xcb1 \
      libxcb1 \
      libxcomposite1 \
      libxcursor1 \
      libxdamage1 \
      libxext6 \
      libxfixes3 \
      libxi6 \
      libxrandr2 \
      libxrender1 \
      libxss1 \
      libxtst6 \
      wget && \
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
