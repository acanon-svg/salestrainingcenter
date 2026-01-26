import React, { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Bot, Upload, Loader2, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AvatarUploadProps {
  currentAvatarUrl: string;
  onAvatarChange: (url: string) => void;
}

export const AvatarUpload: React.FC<AvatarUploadProps> = ({
  currentAvatarUrl,
  onAvatarChange,
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

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "La imagen debe ser menor a 2MB.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      // Generate unique filename
      const fileExt = file.name.split(".").pop();
      const fileName = `chatbot-avatar-${Date.now()}.${fileExt}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("chatbot-avatars")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("chatbot-avatars")
        .getPublicUrl(fileName);

      onAvatarChange(urlData.publicUrl);

      toast({
        title: "Avatar actualizado",
        description: "La imagen del bot ha sido subida correctamente.",
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

  const handleRemoveAvatar = () => {
    onAvatarChange("");
  };

  return (
    <div className="space-y-3">
      <Label>Avatar del Bot</Label>
      <div className="flex gap-4 items-center">
        <Avatar className="h-20 w-20 border-2 border-primary/20">
          <AvatarImage src={currentAvatarUrl || undefined} />
          <AvatarFallback className="bg-primary/10 text-primary">
            <Bot className="h-10 w-10" />
          </AvatarFallback>
        </Avatar>
        
        <div className="flex flex-col gap-2">
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
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="gap-2"
          >
            {isUploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            {isUploading ? "Subiendo..." : "Subir imagen"}
          </Button>
          
          {currentAvatarUrl && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemoveAvatar}
              className="gap-2 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
              Eliminar
            </Button>
          )}
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="avatar_url" className="text-xs text-muted-foreground">
          O ingresa una URL de imagen
        </Label>
        <Input
          id="avatar_url"
          value={currentAvatarUrl}
          onChange={(e) => onAvatarChange(e.target.value)}
          placeholder="https://ejemplo.com/avatar.png"
          className="text-sm"
        />
      </div>
    </div>
  );
};
