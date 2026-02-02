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
  const { userName, courseName, completionDate, score, points } = data;

  // Create PDF in landscape orientation
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // ============================================
  // BACKGROUND
  // ============================================
  
  // Main background - light gray/cream
  doc.setFillColor(250, 250, 250);
  doc.rect(0, 0, pageWidth, pageHeight, "F");

  // Bottom wave gradient - Cyan to Blue
  // First layer - lighter cyan
  doc.setFillColor(134, 254, 245); // #86FEF5
  doc.triangle(0, pageHeight, pageWidth * 0.4, pageHeight, 0, pageHeight - 50, "F");
  
  // Second layer - gradient blue
  doc.setFillColor(28, 103, 216); // #1C67D8
  doc.triangle(0, pageHeight, pageWidth, pageHeight, pageWidth * 0.3, pageHeight - 40, "F");
  doc.triangle(pageWidth * 0.3, pageHeight - 40, pageWidth, pageHeight, pageWidth, pageHeight - 60, "F");
  
  // Curved wave effect
  doc.setFillColor(0, 180, 216); // Lighter blue for transition
  doc.triangle(pageWidth * 0.5, pageHeight, pageWidth, pageHeight, pageWidth, pageHeight - 30, "F");
  
  // Right side accent
  doc.setFillColor(134, 254, 245); // #86FEF5
  doc.triangle(pageWidth - 60, pageHeight, pageWidth, pageHeight, pageWidth, pageHeight - 25, "F");

  // ============================================
  // DECORATIVE ELEMENTS
  // ============================================

  // Top left corner decoration (laurel-like)
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.5);
  // Left branch
  for (let i = 0; i < 6; i++) {
    const startX = 25 + i * 3;
    const startY = 20 + i * 5;
    doc.line(startX, startY, startX + 8, startY - 8);
  }
  // Right branch
  for (let i = 0; i < 6; i++) {
    const startX = 35 + i * 3;
    const startY = 20 + i * 5;
    doc.line(startX, startY, startX + 8, startY + 8);
  }

  // Top right corner decoration (laurel-like)
  for (let i = 0; i < 6; i++) {
    const startX = pageWidth - 25 - i * 3;
    const startY = 20 + i * 5;
    doc.line(startX, startY, startX - 8, startY - 8);
  }
  for (let i = 0; i < 6; i++) {
    const startX = pageWidth - 35 - i * 3;
    const startY = 20 + i * 5;
    doc.line(startX, startY, startX - 8, startY + 8);
  }

  // Center watermark laurel wreath (behind text)
  doc.setDrawColor(230, 230, 230);
  doc.setLineWidth(0.3);
  const centerX = pageWidth / 2;
  const centerY = pageHeight / 2 + 10;
  // Left side of wreath
  for (let i = 0; i < 12; i++) {
    const angle = (i * 15 - 90) * Math.PI / 180;
    const x1 = centerX - 60 + Math.cos(angle) * 5;
    const y1 = centerY - 30 + i * 5;
    const x2 = x1 - 10;
    const y2 = y1 - 3;
    doc.line(x1, y1, x2, y2);
  }
  // Right side of wreath
  for (let i = 0; i < 12; i++) {
    const angle = (i * 15 - 90) * Math.PI / 180;
    const x1 = centerX + 60 - Math.cos(angle) * 5;
    const y1 = centerY - 30 + i * 5;
    const x2 = x1 + 10;
    const y2 = y1 - 3;
    doc.line(x1, y1, x2, y2);
  }

  // ============================================
  // ADDI LOGO (top right)
  // ============================================
  doc.setTextColor(28, 103, 216); // #1C67D8
  doc.setFontSize(42);
  doc.setFont("helvetica", "bold");
  doc.text("Addi", pageWidth - 45, 35, { align: "center" });

  // ============================================
  // CERTIFICATE TITLE
  // ============================================
  doc.setTextColor(60, 60, 60);
  doc.setFontSize(28);
  doc.setFont("helvetica", "bolditalic");
  doc.text("CERTIFICADO", pageWidth / 2, 55, { align: "center" });

  // Subtitle
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(14);
  doc.setFont("helvetica", "normal");
  doc.text("Este reconocimiento se otorga a", pageWidth / 2, 72, { align: "center" });

  // ============================================
  // USER NAME (Script-like styling)
  // ============================================
  // Main name with blue color and italic for script effect
  doc.setTextColor(28, 103, 216); // #1C67D8
  doc.setFontSize(38);
  doc.setFont("times", "bolditalic"); // Times italic gives a more elegant/script feel
  doc.text(userName, pageWidth / 2, 95, { align: "center" });

  // Decorative line under name
  doc.setDrawColor(28, 103, 216);
  doc.setLineWidth(0.8);
  const nameWidth = doc.getTextWidth(userName);
  const lineStart = (pageWidth - nameWidth) / 2 - 10;
  const lineEnd = (pageWidth + nameWidth) / 2 + 10;
  doc.line(lineStart, 100, lineEnd, 100);

  // ============================================
  // COURSE DESCRIPTION
  // ============================================
  doc.setTextColor(60, 60, 60);
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  
  // Description text
  const descLine1 = `Por haber completado exitosamente el curso "${courseName}"`;
  doc.text(descLine1, pageWidth / 2, 118, { align: "center" });
  
  // Stats line
  const statsItems: string[] = [];
  if (score !== undefined) {
    statsItems.push(`Calificación: ${score}%`);
  }
  if (points !== undefined) {
    statsItems.push(`Puntos obtenidos: ${points}`);
  }
  
  if (statsItems.length > 0) {
    const statsText = statsItems.join("  •  ");
    doc.setFontSize(11);
    doc.text(statsText, pageWidth / 2, 128, { align: "center" });
  }

  // ============================================
  // SIGNATURE LINES
  // ============================================
  const sigY = 155;
  const sig1X = pageWidth / 2 - 50;
  const sig2X = pageWidth / 2 + 50;

  // Signature lines
  doc.setDrawColor(100, 100, 100);
  doc.setLineWidth(0.3);
  doc.line(sig1X - 35, sigY, sig1X + 35, sigY);
  doc.line(sig2X - 35, sigY, sig2X + 35, sigY);

  // Signature labels
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  
  // Completion date
  const formattedDate = completionDate.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  doc.text(formattedDate, sig1X, sigY + 6, { align: "center" });
  doc.text("Fecha", sig1X, sigY + 12, { align: "center" });

  // Certificate ID as second signature
  const certificateId = `TC-${Date.now().toString(36).toUpperCase()}`;
  doc.text(certificateId, sig2X, sigY + 6, { align: "center" });
  doc.text("ID Certificado", sig2X, sigY + 12, { align: "center" });

  // ============================================
  // SEAL (bottom left)
  // ============================================
  const sealX = 35;
  const sealY = pageHeight - 45;
  
  // Outer circle
  doc.setDrawColor(180, 180, 180);
  doc.setFillColor(220, 220, 220);
  doc.setLineWidth(1);
  doc.circle(sealX, sealY, 15, "FD");
  
  // Inner circle
  doc.setFillColor(200, 200, 200);
  doc.circle(sealX, sealY, 10, "FD");
  
  // Center star-like pattern
  doc.setFillColor(160, 160, 160);
  doc.circle(sealX, sealY, 5, "F");
  
  // Ribbon effect
  doc.setFillColor(28, 103, 216);
  doc.triangle(sealX - 8, sealY + 14, sealX - 4, sealY + 10, sealX - 12, sealY + 25, "F");
  doc.triangle(sealX + 8, sealY + 14, sealX + 4, sealY + 10, sealX + 12, sealY + 25, "F");

  // ============================================
  // FOOTER
  // ============================================
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  
  const currentYear = new Date().getFullYear();
  doc.text(`©${currentYear} Addi — Información propietaria y confidencial`, pageWidth - 15, pageHeight - 8, { align: "right" });

  // Small logo/star in corner
  doc.setFillColor(255, 255, 255);
  const starX = pageWidth - 15;
  const starY = pageHeight - 20;
  // Simple diamond shape
  doc.triangle(starX, starY - 5, starX - 4, starY, starX + 4, starY, "F");
  doc.triangle(starX, starY + 5, starX - 4, starY, starX + 4, starY, "F");

  // ============================================
  // DOWNLOAD
  // ============================================
  const fileName = `Certificado_${courseName.replace(/\s+/g, "_")}_${userName.replace(/\s+/g, "_")}.pdf`;
  doc.save(fileName);
};
