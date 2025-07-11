FROM node:18-alpine

WORKDIR /app

# Instalar OpenSSL para Prisma
RUN apk add --no-cache openssl

# Copiar archivos de configuración
COPY package*.json ./
COPY remix.config.js ./
COPY prisma ./prisma/

# Instalar dependencias
RUN npm ci --production=false

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