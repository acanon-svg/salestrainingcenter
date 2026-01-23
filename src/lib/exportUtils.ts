import { format as formatDate } from "date-fns";
import { es } from "date-fns/locale";

export type ExportFormat = "csv" | "excel";

interface ExportOptions {
  filename: string;
  format: ExportFormat;
}

// Convert array of objects to CSV string
export const convertToCSV = (data: Record<string, unknown>[], headers?: Record<string, string>): string => {
  if (data.length === 0) return "";

  const keys = Object.keys(data[0]);
  const headerRow = headers 
    ? keys.map(key => headers[key] || key)
    : keys;

  const rows = data.map(item =>
    keys.map(key => {
      const value = item[key];
      // Handle values that might contain commas or quotes
      if (typeof value === "string" && (value.includes(",") || value.includes('"') || value.includes("\n"))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value ?? "";
    }).join(",")
  );

  return [headerRow.join(","), ...rows].join("\n");
};

// Convert to Excel-compatible XML (simple .xls format)
export const convertToExcel = (
  data: Record<string, unknown>[], 
  headers?: Record<string, string>,
  sheetName: string = "Reporte"
): string => {
  if (data.length === 0) return "";

  const keys = Object.keys(data[0]);
  const headerRow = headers 
    ? keys.map(key => headers[key] || key)
    : keys;

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Styles>
    <Style ss:ID="header">
      <Font ss:Bold="1"/>
      <Interior ss:Color="#1C67D8" ss:Pattern="Solid"/>
      <Font ss:Color="#FFFFFF"/>
    </Style>
    <Style ss:ID="success">
      <Interior ss:Color="#22C55E" ss:Pattern="Solid"/>
    </Style>
    <Style ss:ID="warning">
      <Interior ss:Color="#F5B20A" ss:Pattern="Solid"/>
    </Style>
    <Style ss:ID="danger">
      <Interior ss:Color="#EF4444" ss:Pattern="Solid"/>
    </Style>
  </Styles>
  <Worksheet ss:Name="${sheetName}">
    <Table>`;

  // Header row
  xml += "\n      <Row>";
  headerRow.forEach(header => {
    xml += `\n        <Cell ss:StyleID="header"><Data ss:Type="String">${escapeXml(String(header))}</Data></Cell>`;
  });
  xml += "\n      </Row>";

  // Data rows
  data.forEach(item => {
    xml += "\n      <Row>";
    keys.forEach(key => {
      const value = item[key];
      const type = typeof value === "number" ? "Number" : "String";
      xml += `\n        <Cell><Data ss:Type="${type}">${escapeXml(String(value ?? ""))}</Data></Cell>`;
    });
    xml += "\n      </Row>";
  });

  xml += `
    </Table>
  </Worksheet>
</Workbook>`;

  return xml;
};

const escapeXml = (str: string): string => {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
};

// Download file
export const downloadFile = (content: string, options: ExportOptions): void => {
  const { filename, format } = options;
  const extension = format === "csv" ? ".csv" : ".xls";
  const mimeType = format === "csv" ? "text/csv;charset=utf-8;" : "application/vnd.ms-excel";
  
  const blob = new Blob(["\ufeff" + content], { type: mimeType }); // BOM for Excel UTF-8
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}${extension}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Export regional data
export const exportRegionalData = (
  data: Array<{
    name: string;
    users: number;
    courses_completed: number;
    avg_score: number;
    completion_rate: number;
  }>,
  exportFormat: ExportFormat
): void => {
  const headers = {
    name: "Regional",
    users: "Usuarios",
    courses_completed: "Cursos Completados",
    avg_score: "Promedio Calificación (%)",
    completion_rate: "Tasa de Compliance (%)",
  };

  const content = exportFormat === "csv" 
    ? convertToCSV(data, headers)
    : convertToExcel(data, headers, "Regionales");

  const dateStr = formatDate(new Date(), "yyyy-MM-dd", { locale: es });
  downloadFile(content, { filename: `reporte-regional-${dateStr}`, format: exportFormat });
};

// Export team data
export const exportTeamData = (
  data: Array<{
    team: string;
    regional: string | null;
    users: number;
    courses_completed: number;
    avg_score: number;
    completion_rate: number;
  }>,
  exportFormat: ExportFormat
): void => {
  const formattedData = data.map(item => ({
    ...item,
    regional: item.regional || "N/A",
  }));

  const headers = {
    team: "Equipo",
    regional: "Regional",
    users: "Usuarios",
    courses_completed: "Cursos Completados",
    avg_score: "Promedio Calificación (%)",
    completion_rate: "Tasa de Compliance (%)",
  };

  const content = exportFormat === "csv" 
    ? convertToCSV(formattedData, headers)
    : convertToExcel(formattedData, headers, "Equipos");

  const dateStr = formatDate(new Date(), "yyyy-MM-dd", { locale: es });
  downloadFile(content, { filename: `reporte-equipos-${dateStr}`, format: exportFormat });
};

// Export course data
export const exportCourseData = (
  data: Array<{
    id: string;
    name: string;
    enrollments: number;
    completions: number;
    avg_score: number;
  }>,
  exportFormat: ExportFormat
): void => {
  const formattedData = data.map(item => ({
    name: item.name,
    enrollments: item.enrollments,
    completions: item.completions,
    completion_rate: item.enrollments > 0 
      ? Math.round((item.completions / item.enrollments) * 100) 
      : 0,
    avg_score: item.avg_score,
  }));

  const headers = {
    name: "Curso",
    enrollments: "Inscripciones",
    completions: "Completados",
    completion_rate: "Tasa de Completado (%)",
    avg_score: "Promedio Calificación (%)",
  };

  const content = exportFormat === "csv" 
    ? convertToCSV(formattedData, headers)
    : convertToExcel(formattedData, headers, "Cursos");

  const dateStr = formatDate(new Date(), "yyyy-MM-dd", { locale: es });
  downloadFile(content, { filename: `reporte-cursos-${dateStr}`, format: exportFormat });
};

// Export monthly comparison data
export const exportMonthlyData = (
  data: Array<{
    month: string;
    enrollments: number;
    completions: number;
    avgScore: number;
    completionRate: number;
  }>,
  exportFormat: ExportFormat
): void => {
  const formattedData = data.map(item => ({
    month: item.month,
    enrollments: item.enrollments,
    completions: item.completions,
    completionRate: item.completionRate,
    avgScore: item.avgScore,
  }));

  const headers = {
    month: "Mes",
    enrollments: "Inscripciones",
    completions: "Completados",
    completionRate: "Tasa de Completado (%)",
    avgScore: "Promedio Calificación (%)",
  };

  const content = exportFormat === "csv" 
    ? convertToCSV(formattedData, headers)
    : convertToExcel(formattedData, headers, "Comparativa Mensual");

  const dateStr = formatDate(new Date(), "yyyy-MM-dd", { locale: es });
  downloadFile(content, { filename: `reporte-mensual-${dateStr}`, format: exportFormat });
};

// Export full compliance report
export const exportFullComplianceReport = (
  regionalData: Array<{
    name: string;
    users: number;
    courses_completed: number;
    avg_score: number;
    completion_rate: number;
  }>,
  teamData: Array<{
    team: string;
    regional: string | null;
    users: number;
    courses_completed: number;
    avg_score: number;
    completion_rate: number;
  }>,
  exportFormat: ExportFormat
): void => {
  if (exportFormat === "csv") {
    // For CSV, combine both datasets with a separator
    const regionalHeaders = {
      name: "Regional",
      users: "Usuarios",
      courses_completed: "Cursos Completados",
      avg_score: "Promedio (%)",
      completion_rate: "Compliance (%)",
    };
    
    const teamHeaders = {
      team: "Equipo",
      regional: "Regional",
      users: "Usuarios",
      courses_completed: "Cursos Completados",
      avg_score: "Promedio (%)",
      completion_rate: "Compliance (%)",
    };

    const formattedTeamData = teamData.map(item => ({
      ...item,
      regional: item.regional || "N/A",
    }));

    const regionalCSV = convertToCSV(regionalData, regionalHeaders);
    const teamCSV = convertToCSV(formattedTeamData, teamHeaders);
    
    const content = `REPORTE DE COMPLIANCE POR REGIONAL\n${regionalCSV}\n\n\nREPORTE DE COMPLIANCE POR EQUIPO\n${teamCSV}`;
    
    const dateStr = formatDate(new Date(), "yyyy-MM-dd", { locale: es });
    downloadFile(content, { filename: `reporte-compliance-completo-${dateStr}`, format: "csv" });
  } else {
    // For Excel, export teams with regional info
    exportTeamData(teamData, "excel");
  }
};
