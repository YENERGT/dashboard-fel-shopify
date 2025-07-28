import { DataTable } from "@shopify/polaris";
import { useEffect, useRef } from 'react';

export function EnhancedDataTable({ 
  columnContentTypes, 
  headings, 
  rows, 
  delay = 0 
}) {
  const tableRef = useRef(null);

  useEffect(() => {
    if (tableRef.current) {
      // Animar filas de la tabla
      const tableRows = tableRef.current.querySelectorAll('tbody tr');
      tableRows.forEach((row, index) => {
        row.style.opacity = '0';
        row.style.transform = 'translateX(-20px)';
        
        setTimeout(() => {
          row.style.transition = 'all 0.3s ease-out';
          row.style.opacity = '1';
          row.style.transform = 'translateX(0)';
        }, (delay * 100) + (index * 50));
      });
    }
  }, [rows, delay]);

  return (
    <div ref={tableRef} className="enhanced-data-table">
      <DataTable
        columnContentTypes={columnContentTypes}
        headings={headings}
        rows={rows}
      />
    </div>
  );
}