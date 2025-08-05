// Actualizar app/utils/shopifyOrders.server.js
import { getCachedData } from './cache.server.optimized';

// Función principal para obtener órdenes de Shopify
export async function getShopifyOrders(admin, tipo, dia, mes, anio) {
  const cacheKey = `shopify_orders_${tipo}_${dia}_${mes}_${anio}`;
  
  return getCachedData(cacheKey, async () => {
    console.log('[SHOPIFY] Fetching orders from API...');
    
    try {
      // Construir filtro de fechas
      const startDate = getStartDate(tipo, dia, mes, anio);
      const endDate = getEndDate(tipo, dia, mes, anio);
      
      // Query GraphQL corregida para obtener órdenes
      const query = `
        query GetOrders($query: String!, $first: Int!, $after: String) {
          orders(
            first: $first
            after: $after
            query: $query
          ) {
            edges {
              node {
                id
                name
                createdAt
                displayFinancialStatus
                displayFulfillmentStatus
                currentTotalPriceSet {
                  shopMoney {
                    amount
                    currencyCode
                  }
                }
                currentSubtotalPriceSet {
                  shopMoney {
                    amount
                  }
                }
                currentTotalTaxSet {
                  shopMoney {
                    amount
                  }
                }
                totalShippingPriceSet {
                  shopMoney {
                    amount
                  }
                }
                customer {
                  id
                  displayName
                  email
                }
                lineItems(first: 250) {
                  nodes {
                    id
                    title
                    quantity
                    originalUnitPriceSet {
                      shopMoney {
                        amount
                      }
                    }
                    discountedUnitPriceSet {
                      shopMoney {
                        amount
                      }
                    }
                    variant {
                      id
                      title
                      price
                    }
                  }
                }
                channelInformation {
                  app {
                    id
                    title
                  }
                  channelId
                  channelDefinition {
                    handle
                  }
                }
                tags
                totalDiscountsSet {
                  shopMoney {
                    amount
                    currencyCode
                  }
                }
                totalRefundedSet {
                  shopMoney {
                    amount
                    currencyCode
                  }
                }
                note
              }
              cursor
            }
            pageInfo {
              hasNextPage
              endCursor
            }
          }
        }
      `;
      
      // Recolectar todas las órdenes con paginación
      let allOrders = [];
      let hasNextPage = true;
      let cursor = null;
      
      while (hasNextPage) {
        // Query only paid orders to get accurate sales totals
        const response = await admin.graphql(query, {
          variables: {
            // Filter by date and financial status 'PAID'
            query: `created_at:>=${startDate.toISOString()} AND created_at:<=${endDate.toISOString()} AND financial_status:paid`,
            first: 250,
            after: cursor
          }
        });
        
        const responseData = await response.json();
        
        if (responseData.errors) {
          console.error('[SHOPIFY] GraphQL errors:', responseData.errors);
          throw new Error('Error fetching Shopify orders');
        }
        
        const { orders } = responseData.data;
        allOrders = [...allOrders, ...orders.edges.map(edge => edge.node)];
        
        hasNextPage = orders.pageInfo.hasNextPage;
        cursor = orders.pageInfo.endCursor;
        
        console.log(`[SHOPIFY] Fetched ${allOrders.length} orders so far...`);
      }
      
      console.log(`[SHOPIFY] Total orders fetched: ${allOrders.length}`);
      return allOrders;
    } catch (error) {
      console.error('[SHOPIFY] Error fetching orders:', error);
      throw error;
    }
  });
}

