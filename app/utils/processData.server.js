import { parseUniversalDate, validarFechaEnRango } from './dateUtils.server.js';

export function processSheetData(rawData, tipo, dia, mes, anio, incluirComparacion = true) {
  if (!rawData || rawData.length < 2) return null;

  
  const headers = rawData[0];
  const data = rawData.slice(1);
  
// Filtrar datos según fecha - NUEVA IMPLEMENTACIÓN
  const filteredData = data.filter(row => {
    const fechaStr = row[9]; // Columna J: FECHA
    if (!fechaStr) return false;
    
    // Usar la nueva función universal de parseo de fechas
    const fecha = parseUniversalDate(fechaStr);
    if (!fecha) return false;
    
    // Usar la nueva función de validación de rango
    return validarFechaEnRango(fecha, tipo, dia, mes, anio);
  });

  // Determinar fechas para período anterior
let filteredDataAnterior = [];

if (incluirComparacion) {
  const fechaActual = new Date(parseInt(anio), parseInt(mes) - 1, parseInt(dia) || 1);
  
  switch (tipo) {
    // REEMPLAZAR las 3 secciones del switch con esto:

    case 'dia':
      // Día anterior
      const fechaAnterior = new Date(fechaActual);
      fechaAnterior.setDate(fechaActual.getDate() - 1);
      
      filteredDataAnterior = data.filter(row => {
        const fechaStr = row[9];
        if (!fechaStr) return false;
        const fecha = parseUniversalDate(fechaStr); // NUEVA FUNCIÓN
        if (!fecha) return false;
        return fecha.getDate() === fechaAnterior.getDate() &&
               fecha.getMonth() === fechaAnterior.getMonth() &&
               fecha.getFullYear() === fechaAnterior.getFullYear();
      });
      break;
      
    case 'mes':
      // Mes anterior
      const fechaMesAnterior = new Date(fechaActual);
      fechaMesAnterior.setMonth(fechaActual.getMonth() - 1);
      
      filteredDataAnterior = data.filter(row => {
        const fechaStr = row[9];
        if (!fechaStr) return false;
        const fecha = parseUniversalDate(fechaStr); // NUEVA FUNCIÓN
        if (!fecha) return false;
        return fecha.getMonth() === fechaMesAnterior.getMonth() &&
               fecha.getFullYear() === fechaMesAnterior.getFullYear();
      });
      break;
      
    case 'año':
      // Año anterior
      const anioAnterior = parseInt(anio) - 1;
      
      filteredDataAnterior = data.filter(row => {
        const fechaStr = row[9];
        if (!fechaStr) return false;
        const fecha = parseUniversalDate(fechaStr); // NUEVA FUNCIÓN
        if (!fecha) return false;
        return fecha.getFullYear() === anioAnterior;
      });
      break;
  }
}
  
  // Variables para análisis
  let totalVentas = 0;
  let totalIVA = 0;
  let ventasDiarias = {};
  let ventasPorHora = {};
  let ventasPorMes = {};
  let clientesMap = {};
  let productosMap = {};
  let marcasMap = {};
  let ciudadesMap = {};
  let departamentosMap = {};
  let metodosPagoMap = {};
  let zonasCiudadMap = {};
  let estadosPedidos = { paid: 0, pending: 0, cancelled: 0 };
  let nitTransacciones = {};
  let categoriasProductos = {};
  let ventasPorSemana = {};
  let totalVentasAnterior = 0;
  let totalIVAAnterior = 0;
  let ventasDiariasAnterior = {};
  let totalPedidosAnterior = 0;
  
  filteredData.forEach(row => {
    const venta = parseFloat(row[2]) || 0; // TOTAL_GENERAL
    const iva = parseFloat(row[3]) || 0; // TOTAL_IVA
    
    totalVentas += venta;
    totalIVA += iva;
    
    const fecha = parseUniversalDate(row[9]);
const diaNum = fecha.getDate();
const hora = fecha.getHours();
const mesNum = fecha.getMonth() + 1;
const semana = getWeekNumber(fecha);

// Lógica según tipo de visualización
if (tipo === 'dia') {
  // Si es vista por día, guardamos ventas por hora
  ventasDiarias[hora] = (ventasDiarias[hora] || 0) + venta;
} else if (tipo === 'mes') {
  // Si es vista por mes, guardamos ventas por día
  ventasDiarias[diaNum] = (ventasDiarias[diaNum] || 0) + venta;
} else if (tipo === 'año') {
  // Si es vista por año, guardamos ventas por mes
  ventasDiarias[mesNum] = (ventasDiarias[mesNum] || 0) + venta;
}

// Mantener estos para otros gráficos
ventasPorHora[hora] = (ventasPorHora[hora] || 0) + venta;
ventasPorMes[mesNum] = (ventasPorMes[mesNum] || 0) + venta;
ventasPorSemana[semana] = (ventasPorSemana[semana] || 0) + venta;
    
    // Clientes
    const cliente = row[5]; // NOMBRE_NIT
    if (cliente) {
      clientesMap[cliente] = (clientesMap[cliente] || { total: 0, pedidos: 0 });
      clientesMap[cliente].total += venta;
      clientesMap[cliente].pedidos += 1;
    }
    
    // Estados de pedidos
    const estado = row[10] || 'pending'; // ESTADO
    estadosPedidos[estado] = (estadosPedidos[estado] || 0) + 1;
    
    // NITs
    const nit = row[4];
    if (nit) {
      nitTransacciones[nit] = (nitTransacciones[nit] || 0) + 1;
    }
    
    // Métodos de pago
    const metodoPago = row[14]; // Columna O
    if (metodoPago) {
      const metodoLimpio = normalizarMetodoPago(metodoPago);
      metodosPagoMap[metodoLimpio] = (metodosPagoMap[metodoLimpio] || { cantidad: 0, total: 0 });
      metodosPagoMap[metodoLimpio].cantidad += 1;
      metodosPagoMap[metodoLimpio].total += venta;
    }
    
    // Procesar JSON de la columna B
    try {
      const jsonData = row[1] ? JSON.parse(row[1]) : null;
      if (jsonData) {
        // Direcciones
        if (jsonData.to && jsonData.to.address) {
          const direccion = jsonData.to.address;
          const ciudad = direccion.city || 'Sin Ciudad';
          const departamento = direccion.state || 'Sin Departamento';
          const zona = direccion.street ? extraerZona(direccion.street) : 'Sin Zona';
          
          ciudadesMap[ciudad] = (ciudadesMap[ciudad] || { cantidad: 0, total: 0 });
          ciudadesMap[ciudad].cantidad += 1;
          ciudadesMap[ciudad].total += venta;
          
          departamentosMap[departamento] = (departamentosMap[departamento] || { cantidad: 0, total: 0 });
          departamentosMap[departamento].cantidad += 1;
          departamentosMap[departamento].total += venta;
          
          if (ciudad === 'Guatemala' && zona !== 'Sin Zona') {
            zonasCiudadMap[zona] = (zonasCiudadMap[zona] || { cantidad: 0, total: 0 });
            zonasCiudadMap[zona].cantidad += 1;
            zonasCiudadMap[zona].total += venta;
          }
        }
        
        // Productos
        if (jsonData.items && Array.isArray(jsonData.items)) {
          jsonData.items.forEach(item => {
            const nombreProducto = item.description || 'Producto sin nombre';
            const cantidad = item.qty || 1;
            const precio = item.price || 0;
            const totalItem = precio * cantidad;
            
            productosMap[nombreProducto] = (productosMap[nombreProducto] || { cantidad: 0, total: 0 });
            productosMap[nombreProducto].cantidad += cantidad;
            productosMap[nombreProducto].total += totalItem;
            
            // Categorizar producto
            const categoria = categorizarProductoMejorado(nombreProducto);
            categoriasProductos[categoria] = (categoriasProductos[categoria] || 0) + totalItem;
            
            // Detectar marca
            const marca = detectarMarcaAuto(nombreProducto);
            if (marca !== 'Otras') {
              marcasMap[marca] = (marcasMap[marca] || { cantidad: 0, total: 0 });
              marcasMap[marca].cantidad += cantidad;
              marcasMap[marca].total += totalItem;
            }
          });
        }
      }
    } catch (e) {
      console.log('Error al procesar JSON:', e);
    }
  });

  // Procesar datos del período anterior
if (incluirComparacion && filteredDataAnterior.length > 0) {
  filteredDataAnterior.forEach(row => {
    const venta = parseFloat(row[2]) || 0;
    const iva = parseFloat(row[3]) || 0;
    
    totalVentasAnterior += venta;
    totalIVAAnterior += iva;
    totalPedidosAnterior += 1;
    
    const fecha = parseUniversalDate(row[9]);
    const diaNum = fecha.getDate();
    const hora = fecha.getHours();
    const mesNum = fecha.getMonth() + 1;
    
    if (tipo === 'dia') {
      ventasDiariasAnterior[hora] = (ventasDiariasAnterior[hora] || 0) + venta;
    } else if (tipo === 'mes') {
      ventasDiariasAnterior[diaNum] = (ventasDiariasAnterior[diaNum] || 0) + venta;
    } else if (tipo === 'año') {
      ventasDiariasAnterior[mesNum] = (ventasDiariasAnterior[mesNum] || 0) + venta;
    }
  });
}

// Calcular porcentajes de cambio
const calcularPorcentajeCambio = (actual, anterior) => {
  if (anterior === 0) return actual > 0 ? 100 : 0;
  return ((actual - anterior) / anterior) * 100;
};
  
  // Análisis adicionales
  const diasConVentas = Object.keys(ventasDiarias).length;
  const ventaMaxima = Math.max(...Object.values(ventasDiarias), 0);
  const ventaMinima = Math.min(...Object.values(ventasDiarias).filter(v => v > 0), 0);
  
  // Top clientes
  const topClientes = Object.entries(clientesMap)
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 10)
    .map(([nombre, datos]) => ({
      nombre,
      total: datos.total,
      pedidos: datos.pedidos,
      ticketPromedio: datos.total / datos.pedidos
    }));
  
  // Top productos
  const topProductos = Object.entries(productosMap)
    .sort((a, b) => b[1].cantidad - a[1].cantidad)
    .slice(0, 15)
    .map(([nombre, datos]) => ({
      nombre,
      cantidad: datos.cantidad,
      total: datos.total
    }));
  
  // Top marcas
  const topMarcas = Object.entries(marcasMap)
    .sort((a, b) => b[1].cantidad - a[1].cantidad)
    .slice(0, 10)
    .map(([marca, datos]) => ({
      marca,
      cantidad: datos.cantidad,
      total: datos.total
    }));
  
  // Top NITs
  const topNITs = Object.entries(nitTransacciones)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  
  // Top ciudades
  const topCiudades = Object.entries(ciudadesMap)
    .sort((a, b) => b[1].cantidad - a[1].cantidad)
    .slice(0, 10)
    .map(([ciudad, datos]) => ({
      ciudad,
      cantidad: datos.cantidad,
      total: datos.total
    }));
  
  // Top departamentos
  const topDepartamentos = Object.entries(departamentosMap)
    .sort((a, b) => b[1].cantidad - a[1].cantidad)
    .slice(0, 10)
    .map(([departamento, datos]) => ({
      departamento,
      cantidad: datos.cantidad,
      total: datos.total
    }));
  
  // Top zonas
  const topZonas = Object.entries(zonasCiudadMap)
    .sort((a, b) => b[1].cantidad - a[1].cantidad)
    .slice(0, 10)
    .map(([zona, datos]) => ({
      zona,
      cantidad: datos.cantidad,
      total: datos.total
    }));
  
  // Métodos de pago
  const metodosPago = Object.entries(metodosPagoMap)
    .sort((a, b) => b[1].cantidad - a[1].cantidad)
    .map(([metodo, datos]) => ({
      metodo,
      cantidad: datos.cantidad,
      total: datos.total
    }));
  
  // Calcular tendencia
  const tendencia = calcularTendencia(ventasDiarias);
  
  return {
    totalVentas,
    totalIVA,
    totalPedidos: filteredData.length,
    ventasNetas: totalVentas - totalIVA,
    promedioPorPedido: filteredData.length > 0 ? totalVentas / filteredData.length : 0,
    porcentajeIVA: 12,
    promedioDiario: diasConVentas > 0 ? totalVentas / diasConVentas : 0,
    ventasDiarias,
    ventasPorHora,
    ventasPorMes,
    ventasPorSemana,
    topClientes,
    topProductos,
    topMarcas,
    topNITs,
    topCiudades,
    topDepartamentos,
    topZonas,
    metodosPago,
    categoriasProductos,
    estadosPedidos,
    diasConVentas,
    ventaMaxima,
    ventaMinima,
    tendencia,
    tipoVisualizacion: tipo,
    // NUEVOS CAMPOS
    ventasDiariasAnterior,
    comparacion: {
      totalVentas: {
        anterior: totalVentasAnterior,
        cambio: calcularPorcentajeCambio(totalVentas, totalVentasAnterior)
      },
      totalIVA: {
        anterior: totalIVAAnterior,
        cambio: calcularPorcentajeCambio(totalIVA, totalIVAAnterior)
      },
      ventasNetas: {
        anterior: totalVentasAnterior - totalIVAAnterior,
        cambio: calcularPorcentajeCambio(totalVentas - totalIVA, totalVentasAnterior - totalIVAAnterior)
      },
      totalPedidos: {
        anterior: totalPedidosAnterior,
        cambio: calcularPorcentajeCambio(filteredData.length, totalPedidosAnterior)
      },
      promedioPorPedido: {
        anterior: totalPedidosAnterior > 0 ? totalVentasAnterior / totalPedidosAnterior : 0,
        cambio: calcularPorcentajeCambio(
          filteredData.length > 0 ? totalVentas / filteredData.length : 0,
          totalPedidosAnterior > 0 ? totalVentasAnterior / totalPedidosAnterior : 0
        )
      },
      promedioDiario: {
        anterior: totalVentasAnterior / Math.max(Object.keys(ventasDiariasAnterior).length, 1),
        cambio: calcularPorcentajeCambio(
          diasConVentas > 0 ? totalVentas / diasConVentas : 0,
          totalVentasAnterior / Math.max(Object.keys(ventasDiariasAnterior).length, 1)
        )
      }
    }
  };

