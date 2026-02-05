import React, { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MaterialContentSearch } from "./MaterialContentSearch";
import { parseTableData, TableData, DEFAULT_STYLES } from "./TableEditor";
import { cn } from "@/lib/utils";

interface TableViewerProps {
  data: string | null;
  className?: string;
}

export const TableViewer: React.FC<TableViewerProps> = ({ data, className }) => {
  const [searchQuery, setSearchQuery] = useState("");
  
  const tableData = useMemo(() => parseTableData(data), [data]);
  const styles = tableData.styles || DEFAULT_STYLES;
  
  const filteredRows = useMemo(() => {
    if (!searchQuery.trim()) return tableData.rows;
    
    const query = searchQuery.toLowerCase();
    return tableData.rows.filter(row => 
      row.some(cell => cell.toLowerCase().includes(query))
    );
  }, [tableData.rows, searchQuery]);

  const highlightText = (text: string) => {
    if (!searchQuery.trim()) return text;
    
    const query = searchQuery.toLowerCase();
    const index = text.toLowerCase().indexOf(query);
    
    if (index === -1) return text;
    
    return (
      <>
        {text.slice(0, index)}
        <mark className="bg-accent text-accent-foreground px-0.5 rounded">
          {text.slice(index, index + searchQuery.length)}
        </mark>
        {text.slice(index + searchQuery.length)}
      </>
    );
  };

  if (!tableData.headers.length) {
    return (
      <div className="flex items-center justify-center h-32 bg-muted rounded-lg">
        <p className="text-muted-foreground">No hay tabla disponible</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <MaterialContentSearch
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="Buscar en la tabla..."
        resultsCount={searchQuery ? filteredRows.length : undefined}
      />
      
      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {tableData.headers.map((header, index) => (
                <TableHead 
                  key={index} 
                  style={{
                    backgroundColor: styles.headerBgColor,
                    color: styles.headerTextColor,
                    fontSize: `${styles.headerFontSize}px`,
                    fontWeight: styles.headerFontWeight,
                  }}
                >
                  {highlightText(header)}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRows.length > 0 ? (
              filteredRows.map((row, rowIndex) => (
                <TableRow key={rowIndex}>
                  {row.map((cell, cellIndex) => (
                    <TableCell 
                      key={cellIndex}
                      style={{
                        fontSize: `${styles.cellFontSize}px`,
                        color: styles.cellTextColor,
                      }}
                    >
                      {highlightText(cell)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell 
                  colSpan={tableData.headers.length} 
                  className="text-center text-muted-foreground py-8"
                >
                  No se encontraron resultados para "{searchQuery}"
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      {searchQuery && filteredRows.length > 0 && filteredRows.length < tableData.rows.length && (
        <p className="text-xs text-muted-foreground text-center">
          Mostrando {filteredRows.length} de {tableData.rows.length} filas
        </p>
      )}
    </div>
  );
};
