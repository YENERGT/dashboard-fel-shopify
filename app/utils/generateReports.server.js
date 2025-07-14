import { getGoogleSheetsData, getGoogleSheetsPagos } from './googleSheets.server';
import { processSheetData } from './processData.server';
import { processPagosData } from './processPagos.server';

export async function generateHTMLReport(options) {
  const { tipo, dia, mes, anio, reportesFEL, reportesFinanciero, incluirComparacion } = options;
  
  let htmlContent = '';
  let dataFEL = null;
  let dataFinanciero = null;
  
  // Obtener datos según los reportes seleccionados
  if (reportesFEL) {
    const rawData = await getGoogleSheetsData();
    dataFEL = processSheetData(rawData, tipo, dia, mes, anio, incluirComparacion);
  }
  
  if (reportesFinanciero) {
    const [rawDataVentas, rawDataPagos] = await Promise.all([
      getGoogleSheetsData(),
      getGoogleSheetsPagos()
    ]);
    dataFinanciero = processPagosData(rawDataPagos, rawDataVentas, tipo, dia, mes, anio);
  }
  
  // Generar HTML
  htmlContent = generateHTMLTemplate({
    tipo,
    dia,
    mes,
    anio,
    dataFEL,
    dataFinanciero,
    incluirComparacion
  });
  
  return {
    html: htmlContent,
    dataFEL,
    dataFinanciero
  };
}