// Función para extraer zona
function extraerZona(direccion) {
  const patronZona = /zona\s*(\d+)|z\.\s*(\d+)|z\s+(\d+)/i;
  const match = direccion.match(patronZona);
  
  if (match) {
    const numeroZona = match[1] || match[2] || match[3];
    return `Zona ${numeroZona}`;
  }
  
  return 'Otras Zonas';
}

// Función para normalizar métodos de pago
function normalizarMetodoPago(metodo) {
  if (!metodo) return 'No especificado';
  
  const metodoLower = metodo.toString().toLowerCase().trim();
  
  if (metodoLower.includes('deposito') || metodoLower.includes('depósito') || metodoLower.includes('bancario')) {
    return 'Depósito Bancario';
  } else if (metodoLower.includes('cash') || metodoLower.includes('efectivo')) {
    return 'Efectivo';
  } else if (metodoLower.includes('visa') || metodoLower.includes('pos')) {
    return 'VISANET POS';
  } else if (metodoLower.includes('stripe')) {
    return 'Stripe';
  } else if (metodoLower.includes('tilopay')) {
    return 'Tilopay';
  } else if (metodoLower.includes('transferencia')) {
    return 'Transferencia';
  } else if (metodoLower.includes('tarjeta')) {
    return 'Tarjeta';
  } else {
    return metodo.charAt(0).toUpperCase() + metodo.slice(1).toLowerCase();
  }
}

