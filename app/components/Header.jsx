import { Box, InlineStack, Image } from "@shopify/polaris";
import { useEffect, useState } from 'react';

export function Header() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
        boxShadow: scrolled ? "0 4px 12px rgba(0,0,0,0.15)" : "0 2px 4px rgba(0,0,0,0.1)",
        transition: "all 0.3s ease",
        backdropFilter: scrolled ? "blur(10px)" : "none",
        backgroundColor: scrolled ? "rgba(255,255,255,0.9)" : "white"
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
              objectFit: "contain",
              transform: scrolled ? "scale(0.9)" : "scale(1)",
              transition: "transform 0.3s ease"
            }}
          />
        </Box>
      </InlineStack>
    </Box>
  );
}