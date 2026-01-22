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
  const { userName, courseName, completionDate, score, points, duration } = data;

  // Create PDF in landscape orientation
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Background gradient effect using rectangles
  doc.setFillColor(28, 103, 216); // #1C67D8 - ADDI Blue
  doc.rect(0, 0, pageWidth, 30, "F");
  doc.rect(0, pageHeight - 30, pageWidth, 30, "F");

  // Decorative corners
  doc.setFillColor(134, 254, 245); // #86FEF5 - Cyan
  doc.circle(0, 0, 40, "F");
  doc.circle(pageWidth, pageHeight, 40, "F");

  doc.setFillColor(255, 143, 67); // #FF8F43 - Orange
  doc.circle(pageWidth, 0, 30, "F");
  doc.circle(0, pageHeight, 30, "F");

  // Border
  doc.setDrawColor(28, 103, 216);
  doc.setLineWidth(2);
  doc.roundedRect(10, 10, pageWidth - 20, pageHeight - 20, 5, 5, "S");

  // Inner border
  doc.setDrawColor(134, 254, 245);
  doc.setLineWidth(0.5);
  doc.roundedRect(15, 15, pageWidth - 30, pageHeight - 30, 3, 3, "S");

  // Header - Training Center logo text
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("TRAINING CENTER", pageWidth / 2, 20, { align: "center" });

  // Certificate title
  doc.setTextColor(28, 103, 216);
  doc.setFontSize(36);
  doc.setFont("helvetica", "bold");
  doc.text("CERTIFICADO DE FINALIZACIÓN", pageWidth / 2, 55, { align: "center" });

  // Decorative line
  doc.setDrawColor(255, 143, 67);
  doc.setLineWidth(2);
  doc.line(pageWidth / 2 - 60, 62, pageWidth / 2 + 60, 62);

  // Subtitle
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(14);
  doc.setFont("helvetica", "normal");
  doc.text("Este certificado se otorga a", pageWidth / 2, 80, { align: "center" });

  // User name
  doc.setTextColor(17, 17, 17); // #111111
  doc.setFontSize(32);
  doc.setFont("helvetica", "bold");
  doc.text(userName, pageWidth / 2, 98, { align: "center" });

  // Decorative line under name
  doc.setDrawColor(134, 254, 245);
  doc.setLineWidth(1);
  doc.line(pageWidth / 2 - 80, 104, pageWidth / 2 + 80, 104);

  // Course completion text
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(14);
  doc.setFont("helvetica", "normal");
  doc.text("Por haber completado exitosamente el curso", pageWidth / 2, 120, { align: "center" });

  // Course name
  doc.setTextColor(28, 103, 216);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text(courseName, pageWidth / 2, 135, { align: "center" });

  // Stats section
  const statsY = 155;
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);

  const stats: string[] = [];
  
  if (score !== undefined) {
    stats.push(`Calificación: ${score}%`);
  }
  if (points !== undefined) {
    stats.push(`Puntos obtenidos: ${points}`);
  }
  if (duration !== undefined) {
    stats.push(`Duración: ${duration} minutos`);
  }

  if (stats.length > 0) {
    const statsText = stats.join("   |   ");
    doc.text(statsText, pageWidth / 2, statsY, { align: "center" });
  }

  // Completion date
  const formattedDate = completionDate.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  doc.setTextColor(17, 17, 17);
  doc.setFontSize(12);
  doc.text(`Fecha de finalización: ${formattedDate}`, pageWidth / 2, 170, { align: "center" });

  // Footer with certificate ID
  const certificateId = `TC-${Date.now().toString(36).toUpperCase()}`;
  doc.setTextColor(150, 150, 150);
  doc.setFontSize(9);
  doc.text(`ID del certificado: ${certificateId}`, pageWidth / 2, pageHeight - 35, { align: "center" });

  // Footer branding
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.text("training-center.lovable.app", pageWidth / 2, pageHeight - 15, { align: "center" });

  // Download the PDF
  const fileName = `Diploma_${courseName.replace(/\s+/g, "_")}_${userName.replace(/\s+/g, "_")}.pdf`;
  doc.save(fileName);
};
