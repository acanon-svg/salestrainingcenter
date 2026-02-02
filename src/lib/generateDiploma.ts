import { jsPDF } from "jspdf";

interface DiplomaData {
  userName: string;
  courseName: string;
  completionDate: Date;
  score?: number;
  points?: number;
  duration?: number;
}

export const generateDiploma = (data: DiplomaData): void => {
  const { userName, courseName, completionDate, points, duration } = data;

  // Create PDF in landscape orientation
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // ============================================
  // BACKGROUND - White/Light gray
  // ============================================
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageWidth, pageHeight, "F");

  // ============================================
  // DECORATIVE CORNER ELEMENTS
  // ============================================
  
  // Top-left cyan/blue gradient corner
  doc.setFillColor(72, 209, 204); // Cyan
  doc.triangle(0, 0, 50, 0, 0, 40, "F");
  doc.setFillColor(30, 144, 255); // Blue
  doc.triangle(0, 0, 35, 0, 0, 25, "F");
  
  // Top-right orange/blue corner
  doc.setFillColor(255, 165, 80); // Orange
  doc.triangle(pageWidth, 0, pageWidth - 40, 0, pageWidth, 35, "F");
  doc.setFillColor(30, 144, 255); // Blue
  doc.triangle(pageWidth, 15, pageWidth - 25, 0, pageWidth, 0, "F");
  
  // Bottom-left cyan corner
  doc.setFillColor(72, 209, 204); // Cyan
  doc.triangle(0, pageHeight, 45, pageHeight, 0, pageHeight - 35, "F");
  doc.setFillColor(30, 144, 255); // Blue
  doc.triangle(0, pageHeight, 30, pageHeight, 0, pageHeight - 20, "F");
  
  // Bottom-right orange corner
  doc.setFillColor(255, 165, 80); // Orange
  doc.triangle(pageWidth, pageHeight, pageWidth - 45, pageHeight, pageWidth, pageHeight - 35, "F");
  doc.setFillColor(30, 144, 255); // Blue
  doc.triangle(pageWidth, pageHeight, pageWidth - 25, pageHeight, pageWidth, pageHeight - 15, "F");

  // ============================================
  // HEADER BAR - "TRAINING CENTER"
  // ============================================
  doc.setFillColor(30, 144, 255); // Blue
  doc.rect(40, 18, pageWidth - 80, 14, "F");
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("TRAINING CENTER", pageWidth / 2, 27, { align: "center" });

  // ============================================
  // MAIN TITLE - "CERTIFICADO DE FINALIZACIÓN"
  // ============================================
  doc.setTextColor(30, 100, 180); // Dark blue
  doc.setFontSize(32);
  doc.setFont("helvetica", "bold");
  doc.text("CERTIFICADO DE FINALIZACIÓN", pageWidth / 2, 55, { align: "center" });

  // Orange underline
  doc.setDrawColor(255, 165, 80);
  doc.setLineWidth(1.5);
  const titleWidth = 120;
  doc.line((pageWidth - titleWidth) / 2, 60, (pageWidth + titleWidth) / 2, 60);

  // ============================================
  // CERTIFICATE TEXT
  // ============================================
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(14);
  doc.setFont("helvetica", "normal");
  doc.text("Este certificado se otorga a", pageWidth / 2, 78, { align: "center" });

  // ============================================
  // USER NAME
  // ============================================
  doc.setTextColor(30, 60, 90); // Dark blue-gray
  doc.setFontSize(36);
  doc.setFont("helvetica", "bold");
  doc.text(userName, pageWidth / 2, 98, { align: "center" });

  // Line under name
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.5);
  const nameWidth = Math.min(doc.getTextWidth(userName) + 40, 180);
  doc.line((pageWidth - nameWidth) / 2, 103, (pageWidth + nameWidth) / 2, 103);

  // ============================================
  // COURSE DESCRIPTION
  // ============================================
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(14);
  doc.setFont("helvetica", "normal");
  doc.text("Por haber completado exitosamente el curso", pageWidth / 2, 120, { align: "center" });

  // Course name
  doc.setTextColor(30, 100, 180); // Blue
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text(courseName, pageWidth / 2, 135, { align: "center" });

  // ============================================
  // STATS LINE
  // ============================================
  const statsItems: string[] = [];
  if (points !== undefined && points > 0) {
    statsItems.push(`Puntos obtenidos: ${points}`);
  }
  if (duration !== undefined && duration > 0) {
    statsItems.push(`Duración: ${duration} minutos`);
  }

  if (statsItems.length > 0) {
    doc.setTextColor(80, 80, 80);
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    const statsText = statsItems.join("  |  ");
    doc.text(statsText, pageWidth / 2, 152, { align: "center" });
  }

  // ============================================
  // COMPLETION DATE & CERTIFICATE ID
  // ============================================
  const formattedDate = completionDate.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  doc.setTextColor(60, 60, 60);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(`Fecha de finalización: ${formattedDate}`, pageWidth / 2, 168, { align: "center" });

  // Certificate ID
  const certificateId = `TC-${Date.now().toString(36).toUpperCase()}`;
  doc.setTextColor(120, 120, 120);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`ID del certificado: ${certificateId}`, pageWidth / 2, 176, { align: "center" });

  // ============================================
  // DOWNLOAD
  // ============================================
  const fileName = `Certificado_${courseName.replace(/\s+/g, "_")}_${userName.replace(/\s+/g, "_")}.pdf`;
  doc.save(fileName);
};
