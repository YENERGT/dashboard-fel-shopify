import { Card, Text, BlockStack, InlineStack, Badge } from "@shopify/polaris";
import { useEffect, useRef, useState } from 'react';

export function MetricCard({ 
  title, 
  value, 
  icon, 
  change, 
  format = "number",
  delay = 0,
  tone = null,  // ✅ Nuevo prop
  subtitle = null  // ✅ Nuevo prop
}) {
  const [displayValue, setDisplayValue] = useState(0);
  const cardRef = useRef(null);

  // Definir colores según el tone
  const getColor = () => {
    switch(tone) {
      case 'success':
        return '#008060';  // Verde Shopify
      case 'critical':
        return '#DC2626';  // Rojo
      case 'warning':
        return '#F59E0B';  // Amarillo
      case 'info':
        return '#3B82F6';  // Azul
      default:
        return null;  // Color por defecto del tema
    }
  };

  useEffect(() => {
  // Convertir value a string primero
  const valueStr = String(value);
  
  // Animación de contador
  const finalValue = format === "currency" || format === "percentage"
    ? parseFloat(valueStr.replace(/[^\d.-]/g, ''))
    : parseInt(valueStr.replace(/[^\d]/g, '')) || 0;
  
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
    } else if (format === "percentage") {
      setDisplayValue(`${current.toFixed(1)}%`);
    } else if (format === "text") {
      setDisplayValue(String(value)); // Asegurar que sea string
      clearInterval(timer);
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

  const valueColor = getColor();

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
  {valueColor ? (
    <span style={{ color: valueColor }}>{displayValue}</span>
  ) : (
    displayValue
  )}
</Text>
          {subtitle && (
            <Text as="p" variant="bodySm" tone="subdued">
              {subtitle}
            </Text>
          )}
        </BlockStack>
      </Card>
    </div>
  );
}