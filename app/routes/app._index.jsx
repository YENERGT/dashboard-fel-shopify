import { json } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  BlockStack,
  Text,
  Button,
  InlineGrid,
  Banner,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  
  return json({
    currentDate: new Date().toLocaleDateString('es-GT'),
    currentTime: new Date().toLocaleTimeString('es-GT'),
  });
};

export default function Index() {
  const { currentDate, currentTime } = useLoaderData();

  return (
    <Page title="Dashboard FEL - Inicio">
      <Layout>
        <Layout.Section>
          <Banner status="info">
            <Text as="p" variant="bodyMd">
              Bienvenido al Dashboard FEL - Sistema de Análisis de Facturas Electrónicas
            </Text>
          </Banner>
        </Layout.Section>

        <Layout.Section>
          <BlockStack gap="500">
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingLg">
                  🚀 Inicio Rápido
                </Text>
                <Text as="p" variant="bodyMd" color="subdued">
                  Fecha: {currentDate} - Hora: {currentTime}
                </Text>
                
                <InlineGrid columns={3} gap="400">
                  <Card sectioned>
                    <BlockStack gap="200">
                      <Text as="h3" variant="headingMd">
                        📊 Ver Dashboard
                      </Text>
                      <Text as="p" variant="bodyMd" color="subdued">
                        Analiza tus ventas, clientes y productos
                      </Text>
                      <Link to="/app/dashboard">
                        <Button primary fullWidth>
                          Ir al Dashboard
                        </Button>
                      </Link>
                    </BlockStack>
                  </Card>

                  <Card sectioned>
                    <BlockStack gap="200">
                      <Text as="h3" variant="headingMd">
                        ⚙️ Configuración
                      </Text>
                      <Text as="p" variant="bodyMd" color="subdued">
                        Configura tu Google Sheet
                      </Text>
                      <Link to="/app/settings">
                        <Button fullWidth>
                          Configurar
                        </Button>
                      </Link>
                    </BlockStack>
                  </Card>

                  <Card sectioned>
                    <BlockStack gap="200">
                      <Text as="h3" variant="headingMd">
                        📥 Exportar Datos
                      </Text>
                      <Text as="p" variant="bodyMd" color="subdued">
                        Descarga reportes en CSV
                      </Text>
                      <Link to="/app/dashboard">
                        <Button fullWidth>
                          Ver Opciones
                        </Button>
                      </Link>
                    </BlockStack>
                  </Card>
                </InlineGrid>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  📈 Características Principales
                </Text>
                
                <BlockStack gap="200">
                  <Text as="p" variant="bodyMd">
                    ✓ Visualización de ventas en tiempo real
                  </Text>
                  <Text as="p" variant="bodyMd">
                    ✓ Análisis de top clientes y productos
                  </Text>
                  <Text as="p" variant="bodyMd">
                    ✓ Gráficos interactivos de ventas por día y hora
                  </Text>
                  <Text as="p" variant="bodyMd">
                    ✓ Análisis de ciudades y métodos de pago
                  </Text>
                  <Text as="p" variant="bodyMd">
                    ✓ Exportación de datos a CSV
                  </Text>
                  <Text as="p" variant="bodyMd">
                    ✓ Filtros por día, mes y año
                  </Text>
                </BlockStack>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="300">
                <Text as="h2" variant="headingMd">
                  ℹ️ Acerca de Dashboard FEL
                </Text>
                <Text as="p" variant="bodyMd">
                  Dashboard FEL es una aplicación diseñada para analizar y visualizar datos 
                  de facturas electrónicas almacenadas en Google Sheets. Proporciona insights 
                  valiosos sobre ventas, clientes y tendencias de negocio.
                </Text>
                <Text as="p" variant="bodyMd" color="subdued">
                  Versión 1.0.0 - Desarrollado para Shopify
                </Text>
              </BlockStack>
            </Card>
          </BlockStack>
        </Layout.Section>
      </Layout>
    </Page>
  );
}