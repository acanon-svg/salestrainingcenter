import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, GripVertical } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface TableData {
  headers: string[];
  rows: string[][];
}

interface TableEditorProps {
  value: TableData;
  onChange: (data: TableData) => void;
}

export const TableEditor: React.FC<TableEditorProps> = ({ value, onChange }) => {
  const [headers, setHeaders] = useState<string[]>(value.headers.length > 0 ? value.headers : ["Columna 1", "Columna 2"]);
  const [rows, setRows] = useState<string[][]>(value.rows.length > 0 ? value.rows : [["", ""]]);

  const updateData = (newHeaders: string[], newRows: string[][]) => {
    setHeaders(newHeaders);
    setRows(newRows);
    onChange({ headers: newHeaders, rows: newRows });
  };

  const addColumn = () => {
    const newHeaders = [...headers, `Columna ${headers.length + 1}`];
    const newRows = rows.map(row => [...row, ""]);
    updateData(newHeaders, newRows);
  };

  const removeColumn = (index: number) => {
    if (headers.length <= 1) return;
    const newHeaders = headers.filter((_, i) => i !== index);
    const newRows = rows.map(row => row.filter((_, i) => i !== index));
    updateData(newHeaders, newRows);
  };

  const addRow = () => {
    const newRow = new Array(headers.length).fill("");
    updateData(headers, [...rows, newRow]);
  };

  const removeRow = (index: number) => {
    if (rows.length <= 1) return;
    updateData(headers, rows.filter((_, i) => i !== index));
  };

  const updateHeader = (index: number, value: string) => {
    const newHeaders = [...headers];
    newHeaders[index] = value;
    updateData(newHeaders, rows);
  };

  const updateCell = (rowIndex: number, colIndex: number, value: string) => {
    const newRows = rows.map((row, ri) => 
      ri === rowIndex 
        ? row.map((cell, ci) => ci === colIndex ? value : cell)
        : row
    );
    updateData(headers, newRows);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={addColumn}>
          <Plus className="h-4 w-4 mr-1" />
          Agregar columna
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={addRow}>
          <Plus className="h-4 w-4 mr-1" />
          Agregar fila
        </Button>
      </div>

      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8"></TableHead>
              {headers.map((header, colIndex) => (
                <TableHead key={colIndex} className="min-w-[150px]">
                  <div className="flex items-center gap-1">
                    <Input
                      value={header}
                      onChange={(e) => updateHeader(colIndex, e.target.value)}
                      className="h-8 text-xs font-medium"
                      placeholder={`Columna ${colIndex + 1}`}
                    />
                    {headers.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                        onClick={() => removeColumn(colIndex)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </TableHead>
              ))}
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, rowIndex) => (
              <TableRow key={rowIndex}>
                <TableCell className="w-8 p-2">
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                </TableCell>
                {row.map((cell, colIndex) => (
                  <TableCell key={colIndex} className="p-1">
                    <Input
                      value={cell}
                      onChange={(e) => updateCell(rowIndex, colIndex, e.target.value)}
                      className="h-8 text-sm"
                      placeholder="..."
                    />
                  </TableCell>
                ))}
                <TableCell className="w-10 p-1">
                  {rows.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                      onClick={() => removeRow(rowIndex)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <p className="text-xs text-muted-foreground">
        Los usuarios podrán buscar dentro de la tabla para filtrar filas específicas.
      </p>
    </div>
  );
};

export const parseTableData = (jsonString: string | null): TableData => {
  if (!jsonString) return { headers: [], rows: [] };
  try {
    return JSON.parse(jsonString);
  } catch {
    return { headers: [], rows: [] };
  }
};

export const stringifyTableData = (data: TableData): string => {
  return JSON.stringify(data);
};