function generateHTMLTemplate(params) {
  const { tipo, dia, mes, anio, dataFEL, dataFinanciero, incluirComparacion } = params;
  
  const getMonthName = (month) => {
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                   'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return months[parseInt(month) - 1] || '';
  };
  
  const formatNumber = (num) => {
    return num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };
  
  const getPeriodText = () => {
    if (tipo === "dia") {
      return `Día ${dia} de ${getMonthName(mes)} ${anio}`;
    } else if (tipo === "mes") {
      return `${getMonthName(mes)} ${anio}`;
    } else if (tipo === "año") {
      return `Año ${anio}`;
    }
    return "Reporte General";
  };
  
  let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Reporte - ${getPeriodText()}</title>
  <style>
    /* Estilos del template original */
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
      background-color: #f4f5f7;
      color: #333333;
    }
    
    .email-wrapper {
      width: 100%;
      background-color: #f4f5f7;
      padding: 40px 0;
    }
    
    .email-container {
      max-width: 800px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    }
    
    .email-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 40px 30px;
      text-align: center;
      color: #ffffff;
    }
    
    .email-header h1 {
      margin: 0;
      font-size: 32px;
      font-weight: 700;
      letter-spacing: -0.5px;
    }
    
    .report-period {
      display: inline-block;
      margin-top: 15px;
      padding: 8px 20px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 25px;
      font-size: 16px;
      font-weight: 600;
    }
    
    .metrics-summary {
      padding: 40px 30px;
      background: #f8f9fa;
    }
    
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
      margin-bottom: 30px;
    }
    
    .metric-box {
      background: #ffffff;
      padding: 25px;
      border-radius: 10px;
      text-align: center;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
      border: 1px solid #e9ecef;
    }
    
    .metric-box h3 {
      margin: 0 0 10px 0;
      font-size: 14px;
      color: #6c757d;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-weight: 600;
    }
    
    .metric-value {
      font-size: 28px;
      font-weight: 700;
      color: #333333;
      margin: 0;
    }
    
    .metric-change {
      font-size: 14px;
      margin-top: 5px;
    }
    
    .metric-change.positive {
      color: #28a745;
    }
    
    .metric-change.negative {
      color: #dc3545;
    }
    
    .content-section {
      padding: 30px;
      border-bottom: 1px solid #e9ecef;
    }
    
    .section-title {
      font-size: 20px;
      font-weight: 600;
      margin: 0 0 20px 0;
      color: #333333;
    }
    
    .data-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 15px;
    }
    
    .data-table th {
      background: #f8f9fa;
      padding: 12px 15px;
      text-align: left;
      font-weight: 600;
      color: #495057;
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 2px solid #dee2e6;
    }
    
    .data-table td {
      padding: 12px 15px;
      border-bottom: 1px solid #e9ecef;
      color: #333333;
      font-size: 15px;
    }
    
    .highlight-box {
      background: #e3f2fd;
      border-left: 4px solid #2196f3;
      padding: 15px 20px;
      margin: 20px 0;
      border-radius: 4px;
    }
    
    .footer {
      background: #f8f9fa;
      padding: 30px;
      text-align: center;
      color: #6c757d;
      font-size: 14px;
    }
    
    @media only screen and (max-width: 600px) {
      .metrics-grid {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="email-container">
      <!-- Header -->
      <div class="email-header">
        <h1>Reporte Integral</h1>
        <div class="report-period">
          📅 ${getPeriodText()}
        </div>
      </div>`;
  
  // Agregar contenido de Dashboard FEL si está seleccionado
  if (dataFEL) {
    html += `
      <!-- Dashboard FEL -->
      <div class="metrics-summary">
        <h2 style="margin-bottom: 20px;">📊 Dashboard FEL - Análisis de Ventas</h2>
        <div class="metrics-grid">
          <div class="metric-box">
            <h3>💰 Total Ventas</h3>
            <p class="metric-value">Q ${formatNumber(dataFEL.totalVentas)}</p>
            ${incluirComparacion && dataFEL.comparacion ? `
              <p class="metric-change ${dataFEL.comparacion.totalVentas.cambio >= 0 ? 'positive' : 'negative'}">
                ${dataFEL.comparacion.totalVentas.cambio >= 0 ? '↑' : '↓'} 
                ${Math.abs(dataFEL.comparacion.totalVentas.cambio).toFixed(1)}%
              </p>
            ` : ''}
          </div>
          <div class="metric-box">
            <h3>📦 Total Pedidos</h3>
            <p class="metric-value">${dataFEL.totalPedidos}</p>
            ${incluirComparacion && dataFEL.comparacion ? `
              <p class="metric-change ${dataFEL.comparacion.totalPedidos.cambio >= 0 ? 'positive' : 'negative'}">
                ${dataFEL.comparacion.totalPedidos.cambio >= 0 ? '↑' : '↓'} 
                ${Math.abs(dataFEL.comparacion.totalPedidos.cambio).toFixed(1)}%
              </p>
            ` : ''}
          </div>
          <div class="metric-box">
            <h3>💵 Ventas Netas</h3>
            <p class="metric-value">Q ${formatNumber(dataFEL.ventasNetas)}</p>
          </div>
          <div class="metric-box">
            <h3>📊 Promedio/Pedido</h3>
            <p class="metric-value">Q ${formatNumber(dataFEL.promedioPorPedido)}</p>
          </div>
        </div>
      </div>
      
      <!-- Top Clientes -->
      <div class="content-section">
        <h2 class="section-title">🏆 Top 10 Clientes</h2>
        <table class="data-table">
          <thead>
            <tr>
              <th>Cliente</th>
              <th style="text-align: right;">Total</th>
              <th style="text-align: right;">Pedidos</th>
            </tr>
          </thead>
          <tbody>
            ${dataFEL.topClientes.slice(0, 10).map(cliente => `
              <tr>
                <td>${cliente.nombre}</td>
                <td style="text-align: right;">Q ${formatNumber(cliente.total)}</td>
                <td style="text-align: right;">${cliente.pedidos}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>`;
  }
  
  // Agregar contenido de Análisis Financiero si está seleccionado
  if (dataFinanciero) {
    html += `
      <!-- Análisis Financiero -->
      <div class="metrics-summary" style="${dataFEL ? 'border-top: 2px solid #dee2e6;' : ''}">
        <h2 style="margin-bottom: 20px;">💰 Análisis Financiero</h2>
        <div class="metrics-grid">
          <div class="metric-box">
            <h3>💵 Total Ingresos</h3>
            <p class="metric-value">Q ${formatNumber(dataFinanciero.totalIngresos)}</p>
          </div>
          <div class="metric-box">
            <h3>💸 Total Egresos</h3>
            <p class="metric-value">Q ${formatNumber(dataFinanciero.totalEgresos)}</p>
          </div>
          <div class="metric-box">
            <h3>📊 Profit</h3>
            <p class="metric-value" style="color: ${dataFinanciero.profit >= 0 ? '#28a745' : '#dc3545'}">
              Q ${formatNumber(dataFinanciero.profit)}
            </p>
          </div>
          <div class="metric-box">
            <h3>📈 Margen</h3>
            <p class="metric-value">${dataFinanciero.margenProfit.toFixed(1)}%</p>
          </div>
        </div>
        
        ${dataFinanciero.profit >= 0 ? `
          <div class="highlight-box" style="background: #d4edda; border-color: #28a745;">
            <p style="margin: 0; color: #155724;">
              ✅ La empresa está generando profit de Q ${formatNumber(dataFinanciero.profit)} 
              (${dataFinanciero.margenProfit.toFixed(1)}% de margen)
            </p>
          </div>
        ` : `
          <div class="highlight-box" style="background: #f8d7da; border-color: #dc3545;">
            <p style="margin: 0; color: #721c24;">
              ⚠️ La empresa tiene pérdidas de Q ${formatNumber(Math.abs(dataFinanciero.profit))}
            </p>
          </div>
        `}
      </div>
      
      <!-- Gastos por Categoría -->
      ${dataFinanciero.categoriasOrdenadas && dataFinanciero.categoriasOrdenadas.length > 0 ? `
        <div class="content-section">
          <h2 class="section-title">📊 Gastos por Categoría</h2>
          <table class="data-table">
            <thead>
              <tr>
                <th>Categoría</th>
                <th style="text-align: right;">Total</th>
                <th style="text-align: right;">%</th>
              </tr>
            </thead>
            <tbody>
              ${dataFinanciero.categoriasOrdenadas.map(cat => `
                <tr>
                  <td>${cat.categoria}</td>
                  <td style="text-align: right;">Q ${formatNumber(cat.total)}</td>
                  <td style="text-align: right;">${cat.porcentaje.toFixed(1)}%</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      ` : ''}`;
  }
  
  // Footer
  html += `
      <div class="footer">
        <p>
          Este reporte fue generado automáticamente<br>
          ${new Date().toLocaleString('es-GT', { timeZone: 'America/Guatemala' })}
        </p>
        <p style="margin-top: 20px; font-size: 12px; color: #868e96;">
          © 2025 Dashboard FEL - Todos los derechos reservados
        </p>
      </div>
    </div>
  </div>
</body>
</html>`;
  
  return html;
}

export function generateWhatsAppMessage(data, tipo, dia, mes, anio) {
  const getMonthName = (month) => {
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                   'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return months[parseInt(month) - 1] || '';
  };
  
  const formatNumber = (num) => {
    return num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };
  
  let period = '';
  if (tipo === "dia") {
    period = `${dia}/${mes}/${anio}`;
  } else if (tipo === "mes") {
    period = `${getMonthName(mes)} ${anio}`;
  } else {
    period = `Año ${anio}`;
  }
  
  let message = `📊 *REPORTE DASHBOARD FEL*\n`;
  message += `📅 Período: ${period}\n\n`;
  
  if (data.dataFEL) {
    message += `*ANÁLISIS DE VENTAS*\n`;
    message += `💰 Total Ventas: Q ${formatNumber(data.dataFEL.totalVentas)}\n`;
    message += `📦 Total Pedidos: ${data.dataFEL.totalPedidos}\n`;
    message += `💵 Ventas Netas: Q ${formatNumber(data.dataFEL.ventasNetas)}\n`;
    message += `📊 Promedio/Pedido: Q ${formatNumber(data.dataFEL.promedioPorPedido)}\n\n`;
    
    message += `*TOP 3 CLIENTES*\n`;
    data.dataFEL.topClientes.slice(0, 3).forEach((cliente, i) => {
      message += `${i + 1}. ${cliente.nombre}: Q ${formatNumber(cliente.total)}\n`;
    });
    message += '\n';
  }
  
  if (data.dataFinanciero) {
    message += `*ANÁLISIS FINANCIERO*\n`;
    message += `💵 Ingresos: Q ${formatNumber(data.dataFinanciero.totalIngresos)}\n`;
    message += `💸 Egresos: Q ${formatNumber(data.dataFinanciero.totalEgresos)}\n`;
    message += `📊 Profit: Q ${formatNumber(data.dataFinanciero.profit)}\n`;
    message += `📈 Margen: ${data.dataFinanciero.margenProfit.toFixed(1)}%\n\n`;
    
    if (data.dataFinanciero.profit >= 0) {
      message += `✅ Estado: PROFIT POSITIVO\n`;
    } else {
      message += `⚠️ Estado: PÉRDIDAS\n`;
    }
  }
  
  message += `\n📱 Para ver el reporte completo con gráficas visite el dashboard.`;
  
  return message;
}