// Procesar órdenes de Shopify para análisis
export function processShopifyOrders(orders, tipo, dia) {
  const stats = {
    totalVentas: 0,
    totalSubtotal: 0,    // Net sales before taxes, shipping, discounts
    totalPedidos: 0,
    totalImpuestos: 0,
    totalEnvio: 0,
    totalDescuentos: 0,
    totalDevoluciones: 0,
    totalComisiones: 0,
    ventasPorDia: {},
    ventasPorCanal: {},
    ventasPorHora: {},
    topProductosShopify: {},
    clientesShopify: {},
    ventasPorEstadoFinanciero: {},
  };
  // Helper para parsear montos numéricos de strings
  const parseMoney = v => parseFloat(v) || 0;
  
  for (const order of orders) {
    // Solo contar órdenes pagadas
    if (order.displayFinancialStatus !== 'PAID' && 
        order.displayFinancialStatus !== 'PARTIALLY_PAID' &&
        order.displayFinancialStatus !== 'PENDING') {
      continue;
    }
    const total = parseMoney(order.currentTotalPriceSet.shopMoney.amount);
    const descuento = parseMoney(order.totalDiscountsSet?.shopMoney?.amount);
    const devolucion = parseMoney(order.totalRefundedSet?.shopMoney?.amount);
    const subtotal = parseMoney(order.currentSubtotalPriceSet?.shopMoney?.amount);
    const neto = total - descuento - devolucion;
    // Sumar comisiones de transacciones
    const comisiones = order.transactions?.reduce((sum, tx) => sum + parseMoney(tx.feeAmountSet?.shopMoney?.amount), 0) || 0;
    const fecha = new Date(order.createdAt);
    
    // Acumular ventas netas directamente
    stats.totalVentas += neto;
    stats.totalSubtotal += subtotal;
    stats.totalPedidos += 1;
    stats.totalImpuestos += parseMoney(order.currentTotalTaxSet?.shopMoney?.amount);
    stats.totalEnvio += parseMoney(order.totalShippingPriceSet?.shopMoney?.amount);
    stats.totalDescuentos += descuento;
    stats.totalDevoluciones += devolucion;
    stats.totalComisiones += comisiones;
    
    // Análisis por estado financiero
    const estadoFinanciero = order.displayFinancialStatus || 'UNKNOWN';
    stats.ventasPorEstadoFinanciero[estadoFinanciero] = 
      (stats.ventasPorEstadoFinanciero[estadoFinanciero] || 0) + neto;
    
    // Análisis temporal
    const diaNum = fecha.getDate();
    const hora = fecha.getHours();
    
    if (tipo === 'dia') {
      stats.ventasPorDia[hora] = (stats.ventasPorDia[hora] || 0) + neto;
    } else if (tipo === 'mes') {
      stats.ventasPorDia[diaNum] = (stats.ventasPorDia[diaNum] || 0) + neto;
    }
    
    // Ventas por hora (siempre)
    stats.ventasPorHora[hora] = (stats.ventasPorHora[hora] || 0) + neto;
    
    // Análisis por canal
    let canal = 'Tienda Online'; // Default
    
    if (order.channelInformation) {
      if (order.channelInformation.app?.title) {
        canal = order.channelInformation.app.title;
      } else if (order.channelInformation.channelDefinition?.handle) {
        canal = order.channelInformation.channelDefinition.handle;
      }
    }
    
    // También verificar por tags
    if (order.tags && order.tags.includes('POS')) {
      canal = 'Punto de Venta';
    }
    
    stats.ventasPorCanal[canal] = (stats.ventasPorCanal[canal] || { total: 0, pedidos: 0 });
    stats.ventasPorCanal[canal].total += neto;
    stats.ventasPorCanal[canal].pedidos += 1;
    
    // Análisis de productos
    order.lineItems.nodes.forEach(item => {
      const producto = item.title;
      if (!stats.topProductosShopify[producto]) {
        stats.topProductosShopify[producto] = { cantidad: 0, total: 0 };
      }
      stats.topProductosShopify[producto].cantidad += item.quantity;
      
      // Usar el precio con descuento si existe, sino el precio original
      const precioUnitario = item.discountedUnitPriceSet?.shopMoney?.amount || 
                            item.originalUnitPriceSet?.shopMoney?.amount || 
                            0;
      const totalItem = parseFloat(precioUnitario) * item.quantity;
      stats.topProductosShopify[producto].total += totalItem;
    });
    
    // Análisis de clientes
    if (order.customer) {
      const cliente = order.customer.displayName || order.customer.email || 'Cliente Anónimo';
      if (!stats.clientesShopify[cliente]) {
        stats.clientesShopify[cliente] = { total: 0, pedidos: 0 };
      }
      stats.clientesShopify[cliente].total += neto;
      // Ajustar total de cliente a ventas netas acumulando neto
      stats.clientesShopify[cliente].total += neto;
      stats.clientesShopify[cliente].pedidos += 1;
    }
  }
  
  // Convertir objetos a arrays ordenados
  stats.topProductosShopify = Object.entries(stats.topProductosShopify)
    .map(([nombre, data]) => ({ nombre, ...data }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);
    
  stats.ventasPorCanal = Object.entries(stats.ventasPorCanal)
    .map(([canal, data]) => ({ canal, ...data }))
    .sort((a, b) => b.total - a.total);
    
  stats.topClientesShopify = Object.entries(stats.clientesShopify)
    .map(([nombre, data]) => ({ nombre, ...data }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);
  
  // Convertir estados financieros a array
  stats.estadosFinancieros = Object.entries(stats.ventasPorEstadoFinanciero)
    .map(([estado, total]) => ({ estado, total }))
    .sort((a, b) => b.total - a.total);
  
  return stats;
}

// Funciones auxiliares para fechas
function getStartDate(tipo, dia, mes, anio) {
  if (tipo === 'dia') {
    return new Date(anio, mes - 1, dia, 0, 0, 0);
  } else if (tipo === 'mes') {
    return new Date(anio, mes - 1, 1, 0, 0, 0);
  }
}

function getEndDate(tipo, dia, mes, anio) {
  if (tipo === 'dia') {
    const end = new Date(anio, mes - 1, dia, 23, 59, 59);
    end.setMilliseconds(999);
    return end;
  } else if (tipo === 'mes') {
    const end = new Date(anio, mes, 0, 23, 59, 59); // Último día del mes
    end.setMilliseconds(999);
    return end;
  }
}