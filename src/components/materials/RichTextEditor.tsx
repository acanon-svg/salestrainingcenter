import React, { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Minus,
  Palette,
  Smile,
  Heading1,
  Heading2,
  Heading3,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Quote,
  Link,
  Image,
  Type,
  Eye,
  EyeOff,
  Highlighter,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
  showPreview?: boolean;
}

const TEXT_COLORS = [
  { name: "Negro", value: "text-foreground", hex: "#000000" },
  { name: "Gris", value: "text-gray-500", hex: "#6b7280" },
  { name: "Rojo", value: "text-red-500", hex: "#ef4444" },
  { name: "Verde", value: "text-green-500", hex: "#22c55e" },
  { name: "Azul", value: "text-blue-500", hex: "#3b82f6" },
  { name: "Amarillo", value: "text-yellow-500", hex: "#eab308" },
  { name: "Morado", value: "text-purple-500", hex: "#a855f7" },
  { name: "Naranja", value: "text-orange-500", hex: "#f97316" },
  { name: "Rosa", value: "text-pink-500", hex: "#ec4899" },
  { name: "Cyan", value: "text-cyan-500", hex: "#06b6d4" },
];

const HIGHLIGHT_COLORS = [
  { name: "Amarillo", hex: "#fef08a" },
  { name: "Verde", hex: "#bbf7d0" },
  { name: "Azul", hex: "#bfdbfe" },
  { name: "Rosa", hex: "#fbcfe8" },
  { name: "Naranja", hex: "#fed7aa" },
  { name: "Morado", hex: "#e9d5ff" },
];

const FONTS = [
  { name: "Sans Serif", value: "font-sans" },
  { name: "Serif", value: "font-serif" },
  { name: "Monospace", value: "font-mono" },
];

const EMOJIS = [
  "👍", "👎", "👏", "🎉", "🔥", "⭐", "✅", "❌", "📌", "📎",
  "💡", "📝", "📊", "📈", "🎯", "🚀", "💪", "🙌", "❤️", "💯",
  "⚠️", "ℹ️", "✨", "🏆", "📚", "🎓", "💼", "🔑", "🛠️", "📞",
];

