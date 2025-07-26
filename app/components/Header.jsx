import { Box, InlineStack, Image } from "@shopify/polaris";

export function Header() {
  return (
    <Box
      background="bg-surface"
      borderBlockEndWidth="025"
      borderColor="border"
      paddingBlock="100"
      paddingInline="400"
      position="sticky"
      insetBlockStart="0"
      style={{
        height: "60px",
        zIndex: 100,
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
      }}
    >
      <InlineStack align="center" blockAlign="center" gap="400">
        <Box>
          <Image
            source="https://cdn.shopify.com/s/files/1/0289/7264/6460/files/Adobe_Express_20230423_1933570_1_5abf345d-a84c-46f9-8b04-97f43ef89251.png?v=1731103054"
            alt="Dashboard FEL Logo"
            style={{
              height: "80px",
              width: "auto",
              objectFit: "contain"
            }}
          />
        </Box>
      </InlineStack>
    </Box>
  );
}