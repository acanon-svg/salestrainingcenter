import React from "react";

interface GoogleDocEmbedProps {
  url: string;
  className?: string;
  heightClassName?: string;
}

// Convert Google Docs/Sheets/Slides URLs to embed URLs
const getEmbedUrl = (url: string): string | null => {
  try {
    const urlObj = new URL(url);
    
    // Google Docs
    if (urlObj.hostname === "docs.google.com") {
      // Handle different Google document types
      const pathParts = urlObj.pathname.split("/");
      const docType = pathParts[1]; // document, spreadsheets, presentation
      const docId = pathParts[3];
      
      if (docId) {
        switch (docType) {
          case "document":
            return `https://docs.google.com/document/d/${docId}/preview`;
          case "spreadsheets":
            return `https://docs.google.com/spreadsheets/d/${docId}/preview`;
          case "presentation":
            // Usamos /preview para evitar UI extra (p.ej. "Abrir original") del modo /embed
            return `https://docs.google.com/presentation/d/${docId}/preview`;
          case "forms":
            return `https://docs.google.com/forms/d/${docId}/viewform?embedded=true`;
          default:
            return null;
        }
      }
    }
    
    // Google Drive file viewer
    if (urlObj.hostname === "drive.google.com") {
      const fileIdMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
      if (fileIdMatch) {
        return `https://drive.google.com/file/d/${fileIdMatch[1]}/preview`;
      }
    }
    
    return null;
  } catch {
    return null;
  }
};

export const isGoogleUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    return (
      urlObj.hostname === "docs.google.com" ||
      urlObj.hostname === "drive.google.com"
    );
  } catch {
    return false;
  }
};

export const GoogleDocEmbed: React.FC<GoogleDocEmbedProps> = ({
  url,
  className,
  heightClassName = "h-[600px]",
}) => {
  const embedUrl = getEmbedUrl(url);

  if (!embedUrl) {
    return (
      <div className="flex flex-col items-center justify-center p-8 border rounded-lg bg-muted/50">
        <p className="text-muted-foreground mb-4">
          No se puede previsualizar este enlace de Google
        </p>
        <p className="text-xs text-muted-foreground">
          Por políticas de la plataforma, no se permite abrir el contenido fuera del visor.
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      <iframe
        src={embedUrl}
        className={`w-full ${heightClassName} rounded-lg border`}
        allow="autoplay"
        allowFullScreen
      />
    </div>
  );
};

