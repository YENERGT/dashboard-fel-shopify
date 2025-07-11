import {
  Page,
  Layout,
  Card,
  TextField,
  Button,
  BlockStack,
  Text,
  Banner,
} from "@shopify/polaris";
import { useState } from "react";

export default function Settings() {
  const [sheetId, setSheetId] = useState("");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    // Por ahora solo mostramos un mensaje
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <Page title="Configuración Dashboard FEL">
      <Layout>
        <Layout.Section>
          {saved && (
            <Banner status="success" title="Configuración guardada">
              Los cambios se han guardado correctamente.
            </Banner>
          )}
          
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Configuración de Google Sheets
              </Text>
              
              <TextField
                label="ID de Google Sheet"
                value={sheetId}
                onChange={setSheetId}
                helpText="El ID se encuentra en la URL de tu Google Sheet"
                placeholder="1O7GOEP0-DGEkJZLCU870fmdtKYKXbODJu5wIUSiOlYc"
              />
              
              <Text as="p" variant="bodyMd">
                Para obtener el ID de tu Google Sheet:
              </Text>
              <ol style={{ marginLeft: "20px" }}>
                <li>Abre tu Google Sheet</li>
                <li>Copia el ID de la URL: https://docs.google.com/spreadsheets/d/<strong>[ID_AQUÍ]</strong>/edit</li>
                <li>Pégalo en el campo de arriba</li>
              </ol>
              
              <Button primary onClick={handleSave}>
                Guardar Configuración
              </Button>
            </BlockStack>
          </Card>
          
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Instrucciones de Configuración
              </Text>
              
              <Text as="p" variant="bodyMd">
                <strong>Importante:</strong> Asegúrate de que tu Google Sheet tenga una hoja llamada "REGISTRO" 
                con las siguientes columnas:
              </Text>
              
              <ul style={{ marginLeft: "20px" }}>
                <li>Columna A: UUID</li>
                <li>Columna B: JSON (datos del pedido)</li>
                <li>Columna C: TOTAL_GENERAL</li>
                <li>Columna D: TOTAL_IVA</li>
                <li>Columna F: NOMBRE_NIT</li>
                <li>Columna J: FECHA</li>
                <li>Columna K: ESTADO</li>
                <li>Columna O: Método de pago</li>
              </ul>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}