import React, { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Upload, Loader2, Trash2, Image as ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AnnouncementImageUploadProps {
  currentImageUrl: string;
  onImageChange: (url: string) => void;
}

export const AnnouncementImageUpload: React.FC<AnnouncementImageUploadProps> = ({
  currentImageUrl,
  onImageChange,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Error",
        description: "Por favor selecciona un archivo de imagen válido.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "La imagen debe ser menor a 5MB.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      // Generate unique filename
      const fileExt = file.name.split(".").pop();
      const fileName = `announcement-banner-${Date.now()}.${fileExt}`;

      // Upload to Supabase Storage (using training-materials bucket which is public)
      const { error: uploadError } = await supabase.storage
        .from("training-materials")
        .upload(`announcements/${fileName}`, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("training-materials")
        .getPublicUrl(`announcements/${fileName}`);

      onImageChange(urlData.publicUrl);

      toast({
        title: "Imagen subida",
        description: "La imagen del banner ha sido cargada correctamente.",
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Error al subir la imagen";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveImage = () => {
    onImageChange("");
  };

  return (
    <div className="space-y-3">
      <Label className="flex items-center gap-2">
        <ImageIcon className="h-4 w-4" />
        Imagen del Banner (728x90 px)
      </Label>
      
      <div className="flex flex-col gap-3">
        {/* Image Preview - Banner size 728x90 */}
        {currentImageUrl ? (
          <div className="relative w-full rounded-lg overflow-hidden border border-border bg-muted">
            <div className="w-full" style={{ aspectRatio: "728/90" }}>
              <img
                src={currentImageUrl}
                alt="Banner del anuncio"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/placeholder.svg";
                }}
              />
            </div>
          </div>
        ) : (
          <div 
            className="w-full rounded-lg border-2 border-dashed border-border bg-muted/50 flex flex-col items-center justify-center gap-2 py-6"
            style={{ aspectRatio: "728/90" }}
          >
            <ImageIcon className="w-8 h-8 text-muted-foreground/50" />
            <p className="text-xs text-muted-foreground">Sin imagen de banner</p>
          </div>
        )}

        {/* Upload Controls */}
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="gap-2 flex-1"
          >
            {isUploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            {isUploading ? "Subiendo..." : "Subir imagen"}
          </Button>
          
          {currentImageUrl && (
            <Button
              type="button"
              variant="destructive"
              size="icon"
              onClick={handleRemoveImage}
              title="Eliminar imagen"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          Tamaño recomendado: 728x90 px. Formatos: JPG, PNG, GIF, WebP. Max: 5MB
        </p>
      </div>
    </div>
  );
};

export default AnnouncementImageUpload;
