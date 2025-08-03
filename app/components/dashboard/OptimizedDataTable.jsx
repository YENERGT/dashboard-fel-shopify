import { useDebounce, useVirtualScrolling } from '../../hooks/performance.js';
import { DataTable, TextField, Card, Text, BlockStack } from "@shopify/polaris";
import { useState, useMemo } from 'react';

export function OptimizedDataTable({ 
  columnContentTypes, 
  headings, 
  rows, 
  searchable = false,
  virtualScrolling = false,
  title,
  subtitle
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Filtrado optimizado con useMemo
  const filteredRows = useMemo(() => {
    if (!debouncedSearchTerm) return rows;
    
    return rows.filter(row =>
      row.some(cell => 
        String(cell).toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      )
    );
  }, [rows, debouncedSearchTerm]);

  // Virtual scrolling para tablas grandes
  const shouldUseVirtualScrolling = virtualScrolling && filteredRows.length > 100;
  
  const {
    visibleItems: visibleRows,
    totalHeight,
    containerProps
  } = useVirtualScrolling(
    shouldUseVirtualScrolling ? filteredRows : [],
    400,
    40
  );

  const displayRows = shouldUseVirtualScrolling ? visibleRows.map(item => item) : filteredRows;

  return (
    <Card>
      <BlockStack gap="400">
        {(title || subtitle) && (
          <BlockStack gap="200">
            {title && <Text as="h3" variant="headingMd">{title}</Text>}
            {subtitle && <Text as="p" variant="bodyMd" tone="subdued">{subtitle}</Text>}
          </BlockStack>
        )}
        
        {searchable && (
          <TextField
            label="Buscar en tabla"
            labelHidden
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Buscar..."
            clearButton
            onClearButtonClick={() => setSearchTerm('')}
          />
        )}

        {shouldUseVirtualScrolling ? (
          <div {...containerProps}>
            <div style={{ height: totalHeight, position: 'relative' }}>
              <div style={{ position: 'absolute', top: 0, width: '100%' }}>
                <DataTable
                  columnContentTypes={columnContentTypes}
                  headings={headings}
                  rows={displayRows}
                />
              </div>
            </div>
          </div>
        ) : (
          <DataTable
            columnContentTypes={columnContentTypes}
            headings={headings}
            rows={displayRows}
            pagination={{
              hasNext: false,
              hasPrevious: false,
              label: `Mostrando ${displayRows.length} de ${rows.length} registros`
            }}
          />
        )}
      </BlockStack>
    </Card>
  );
}
