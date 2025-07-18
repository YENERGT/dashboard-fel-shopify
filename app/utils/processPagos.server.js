import { processSheetData } from './processData.server.js';

export function processPagosData(rawDataPagos, rawDataVentas, tipo, dia, mes, anio) {
  if (!rawDataPagos || rawDataPagos.length < 2) return null;
  
  const headers = rawDataPagos[0];
  const dataPagos = rawDataPagos.slice(1);
  
  // Obtener total de ingresos del procesamiento de ventas
  const ventasData = processSheetData(rawDataVentas, tipo, dia, mes, anio, false);
  const totalIngresos = ventasData.totalVentas;
  
  // Filtrar pagos según fecha
  const filteredPagos = dataPagos.filter(row => {
    const fechaStr = row[1]; // Columna B: FECHA
    if (!fechaStr) return false;
    
    const fecha = new Date(fechaStr);
    if (isNaN(fecha.getTime())) return false;
    
    switch (tipo) {
      case 'dia':
        return fecha.getDate() === parseInt(dia) &&
               fecha.getMonth() + 1 === parseInt(mes) &&
               fecha.getFullYear() === parseInt(anio);
      case 'mes':
        return fecha.getMonth() + 1 === parseInt(mes) &&
               fecha.getFullYear() === parseInt(anio);
      case 'año':
        return fecha.getFullYear() === parseInt(anio);
      default:
        return true;
    }
  });
  
  // Variables para análisis
  let totalEgresos = 0;
  let gastosPorEmpresa = {};
  let gastosPorCategoria = {};
  let gastosPorDia = {};
  let gastosPorMes = {};
  let detalleGastos = [];
  
  filteredPagos.forEach(row => {
    const empresa = row[0] || 'Sin Empresa'; // NOMBRE EMPRESA
    const fechaStr = row[1]; // FECHA
    const montoStr = row[2]; // MONTO
    const productoJSON = row[3]; // PRODUCTO JSON
    
    // Parsear monto (quitar Q y convertir a número)
    const monto = parseFloat(montoStr?.replace('Q', '').replace(',', '') || 0);
    totalEgresos += monto;
    
    // Procesar por empresa
    gastosPorEmpresa[empresa] = (gastosPorEmpresa[empresa] || 0) + monto;
    
    // Procesar producto/categoría
    try {
      const producto = productoJSON ? JSON.parse(productoJSON) : null;
      if (producto && producto.nombre) {
        const categoria = categorizarGasto(producto.nombre);
        gastosPorCategoria[categoria] = (gastosPorCategoria[categoria] || 0) + monto;
        
        detalleGastos.push({
          empresa,
          fecha: new Date(fechaStr),
          monto,
          producto: producto.nombre,
          categoria
        });
      }
    } catch (e) {
      console.log('Error al parsear producto:', e);
    }
    
    // Análisis temporal
    const fecha = new Date(fechaStr);
    const diaNum = fecha.getDate();
    const mesNum = fecha.getMonth() + 1;
    
    if (tipo === 'año') {
      gastosPorMes[mesNum] = (gastosPorMes[mesNum] || 0) + monto;
    } else if (tipo === 'mes') {
      gastosPorDia[diaNum] = (gastosPorDia[diaNum] || 0) + monto;
    } else if (tipo === 'dia') {
      const hora = fecha.getHours();
      gastosPorDia[hora] = (gastosPorDia[hora] || 0) + monto;
    }
  });
  
  // Calcular profit y métricas
  const profit = totalIngresos - totalEgresos;
  const margenProfit = totalIngresos > 0 ? (profit / totalIngresos) * 100 : 0;
  
  // Top empresas por gasto
  const topEmpresas = Object.entries(gastosPorEmpresa)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([empresa, total]) => ({
      empresa,
      total,
      porcentaje: (total / totalEgresos) * 100
    }));
  
  // Categorías ordenadas
  const categoriasOrdenadas = Object.entries(gastosPorCategoria)
    .sort((a, b) => b[1] - a[1])
    .map(([categoria, total]) => ({
      categoria,
      total,
      porcentaje: (total / totalEgresos) * 100
    }));
  
  // Calcular tendencia
  const tendenciaGastos = calcularTendenciaGastos(tipo === 'año' ? gastosPorMes : gastosPorDia);
  
  // Métricas adicionales
  const promedioGastoDiario = totalEgresos / Math.max(Object.keys(gastosPorDia).length, 1);
  const ratioGastosIngresos = totalIngresos > 0 ? (totalEgresos / totalIngresos) * 100 : 0;
  
  return {
    // Métricas principales
    totalIngresos,
    totalEgresos,
    profit,
    margenProfit,
    
    // Análisis de gastos
    topEmpresas,
    categoriasOrdenadas,
    gastosPorDia: tipo === 'año' ? gastosPorMes : gastosPorDia,
    
    // Métricas adicionales
    totalPagos: filteredPagos.length,
    promedioGastoDiario,
    ratioGastosIngresos,
    tendenciaGastos,
    
    // Detalles
    detalleGastos: detalleGastos.sort((a, b) => b.fecha - a.fecha).slice(0, 50),
    
    // Datos para gráficas de comparación
    ventasDiarias: ventasData.ventasDiarias,
    tipoVisualizacion: tipo
  };
}

// Función para categorizar gastos
function categorizarGasto(nombreProducto) {
  const nombre = nombreProducto.toLowerCase();
  
  const categorias = {
    'Marketing': ['advertising', 'marketing', 'ads', 'publicidad', 'promoción', 'campaña'],
    'Tecnología': ['software', 'hosting', 'servidor', 'dominio', 'app', 'licencia', 'suscripción'],
    'Personal': ['salario', 'nómina', 'sueldo', 'empleado', 'prestación', 'bonus'],
    'Oficina': ['renta', 'alquiler', 'luz', 'agua', 'internet', 'teléfono', 'mantenimiento'],
    'Inventario': ['compra', 'producto', 'mercadería', 'stock', 'inventario', 'proveedor'],
    'Transporte': ['envío', 'shipping', 'combustible', 'gasolina', 'transporte', 'flete'],
    'Impuestos': ['impuesto', 'tax', 'sat', 'iva', 'isr', 'fiscal'],
    'Servicios Profesionales': ['consultoría', 'asesoría', 'legal', 'contabilidad', 'abogado'],
    'Otros': []
  };
  
  for (const [categoria, palabrasClave] of Object.entries(categorias)) {
    for (const palabra of palabrasClave) {
      if (nombre.includes(palabra)) {
        return categoria;
      }
    }
  }
  
  return 'Otros';
}

// Función para calcular tendencia de gastos
function calcularTendenciaGastos(gastosPorPeriodo) {
  const periodos = Object.keys(gastosPorPeriodo).map(Number).sort((a, b) => a - b);
  if (periodos.length < 2) return 'neutral';
  
  const mitad = Math.floor(periodos.length / 2);
  const primeraMitad = periodos.slice(0, mitad).reduce((sum, periodo) => sum + gastosPorPeriodo[periodo], 0);
  const segundaMitad = periodos.slice(mitad).reduce((sum, periodo) => sum + gastosPorPeriodo[periodo], 0);
  
  const diferencia = ((segundaMitad - primeraMitad) / primeraMitad) * 100;
  
  if (diferencia > 10) return 'up';
  if (diferencia < -10) return 'down';
  return 'neutral';
}