import appStyles from "../styles/app.css?url";
import { Link, Outlet, useLoaderData, useRouteError } from "@remix-run/react";
import { boundary } from "@shopify/shopify-app-remix/server";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import { NavMenu } from "@shopify/app-bridge-react";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";
import { authenticate } from "../shopify.server";
import { Header } from "../components/Header";
import { LoadingScreen } from "../components/LoadingScreen";
import { Suspense } from "react";
import { Box } from "@shopify/polaris";

export const links = () => [
  { rel: "stylesheet", href: polarisStyles },
  { rel: "stylesheet", href: appStyles }  // Agregar esta línea
];

export const loader = async ({ request }) => {
  await authenticate.admin(request);

  return { apiKey: process.env.SHOPIFY_API_KEY || "" };
};

export default function App() {
  const { apiKey } = useLoaderData();

  return (
    <AppProvider isEmbeddedApp apiKey={apiKey}>
      <NavMenu>
        <Link to="/app" rel="home">
          Home
        </Link>
        <Link to="/app/dashboard">Analisis FEL</Link>
        <Link to="/app/analisis-financiero">Análisis Financiero</Link>
        <Link to="/app/envio-reportes">Envío de Reportes</Link>
        <Link to="/app/settings">Configuración</Link>
        <Link to="/app/additional">Additional page</Link>
      </NavMenu>
      <Box>
        <Header />
        <Box paddingBlockStart="0">
          <Suspense fallback={<LoadingScreen />}>
            <Outlet />
          </Suspense>
        </Box>
      </Box>
    </AppProvider>
  );
}

// Shopify needs Remix to catch some thrown responses, so that their headers are included in the response.
export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};