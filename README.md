# Dashboard FEL - Aplicación de Shopify

Sistema de análisis de facturas electrónicas integrado con Shopify que visualiza datos desde Google Sheets.

## 🚀 Características

- 📊 Visualización de ventas en tiempo real
- 📈 Gráficos interactivos (Chart.js)
- 🏆 Análisis de top clientes y productos
- 🏙️ Análisis geográfico por ciudades
- 💳 Análisis de métodos de pago
- 📥 Exportación de datos a CSV
- 🔄 Sistema de caché para mejor rendimiento
- 📅 Filtros por día, mes y año

## 📋 Requisitos

- Node.js 18+
- Cuenta de Shopify Partner
- Google Sheets con estructura específica
- Cuenta de servicio de Google Cloud

## 🛠️ Instalación

1. Clonar el repositorio
2. Instalar dependencias: `npm install`
3. Configurar variables de entorno en `.env.local`
4. Ejecutar: `shopify app dev`

## 📊 Estructura de Google Sheets

La hoja "REGISTRO" debe tener las siguientes columnas:
- A: UUID
- B: JSON (datos del pedido)
- C: TOTAL_GENERAL
- D: TOTAL_IVA
- F: NOMBRE_NIT
- J: FECHA
- K: ESTADO
- O: Método de pago

## 🔐 Variables de Entorno

```env
GOOGLE_SHEETS_ID=tu_id_de_google_sheet
GOOGLE_SERVICE_ACCOUNT_EMAIL=tu_email_de_servicio
GOOGLE_PRIVATE_KEY=tu_clave_privada