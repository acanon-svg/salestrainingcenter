import React, { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Play, Volume2, VolumeX } from "lucide-react";

interface GoogleDriveVideoProps {
  url: string;
  title?: string;
  className?: string;
  heightClassName?: string;
  onEnded?: () => void;
}

/**
 * Extracts the file ID from a Google Drive URL
 * Supports formats:
 * - https://drive.google.com/file/d/FILE_ID/view
 * - https://drive.google.com/open?id=FILE_ID
 * - https://drive.google.com/uc?id=FILE_ID
 */
const extractDriveFileId = (url: string): string | null => {
  try {
    const urlObj = new URL(url);
    
    // Check for /file/d/FILE_ID/ pattern
    const fileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (fileMatch) {
      return fileMatch[1];
    }
    
    // Check for ?id=FILE_ID pattern
    const idParam = urlObj.searchParams.get("id");
    if (idParam) {
      return idParam;
    }
    
    return null;
  } catch {
    return null;
  }
};

/**
 * Converts a Google Drive URL to an embeddable preview URL
 */
const getDriveEmbedUrl = (url: string): string | null => {
  const fileId = extractDriveFileId(url);
  if (!fileId) return null;
  
  // Use the preview endpoint which works better for video embedding
  return `https://drive.google.com/file/d/${fileId}/preview`;
};

/**
 * Check if a URL is a Google Drive video URL
 */
export const isGoogleDriveVideoUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname === "drive.google.com" && extractDriveFileId(url) !== null;
  } catch {
    return false;
  }
};

export const GoogleDriveVideo: React.FC<GoogleDriveVideoProps> = ({
  url,
  title = "Video",
  className,
  heightClassName = "h-[500px]",
  onEnded,
}) => {
  const embedUrl = getDriveEmbedUrl(url);
  const [showUnmuteHint, setShowUnmuteHint] = useState(true);

  useEffect(() => {
    // Hide the hint after a few seconds
    const timer = setTimeout(() => {
      setShowUnmuteHint(false);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  if (!embedUrl) {
    return (
      <div className="flex flex-col items-center justify-center p-8 border rounded-lg bg-muted/50">
        <p className="text-muted-foreground mb-4">
          No se puede reproducir este video de Google Drive
        </p>
        <p className="text-xs text-muted-foreground text-center">
          Asegúrate de que el archivo esté compartido públicamente o con acceso mediante enlace.
        </p>
      </div>
    );
  }

  return (
    <div className={`relative ${className || ""}`}>
      <iframe
        src={embedUrl}
        className={`w-full ${heightClassName} rounded-lg border-0`}
        allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
        allowFullScreen
        title={title}
        sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
      />
      
      {/* Hint for users about autoplay limitations */}
      {showUnmuteHint && (
        <div className="absolute bottom-4 left-4 right-4 bg-background/90 backdrop-blur-sm border rounded-lg p-3 flex items-center gap-3 animate-fade-in">
          <div className="p-2 rounded-full bg-primary/10">
            <Play className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">
              Haz clic en el video para reproducir
            </p>
            <p className="text-xs text-muted-foreground">
              Es posible que necesites hacer clic directamente en el reproductor
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowUnmuteHint(false)}
          >
            Entendido
          </Button>
        </div>
      )}
    </div>
  );
};
