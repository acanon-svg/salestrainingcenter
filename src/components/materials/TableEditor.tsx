import React, { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Plus, 
  Trash2, 
  GripVertical, 
  Upload, 
  ClipboardPaste,
  Palette,
  Type,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";

export interface TableStyles {
  headerBgColor: string;
  headerTextColor: string;
  headerFontSize: string;
  headerFontWeight: string;
  cellFontSize: string;
  cellTextColor: string;
}

export interface TableData {
  headers: string[];
  rows: string[][];
  styles?: TableStyles;
}

const DEFAULT_STYLES: TableStyles = {
  headerBgColor: "#1e293b",
  headerTextColor: "#ffffff",
  headerFontSize: "14",
  headerFontWeight: "600",
  cellFontSize: "14",
  cellTextColor: "#1f2937",
};

const HEADER_COLORS = [
  { name: "Slate", value: "#1e293b" },
  { name: "Gris", value: "#4b5563" },
  { name: "Azul", value: "#1d4ed8" },
  { name: "Verde", value: "#15803d" },
  { name: "Rojo", value: "#b91c1c" },
  { name: "Morado", value: "#7c3aed" },
  { name: "Naranja", value: "#c2410c" },
  { name: "Cyan", value: "#0e7490" },
];

const TEXT_COLORS = [
  { name: "Negro", value: "#1f2937" },
  { name: "Blanco", value: "#ffffff" },
  { name: "Gris", value: "#6b7280" },
  { name: "Azul", value: "#2563eb" },
  { name: "Verde", value: "#16a34a" },
  { name: "Rojo", value: "#dc2626" },
];

const FONT_SIZES = ["12", "14", "16", "18", "20"];

interface TableEditorProps {
  value: TableData;
  onChange: (data: TableData) => void;
}

export const TableEditor: React.FC<TableEditorProps> = ({ value, onChange }) => {
  const [headers, setHeaders] = useState<string[]>(
    value.headers.length > 0 ? value.headers : ["Columna 1", "Columna 2"]
  );
  const [rows, setRows] = useState<string[][]>(
    value.rows.length > 0 ? value.rows : [["", ""]]
  );
  const [styles, setStyles] = useState<TableStyles>(value.styles || DEFAULT_STYLES);
  const [stylePickerOpen, setStylePickerOpen] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pasteAreaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  const updateData = useCallback((newHeaders: string[], newRows: string[][], newStyles?: TableStyles) => {
    setHeaders(newHeaders);
    setRows(newRows);
    if (newStyles) setStyles(newStyles);
    onChange({ headers: newHeaders, rows: newRows, styles: newStyles || styles });
  }, [onChange, styles]);

  const updateStyles = (newStyles: TableStyles) => {
    setStyles(newStyles);
    onChange({ headers, rows, styles: newStyles });
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

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json<string[]>(worksheet, { header: 1 });

      if (jsonData.length === 0) {
        toast({
          title: "Archivo vacío",
          description: "El archivo Excel no contiene datos.",
          variant: "destructive",
        });
        return;
      }

      const newHeaders = (jsonData[0] || []).map((h, i) => String(h) || `Columna ${i + 1}`);
      const newRows = jsonData.slice(1).map(row => 
        newHeaders.map((_, i) => String(row[i] || ""))
      );

      if (newRows.length === 0) {
        newRows.push(new Array(newHeaders.length).fill(""));
      }

      updateData(newHeaders, newRows);
      
      toast({
        title: "Excel importado",
        description: `Se importaron ${newHeaders.length} columnas y ${newRows.length} filas.`,
      });
    } catch (error) {
      console.error("Error reading Excel:", error);
      toast({
        title: "Error",
        description: "No se pudo leer el archivo Excel.",
        variant: "destructive",
      });
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData("text");
    
    if (!pastedText.trim()) return;

    // Parse tab-separated or comma-separated data (Excel format)
    const lines = pastedText.trim().split("\n");
    const parsedRows = lines.map(line => {
      // Try tab first (Excel default), then comma
      if (line.includes("\t")) {
        return line.split("\t").map(cell => cell.trim());
      }
      return line.split(",").map(cell => cell.trim());
    });

    if (parsedRows.length === 0) return;

    // First row as headers
    const newHeaders = parsedRows[0].map((h, i) => h || `Columna ${i + 1}`);
    const newRows = parsedRows.slice(1);

    if (newRows.length === 0) {
      newRows.push(new Array(newHeaders.length).fill(""));
    }

    // Ensure all rows have the same number of columns
    const normalizedRows = newRows.map(row => 
      newHeaders.map((_, i) => row[i] || "")
    );

    updateData(newHeaders, normalizedRows);
    
    toast({
      title: "Datos pegados",
      description: `Se importaron ${newHeaders.length} columnas y ${normalizedRows.length} filas.`,
    });

    // Clear the textarea
    if (pasteAreaRef.current) {
      pasteAreaRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4">
      {/* Import options */}
      <div className="flex flex-wrap items-center gap-2 p-3 bg-muted/50 rounded-lg border">
        <div className="flex items-center gap-2">
          <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-4 w-4 mr-1" />
            Importar Excel
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={handleExcelUpload}
          />
        </div>

        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <ClipboardPaste className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <textarea
              ref={pasteAreaRef}
              placeholder="Pegar datos desde Excel aquí (Ctrl+V)..."
              className="w-full h-9 pl-8 pr-3 py-2 text-sm border rounded-md bg-background resize-none"
              onPaste={handlePaste}
            />
          </div>
        </div>

        {/* Style picker */}
        <Popover open={stylePickerOpen} onOpenChange={setStylePickerOpen}>
          <PopoverTrigger asChild>
            <Button type="button" variant="outline" size="sm">
              <Palette className="h-4 w-4 mr-1" />
              Estilos
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-4" align="end">
            <div className="space-y-4">
              <h4 className="font-medium text-sm">Personalizar estilos de tabla</h4>
              
              {/* Header styles */}
              <div className="space-y-3">
                <Label className="text-xs text-muted-foreground">Encabezados</Label>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Color de fondo</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {HEADER_COLORS.map((color) => (
                        <button
                          key={color.value}
                          type="button"
                          className={`w-6 h-6 rounded border-2 transition-colors ${
                            styles.headerBgColor === color.value 
                              ? "border-primary" 
                              : "border-transparent"
                          }`}
                          style={{ backgroundColor: color.value }}
                          onClick={() => updateStyles({ ...styles, headerBgColor: color.value })}
                          title={color.name}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs">Color de texto</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {TEXT_COLORS.map((color) => (
                        <button
                          key={color.value}
                          type="button"
                          className={`w-6 h-6 rounded border-2 transition-colors ${
                            styles.headerTextColor === color.value 
                              ? "border-primary" 
                              : "border-transparent"
                          }`}
                          style={{ backgroundColor: color.value }}
                          onClick={() => updateStyles({ ...styles, headerTextColor: color.value })}
                          title={color.name}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Tamaño de fuente</Label>
                    <Select
                      value={styles.headerFontSize}
                      onValueChange={(v) => updateStyles({ ...styles, headerFontSize: v })}
                    >
                      <SelectTrigger className="h-8 text-xs mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FONT_SIZES.map((size) => (
                          <SelectItem key={size} value={size}>{size}px</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs">Peso de fuente</Label>
                    <Select
                      value={styles.headerFontWeight}
                      onValueChange={(v) => updateStyles({ ...styles, headerFontWeight: v })}
                    >
                      <SelectTrigger className="h-8 text-xs mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="400">Normal</SelectItem>
                        <SelectItem value="500">Medium</SelectItem>
                        <SelectItem value="600">Semibold</SelectItem>
                        <SelectItem value="700">Bold</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Cell styles */}
              <div className="space-y-3 pt-2 border-t">
                <Label className="text-xs text-muted-foreground">Celdas</Label>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Tamaño de fuente</Label>
                    <Select
                      value={styles.cellFontSize}
                      onValueChange={(v) => updateStyles({ ...styles, cellFontSize: v })}
                    >
                      <SelectTrigger className="h-8 text-xs mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FONT_SIZES.map((size) => (
                          <SelectItem key={size} value={size}>{size}px</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs">Color de texto</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {TEXT_COLORS.slice(0, 4).map((color) => (
                        <button
                          key={color.value}
                          type="button"
                          className={`w-6 h-6 rounded border-2 transition-colors ${
                            styles.cellTextColor === color.value 
                              ? "border-primary" 
                              : "border-transparent"
                          }`}
                          style={{ backgroundColor: color.value }}
                          onClick={() => updateStyles({ ...styles, cellTextColor: color.value })}
                          title={color.name}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Table actions */}
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

      {/* Table preview with styles */}
      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8" style={{ backgroundColor: styles.headerBgColor }}></TableHead>
              {headers.map((header, colIndex) => (
                <TableHead 
                  key={colIndex} 
                  className="min-w-[150px]"
                  style={{ 
                    backgroundColor: styles.headerBgColor,
                    color: styles.headerTextColor,
                    fontSize: `${styles.headerFontSize}px`,
                    fontWeight: styles.headerFontWeight,
                  }}
                >
                  <div className="flex items-center gap-1">
                    <Input
                      value={header}
                      onChange={(e) => updateHeader(colIndex, e.target.value)}
                      className="h-8 text-xs font-medium bg-transparent border-white/20"
                      style={{ color: styles.headerTextColor }}
                      placeholder={`Columna ${colIndex + 1}`}
                    />
                    {headers.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 hover:bg-white/20"
                        style={{ color: styles.headerTextColor }}
                        onClick={() => removeColumn(colIndex)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </TableHead>
              ))}
              <TableHead 
                className="w-10" 
                style={{ backgroundColor: styles.headerBgColor }}
              ></TableHead>
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
                      className="h-8"
                      style={{ 
                        fontSize: `${styles.cellFontSize}px`,
                        color: styles.cellTextColor,
                      }}
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
        Puedes importar datos desde Excel o pegar directamente desde una hoja de cálculo. 
        Los usuarios podrán buscar dentro de la tabla para filtrar filas específicas.
      </p>
    </div>
  );
};

export const parseTableData = (jsonString: string | null): TableData => {
  if (!jsonString) return { headers: [], rows: [], styles: DEFAULT_STYLES };
  try {
    const data = JSON.parse(jsonString);
    return {
      ...data,
      styles: data.styles || DEFAULT_STYLES,
    };
  } catch {
    return { headers: [], rows: [], styles: DEFAULT_STYLES };
  }
};

export const stringifyTableData = (data: TableData): string => {
  return JSON.stringify(data);
};

export { DEFAULT_STYLES };
