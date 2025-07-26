/**
 * Utilidades para el manejo de fechas en múltiples formatos
 * Detecta automáticamente formatos: DD/MM/YYYY HH:MM:SS y YYYY-MM-DD HH:MM:SS
 */

/**
 * Detecta y parsea una fecha en múltiples formatos
 * @param {string} fechaStr - String de fecha a parsear
 * @returns {Date|null} - Objeto Date válido o null si no se puede parsear
 */
export function parseUniversalDate(fechaStr) {
  if (!fechaStr || typeof fechaStr !== 'string') {
    return null;
  }

  // Limpiar string de fecha
  const fechaLimpia = fechaStr.trim();
  
  // Regex para DD/MM/YYYY HH:MM:SS (formato guatemalteco/europeo)
  const regexDDMMYYYY = /^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2}):(\d{2})$/;
  
  // Regex para YYYY-MM-DD HH:MM:SS (formato ISO)
  const regexYYYYMMDD = /^(\d{4})-(\d{1,2})-(\d{1,2})\s+(\d{1,2}):(\d{2}):(\d{2})$/;
  
  // Regex para DD/MM/YYYY (sin hora)
  const regexDDMMYYYYSolo = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
  
  // Regex para YYYY-MM-DD (sin hora)
  const regexYYYYMMDDSolo = /^(\d{4})-(\d{1,2})-(\d{1,2})$/;

  let fecha = null;

  // Intentar formato DD/MM/YYYY HH:MM:SS
  const matchDDMMYYYY = fechaLimpia.match(regexDDMMYYYY);
  if (matchDDMMYYYY) {
    const [, dia, mes, anio, hora, minuto, segundo] = matchDDMMYYYY;
    fecha = new Date(
      parseInt(anio),
      parseInt(mes) - 1, // Los meses en JavaScript van de 0-11
      parseInt(dia),
      parseInt(hora),
      parseInt(minuto),
      parseInt(segundo)
    );
  }
  
  // Intentar formato YYYY-MM-DD HH:MM:SS
  else if (fechaLimpia.match(regexYYYYMMDD)) {
    const matchYYYYMMDD = fechaLimpia.match(regexYYYYMMDD);
    const [, anio, mes, dia, hora, minuto, segundo] = matchYYYYMMDD;
    fecha = new Date(
      parseInt(anio),
      parseInt(mes) - 1,
      parseInt(dia),
      parseInt(hora),
      parseInt(minuto),
      parseInt(segundo)
    );
  }
  
  // Intentar formato DD/MM/YYYY (solo fecha)
  else if (fechaLimpia.match(regexDDMMYYYYSolo)) {
    const matchDDMMYYYYSolo = fechaLimpia.match(regexDDMMYYYYSolo);
    const [, dia, mes, anio] = matchDDMMYYYYSolo;
    fecha = new Date(
      parseInt(anio),
      parseInt(mes) - 1,
      parseInt(dia),
      0, 0, 0 // Hora 00:00:00
    );
  }
  
  // Intentar formato YYYY-MM-DD (solo fecha)
  else if (fechaLimpia.match(regexYYYYMMDDSolo)) {
    const matchYYYYMMDDSolo = fechaLimpia.match(regexYYYYMMDDSolo);
    const [, anio, mes, dia] = matchYYYYMMDDSolo;
    fecha = new Date(
      parseInt(anio),
      parseInt(mes) - 1,
      parseInt(dia),
      0, 0, 0
    );
  }
  
  // Si no coincide con ningún patrón, intentar el constructor Date nativo como fallback
  else {
    fecha = new Date(fechaLimpia);
  }

  // Verificar si la fecha es válida
  if (fecha && !isNaN(fecha.getTime())) {
    return fecha;
  }

  return null;
}

/**
 * Valida si una fecha está dentro de un rango específico
 * @param {Date} fecha - Fecha a validar
 * @param {string} tipo - Tipo de filtro ('dia', 'mes', 'año')
 * @param {number} dia - Día específico (opcional)
 * @param {number} mes - Mes específico
 * @param {number} anio - Año específico
 * @returns {boolean} - True si la fecha coincide con los criterios
 */
export function validarFechaEnRango(fecha, tipo, dia, mes, anio) {
  if (!fecha || isNaN(fecha.getTime())) return false;
  
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
}

/**
 * Formatea una fecha a string legible en español
 * @param {Date} fecha - Fecha a formatear
 * @returns {string} - Fecha formateada
 */
export function formatearFechaEspanol(fecha) {
  if (!fecha || isNaN(fecha.getTime())) return 'Fecha inválida';
  
  const opciones = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'America/Guatemala'
  };
  
  return fecha.toLocaleDateString('es-GT', opciones);
}

/**
 * Función de prueba para verificar el funcionamiento
 * @returns {Object} - Resultado de las pruebas
 */
export function testearFormatos() {
  const fechasPrueba = [
    '25/12/2024 15:30:45',  // DD/MM/YYYY HH:MM:SS
    '2024-12-25 15:30:45',  // YYYY-MM-DD HH:MM:SS
    '01/01/2025 00:00:00',  // DD/MM/YYYY HH:MM:SS
    '2025-01-01 23:59:59',  // YYYY-MM-DD HH:MM:SS
    '25/12/2024',           // DD/MM/YYYY
    '2024-12-25',           // YYYY-MM-DD
  ];
  
  const resultados = fechasPrueba.map(fechaStr => ({
    original: fechaStr,
    parseada: parseUniversalDate(fechaStr),
    formateada: formatearFechaEspanol(parseUniversalDate(fechaStr))
  }));
  
  return {
    pruebas: resultados,
    exito: resultados.every(r => r.parseada !== null)
  };
}