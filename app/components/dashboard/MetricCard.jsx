import { Card, Text, BlockStack, InlineStack, Badge } from "@shopify/polaris";
import { useEffect, useRef, useState } from 'react';

export function MetricCard({ 
  title, 
  value, 
  icon, 
  change, 
  format = "number",
  delay = 0 
}) {
  const [displayValue, setDisplayValue] = useState(0);
  const cardRef = useRef(null);

  useEffect(() => {
    // Animación de contador
    const finalValue = format === "currency" 
      ? parseFloat(value.replace(/[^\d.-]/g, ''))
      : parseInt(value);
    
    const duration = 1500; // 1.5 segundos
    const steps = 60;
    const increment = finalValue / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= finalValue) {
        current = finalValue;
        clearInterval(timer);
      }
      
      if (format === "currency") {
        setDisplayValue(`Q ${current.toFixed(2)}`);
      } else {
        setDisplayValue(Math.floor(current).toLocaleString());
      }
    }, duration / steps);

    // Animación de entrada
    if (cardRef.current) {
      cardRef.current.style.opacity = '0';
      cardRef.current.style.transform = 'translateY(20px)';
      
      setTimeout(() => {
        cardRef.current.style.transition = 'all 0.5s ease-out';
        cardRef.current.style.opacity = '1';
        cardRef.current.style.transform = 'translateY(0)';
      }, delay * 100);
    }

    return () => clearInterval(timer);
  }, [value, format, delay]);

  return (
    <div ref={cardRef}>
      <Card>
        <BlockStack gap="400">
          <InlineStack align="space-between">
            <Text as="h3" variant="headingMd">
              {icon} {title}
            </Text>
            {change && (
              <Badge tone={change >= 0 ? "success" : "critical"}>
                {change >= 0 ? "↑" : "↓"} {Math.abs(change).toFixed(1)}%
              </Badge>
            )}
          </InlineStack>
          <Text as="p" variant="heading2xl" fontWeight="bold">
            {displayValue}
          </Text>
        </BlockStack>
      </Card>
    </div>
  );
}