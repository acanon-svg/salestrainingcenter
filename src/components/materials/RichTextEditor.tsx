import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Minus,
  Palette,
  Smile,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
}

const TEXT_COLORS = [
  { name: "Negro", value: "text-foreground", hex: "#000000" },
  { name: "Rojo", value: "text-red-500", hex: "#ef4444" },
  { name: "Verde", value: "text-green-500", hex: "#22c55e" },
  { name: "Azul", value: "text-blue-500", hex: "#3b82f6" },
  { name: "Amarillo", value: "text-yellow-500", hex: "#eab308" },
  { name: "Morado", value: "text-purple-500", hex: "#a855f7" },
  { name: "Naranja", value: "text-orange-500", hex: "#f97316" },
];

const EMOJIS = [
  "👍", "👎", "👏", "🎉", "🔥", "⭐", "✅", "❌", "📌", "📎",
  "💡", "📝", "📊", "📈", "🎯", "🚀", "💪", "🙌", "❤️", "💯",
  "⚠️", "ℹ️", "✨", "🏆", "📚", "🎓", "💼", "🔑", "🛠️", "📞",
];

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder,
  rows = 4,
  className,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);

  const insertText = (before: string, after: string = "") => {
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

    // Reset cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + before.length,
        start + before.length + selectedText.length
      );
    }, 0);
  };

  const insertAtCursor = (text: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const newText = value.substring(0, start) + text + value.substring(start);
    onChange(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + text.length, start + text.length);
    }, 0);
  };

  const handleBold = () => insertText("**", "**");
  const handleItalic = () => insertText("_", "_");
  
  const handleBulletList = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const lineStart = value.lastIndexOf("\n", start - 1) + 1;
    const prefix = "\n• ";

    if (start === 0 || value[start - 1] === "\n") {
      insertAtCursor("• ");
    } else {
      insertAtCursor(prefix);
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

  const handleColorInsert = (hex: string) => {
    // Insert color marker that can be parsed later
    insertText(`[color=${hex}]`, "[/color]");
    setColorPickerOpen(false);
  };

  const handleEmojiInsert = (emoji: string) => {
    insertAtCursor(emoji);
    setEmojiPickerOpen(false);
  };

  return (
    <div className={cn("space-y-2", className)}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 border rounded-md bg-muted/30">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleBold}
          title="Negrita"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleItalic}
          title="Cursiva"
        >
          <Italic className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleBulletList}
          title="Lista con viñetas"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleNumberList}
          title="Lista numerada"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleLineBreak}
          title="Línea separadora"
        >
          <Minus className="h-4 w-4" />
        </Button>

        <Popover open={colorPickerOpen} onOpenChange={setColorPickerOpen}>
          <PopoverTrigger asChild>
            <Button type="button" variant="ghost" size="sm" title="Color de texto">
              <Palette className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2">
            <div className="flex gap-1">
              {TEXT_COLORS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  className="w-6 h-6 rounded-full border-2 border-transparent hover:border-primary transition-colors"
                  style={{ backgroundColor: color.hex }}
                  onClick={() => handleColorInsert(color.hex)}
                  title={color.name}
                />
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <Popover open={emojiPickerOpen} onOpenChange={setEmojiPickerOpen}>
          <PopoverTrigger asChild>
            <Button type="button" variant="ghost" size="sm" title="Emojis">
              <Smile className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2">
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
      </div>

      {/* Textarea */}
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="font-mono text-sm"
      />

      {/* Help text */}
      <p className="text-xs text-muted-foreground">
        Usa **texto** para negrita, _texto_ para cursiva. Los emojis y formatos se mostrarán en la vista previa.
      </p>
    </div>
  );
};