// Parse rich text formatting to HTML for preview
export const parseRichText = (text: string): string => {
  if (!text) return "";
  let parsed = text;
  
  // Headings: # H1, ## H2, ### H3
  parsed = parsed.replace(/^### (.+)$/gm, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>');
  parsed = parsed.replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold mt-5 mb-3">$1</h2>');
  parsed = parsed.replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold mt-6 mb-4">$1</h1>');
  
  // Font styles: [font=serif]text[/font]
  parsed = parsed.replace(/\[font=sans\](.*?)\[\/font\]/gs, '<span class="font-sans">$1</span>');
  parsed = parsed.replace(/\[font=serif\](.*?)\[\/font\]/gs, '<span class="font-serif">$1</span>');
  parsed = parsed.replace(/\[font=mono\](.*?)\[\/font\]/gs, '<span class="font-mono">$1</span>');
  
  // Alignment: [align=center]text[/align]
  parsed = parsed.replace(/\[align=left\](.*?)\[\/align\]/gs, '<div class="text-left">$1</div>');
  parsed = parsed.replace(/\[align=center\](.*?)\[\/align\]/gs, '<div class="text-center">$1</div>');
  parsed = parsed.replace(/\[align=right\](.*?)\[\/align\]/gs, '<div class="text-right">$1</div>');
  
  // Bold: **text** -> <strong>text</strong>
  parsed = parsed.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  
  // Italic: _text_ -> <em>text</em>
  parsed = parsed.replace(/_([^_]+)_/g, "<em>$1</em>");
  
  // Underline: __text__ -> <u>text</u>
  parsed = parsed.replace(/~~([^~]+)~~/g, "<u>$1</u>");
  
  // Color: [color=#hex]text[/color] -> <span style="color:#hex">text</span>
  parsed = parsed.replace(/\[color=(#[a-fA-F0-9]{6})\](.*?)\[\/color\]/gs, '<span style="color:$1">$2</span>');
  
  // Highlight: [highlight=#hex]text[/highlight]
  parsed = parsed.replace(/\[highlight=(#[a-fA-F0-9]{6})\](.*?)\[\/highlight\]/gs, '<span style="background-color:$1;padding:0 4px;border-radius:3px">$2</span>');
  
  // Blockquote: > text
  parsed = parsed.replace(/^> (.+)$/gm, '<blockquote class="border-l-4 border-primary pl-4 py-2 my-2 bg-muted/50 italic">$1</blockquote>');
  
  // Links: [text](url)
  parsed = parsed.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-primary underline hover:text-primary/80">$1</a>');
  
  // Images: ![alt](url)
  parsed = parsed.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="max-w-full h-auto rounded-lg my-4 mx-auto" />');
  
  // Horizontal line: --- -> <hr>
  parsed = parsed.replace(/\n---\n/g, "<hr class='my-4 border-border'>");
  
  // Bullet points: • at start of line or - at start
  parsed = parsed.replace(/^[•\-] (.+)$/gm, "<li class='ml-4 list-disc'>$1</li>");
  
  // Numbered lists: 1. at start of line
  parsed = parsed.replace(/^\d+\. (.+)$/gm, "<li class='ml-4 list-decimal'>$1</li>");
  
  // Line breaks
  parsed = parsed.replace(/\n/g, "<br>");
  
  return parsed;
};

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder,
  rows = 6,
  className,
  showPreview = true,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [highlightPickerOpen, setHighlightPickerOpen] = useState(false);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [selectedFont, setSelectedFont] = useState("font-sans");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const { toast } = useToast();

  const insertText = useCallback((before: string, after: string = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const newText =
      value.substring(0, start) +
      before +
      selectedText +
      after +
      value.substring(end);

    onChange(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + before.length,
        start + before.length + selectedText.length
      );
    }, 0);
  }, [value, onChange]);

  const insertAtCursor = useCallback((text: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const newText = value.substring(0, start) + text + value.substring(start);
    onChange(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + text.length, start + text.length);
    }, 0);
  }, [value, onChange]);

  const wrapSelection = useCallback((wrapper: (text: string) => string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end) || "texto";
    const wrappedText = wrapper(selectedText);
    const newText = value.substring(0, start) + wrappedText + value.substring(end);

    onChange(newText);

    setTimeout(() => {
      textarea.focus();
    }, 0);
  }, [value, onChange]);

  const handleBold = () => insertText("**", "**");
  const handleItalic = () => insertText("_", "_");
  const handleUnderline = () => insertText("~~", "~~");
  
  const handleHeading = (level: 1 | 2 | 3) => {
    const prefix = "#".repeat(level) + " ";
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const lineStart = value.lastIndexOf("\n", start - 1) + 1;
    
    // Check if we're at the start of a line
    if (start === lineStart || start === 0) {
      insertAtCursor(prefix);
    } else {
      insertAtCursor("\n" + prefix);
    }
  };

  const handleBulletList = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    if (start === 0 || value[start - 1] === "\n") {
      insertAtCursor("• ");
    } else {
      insertAtCursor("\n• ");
    }
  };

  const handleNumberList = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const prefix = start === 0 || value[start - 1] === "\n" ? "1. " : "\n1. ";
    insertAtCursor(prefix);
  };

  const handleLineBreak = () => {
    insertAtCursor("\n---\n");
  };

  const handleQuote = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    if (start === 0 || value[start - 1] === "\n") {
      insertAtCursor("> ");
    } else {
      insertAtCursor("\n> ");
    }
  };

  const handleLink = () => {
    wrapSelection((text) => `[${text}](https://ejemplo.com)`);
  };

  const handleAlignment = (align: "left" | "center" | "right") => {
    wrapSelection((text) => `[align=${align}]${text}[/align]`);
  };

  const handleFontChange = (font: string) => {
    setSelectedFont(font);
    const fontName = font.replace("font-", "");
    wrapSelection((text) => `[font=${fontName}]${text}[/font]`);
  };

  const handleColorInsert = (hex: string) => {
    insertText(`[color=${hex}]`, "[/color]");
    setColorPickerOpen(false);
  };

  const handleHighlightInsert = (hex: string) => {
    insertText(`[highlight=${hex}]`, "[/highlight]");
    setHighlightPickerOpen(false);
  };

  const handleEmojiInsert = (emoji: string) => {
    insertAtCursor(emoji);
    setEmojiPickerOpen(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Imagen muy grande",
        description: "La imagen debe ser menor a 5MB.",
        variant: "destructive",
      });
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Archivo no válido",
        description: "Solo se permiten archivos de imagen.",
        variant: "destructive",
      });
      return;
    }

    setIsUploadingImage(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `content-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("training-materials")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("training-materials")
        .getPublicUrl(filePath);

      insertAtCursor(`\n![Imagen](${urlData.publicUrl})\n`);
      
      toast({
        title: "Imagen subida",
        description: "La imagen se ha insertado en el contenido.",
      });
    } catch (error) {
      console.error("Error uploading image:", error);
      toast({
        title: "Error",
        description: "No se pudo subir la imagen.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 border rounded-t-md bg-muted/30">
        {/* Font selector */}
        <Select value={selectedFont} onValueChange={handleFontChange}>
          <SelectTrigger className="w-28 h-8 text-xs">
            <Type className="h-3 w-3 mr-1" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FONTS.map((font) => (
              <SelectItem key={font.value} value={font.value}>
                <span className={font.value}>{font.name}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Headings */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => handleHeading(1)}
          title="Título 1"
          className="h-8 w-8 p-0"
        >
          <Heading1 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => handleHeading(2)}
          title="Título 2"
          className="h-8 w-8 p-0"
        >
          <Heading2 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => handleHeading(3)}
          title="Título 3"
          className="h-8 w-8 p-0"
        >
          <Heading3 className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Text formatting */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleBold}
          title="Negrita"
          className="h-8 w-8 p-0"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleItalic}
          title="Cursiva"
          className="h-8 w-8 p-0"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleUnderline}
          title="Subrayado"
          className="h-8 w-8 p-0"
        >
          <Underline className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Alignment */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => handleAlignment("left")}
          title="Alinear izquierda"
          className="h-8 w-8 p-0"
        >
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => handleAlignment("center")}
          title="Centrar"
          className="h-8 w-8 p-0"
        >
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => handleAlignment("right")}
          title="Alinear derecha"
          className="h-8 w-8 p-0"
        >
          <AlignRight className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Lists */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleBulletList}
          title="Lista con viñetas"
          className="h-8 w-8 p-0"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleNumberList}
          title="Lista numerada"
          className="h-8 w-8 p-0"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Quote and Link */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleQuote}
          title="Cita"
          className="h-8 w-8 p-0"
        >
          <Quote className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleLink}
          title="Enlace"
          className="h-8 w-8 p-0"
        >
          <Link className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleLineBreak}
          title="Línea separadora"
          className="h-8 w-8 p-0"
        >
          <Minus className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Image upload */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          title="Insertar imagen"
          className="h-8 w-8 p-0"
          disabled={isUploadingImage}
        >
          {isUploadingImage ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Image className="h-4 w-4" />
          )}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageUpload}
        />

        {/* Colors */}
        <Popover open={colorPickerOpen} onOpenChange={setColorPickerOpen}>
          <PopoverTrigger asChild>
            <Button type="button" variant="ghost" size="sm" title="Color de texto" className="h-8 w-8 p-0">
              <Palette className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-3 z-50 bg-popover">
            <p className="text-xs text-muted-foreground mb-2">Color de texto</p>
            <div className="flex flex-wrap gap-1 max-w-[180px]">
              {TEXT_COLORS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  className="w-6 h-6 rounded border-2 border-transparent hover:border-primary transition-colors"
                  style={{ backgroundColor: color.hex }}
                  onClick={() => handleColorInsert(color.hex)}
                  title={color.name}
                />
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <Popover open={highlightPickerOpen} onOpenChange={setHighlightPickerOpen}>
          <PopoverTrigger asChild>
            <Button type="button" variant="ghost" size="sm" title="Resaltar texto" className="h-8 w-8 p-0">
              <Highlighter className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-3 z-50 bg-popover">
            <p className="text-xs text-muted-foreground mb-2">Color de resaltado</p>
            <div className="flex gap-1">
              {HIGHLIGHT_COLORS.map((color) => (
                <button
                  key={color.hex}
                  type="button"
                  className="w-6 h-6 rounded border-2 border-transparent hover:border-primary transition-colors"
                  style={{ backgroundColor: color.hex }}
                  onClick={() => handleHighlightInsert(color.hex)}
                  title={color.name}
                />
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <Popover open={emojiPickerOpen} onOpenChange={setEmojiPickerOpen}>
          <PopoverTrigger asChild>
            <Button type="button" variant="ghost" size="sm" title="Emojis" className="h-8 w-8 p-0">
              <Smile className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2 z-50 bg-popover">
            <div className="grid grid-cols-10 gap-1">
              {EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  className="text-lg hover:bg-accent rounded p-1 transition-colors"
                  onClick={() => handleEmojiInsert(emoji)}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {showPreview && (
          <>
            <div className="flex-1" />
            <Button
              type="button"
              variant={previewMode ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setPreviewMode(!previewMode)}
              title={previewMode ? "Modo edición" : "Vista previa"}
              className="h-8"
            >
              {previewMode ? (
                <>
                  <EyeOff className="h-4 w-4 mr-1" />
                  Editar
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 mr-1" />
                  Vista previa
                </>
              )}
            </Button>
          </>
        )}
      </div>

      {/* Editor / Preview */}
      {previewMode ? (
        <div 
          className="min-h-[150px] p-4 border border-t-0 rounded-b-md bg-background prose prose-sm max-w-none dark:prose-invert"
          dangerouslySetInnerHTML={{ __html: parseRichText(value) || '<p class="text-muted-foreground">No hay contenido para mostrar</p>' }}
        />
      ) : (
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className="rounded-t-none border-t-0 font-mono text-sm resize-y"
        />
      )}

      {/* Help text */}
      <p className="text-xs text-muted-foreground">
        Usa los botones para dar formato. Puedes insertar imágenes, enlaces y emojis. Haz clic en "Vista previa" para ver cómo quedará.
      </p>
    </div>
  );
};
