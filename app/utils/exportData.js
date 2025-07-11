export function exportToCSV(data, filename = 'dashboard-fel-export') {
  // Preparar datos de ventas generales
  const generalData = [
    ['REPORTE DASHBOARD FEL'],
    ['Fecha de generación:', new Date().toLocaleString('es-GT')],
    [''],
    ['RESUMEN GENERAL'],
    ['Total Ventas:', `Q ${data.totalVentas.toFixed(2)}`],
    ['Total IVA:', `Q ${data.totalIVA.toFixed(2)}`],
    ['Ventas Netas:', `Q ${data.ventasNetas.toFixed(2)}`],
    ['Total Pedidos:', data.totalPedidos],
    ['Promedio por Pedido:', `Q ${data.promedioPorPedido.toFixed(2)}`],
    [''],
    ['TOP 10 CLIENTES'],
    ['Cliente', 'Total Ventas', 'Pedidos', 'Ticket Promedio']
  ];

  // Agregar datos de clientes
  data.topClientes.forEach(cliente => {
    generalData.push([
      cliente.nombre,
      `Q ${cliente.total.toFixed(2)}`,
      cliente.pedidos,
      `Q ${cliente.ticketPromedio.toFixed(2)}`
    ]);
  });

  // Agregar ciudades si existen
  if (data.topCiudades && data.topCiudades.length > 0) {
    generalData.push(['']);
    generalData.push(['TOP CIUDADES']);
    generalData.push(['Ciudad', 'Pedidos', 'Total Ventas', 'Ticket Promedio']);
    
    data.topCiudades.forEach(ciudad => {
      generalData.push([
        ciudad.ciudad,
        ciudad.cantidad,
        `Q ${ciudad.total.toFixed(2)}`,
        `Q ${(ciudad.total / ciudad.cantidad).toFixed(2)}`
      ]);
    });
  }

  // Convertir a CSV
  const csvContent = generalData
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');

  // Crear blob y descargar
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}