// Función para categorizar productos
function categorizarProductoMejorado(nombreProducto) {
  const nombre = nombreProducto.toLowerCase();
  
  const categorias = {
    'Frenos': ['freno', 'pastilla', 'disco de freno', 'brake', 'pad', 'caliper', 'mordaza'],
    'Filtros': ['filtro', 'filter', 'purificador', 'elemento filtrante'],
    'Lubricantes': ['aceite', 'lubricante', 'grasa', 'oil', 'fluido', 'líquido'],
    'Sensores': ['sensor', 'sonda', 'detector', 'switch'],
    'Bombas': ['bomba', 'pump', 'motor de', 'actuador'],
    'Mangueras': ['manguera', 'tubo', 'hose', 'ducto', 'tubería'],
    'Válvulas': ['válvula', 'valvula', 'valve', 'solenoide'],
    'Fajas/Correas': ['faja', 'correa', 'belt', 'banda', 'cadena'],
    'Empaques': ['empaque', 'junta', 'sello', 'gasket', 'seal', 'o-ring'],
    'Turbos': ['turbo', 'turbina', 'compresor', 'intercooler'],
    'Radiadores': ['radiador', 'enfriador', 'condensador', 'intercambiador'],
    'Clutch': ['clutch', 'embrague', 'disco de embrague', 'plato'],
    'Suspensión': ['amortiguador', 'resorte', 'shock', 'strut', 'suspensión', 'buje'],
    'Motor': ['pistón', 'biela', 'cigüeñal', 'árbol de levas', 'culata', 'block'],
    'Eléctrico': ['alternador', 'arrancador', 'batería', 'relay', 'fusible', 'cable'],
    'Transmisión': ['sincronizado', 'engranaje', 'diferencial', 'cardán', 'homocinética'],
    'Escape': ['silenciador', 'catalizador', 'escape', 'resonador', 'múltiple'],
    'Dirección': ['terminal', 'rotula', 'cremallera', 'volante', 'columna'],
    'Carrocería': ['parabrisas', 'espejo', 'manija', 'chapa', 'bisagra', 'moldura'],
    'Delivery': ['delivery', 'envío', 'entrega', 'local delivery']
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

// Función para detectar marca
function detectarMarcaAuto(nombreProducto) {
  const nombre = nombreProducto.toUpperCase();
  
  const marcas = [
    'TOYOTA', 'HONDA', 'NISSAN', 'MAZDA', 'MITSUBISHI', 'SUZUKI', 'SUBARU', 'ISUZU',
    'FORD', 'CHEVROLET', 'CHEVY', 'GMC', 'DODGE', 'RAM', 'JEEP', 'CHRYSLER',
    'VOLKSWAGEN', 'VW', 'BMW', 'MERCEDES', 'BENZ', 'AUDI', 'PORSCHE', 'VOLVO',
    'HYUNDAI', 'KIA', 'DAEWOO', 'SSANGYONG',
    'CHANGAN', 'GEELY', 'GREAT WALL', 'BYD', 'CHERY', 'JAC'
  ];
  
  for (const marca of marcas) {
    if (nombre.includes(marca)) {
      if (marca === 'CHEVY') return 'CHEVROLET';
      if (marca === 'VW') return 'VOLKSWAGEN';
      if (marca === 'BENZ') return 'MERCEDES';
      return marca;
    }
  }
  
  return 'Otras';
}

// Función para obtener número de semana
function getWeekNumber(date) {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

// Función para calcular tendencia
function calcularTendencia(ventasDiarias) {
  const dias = Object.keys(ventasDiarias).map(Number).sort((a, b) => a - b);
  if (dias.length < 2) return 'neutral';
  
  const mitad = Math.floor(dias.length / 2);
  const primeraMitad = dias.slice(0, mitad).reduce((sum, dia) => sum + ventasDiarias[dia], 0);
  const segundaMitad = dias.slice(mitad).reduce((sum, dia) => sum + ventasDiarias[dia], 0);
  
  const diferencia = ((segundaMitad - primeraMitad) / primeraMitad) * 100;
  
  if (diferencia > 10) return 'up';
  if (diferencia < -10) return 'down';
  return 'neutral';
}
}