import React, { useState, useEffect } from "react";
import { useChatbotConfig } from "@/hooks/useChatbotConfig";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bot, Save, Loader2, MessageCircle, Palette, FileText, User, RefreshCw } from "lucide-react";

export const ChatbotSettings: React.FC = () => {
  const { config, isLoading, updateConfig, refetch } = useChatbotConfig();
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [formData, setFormData] = useState({
    enabled: false,
    bot_name: "",
    welcome_message: "",
    avatar_url: "",
    system_prompt: "",
    primary_color: "#1C67D8",
  });

  useEffect(() => {
    if (config) {
      setFormData({
        enabled: config.enabled,
        bot_name: config.bot_name,
        welcome_message: config.welcome_message,
        avatar_url: config.avatar_url || "",
        system_prompt: config.system_prompt,
        primary_color: config.primary_color || "#1C67D8",
      });
    }
  }, [config]);

  const handleSave = async () => {
    setIsSaving(true);
    await updateConfig(formData);
    setIsSaving(false);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              Configuración del Chatbot
            </CardTitle>
            <CardDescription>
              Configura el asistente virtual que aparecerá en la plataforma
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh} 
            disabled={isRefreshing}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enable/Disable Toggle */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
          <div className="flex items-center gap-3">
            <MessageCircle className="h-5 w-5 text-primary" />
            <div>
              <p className="font-medium">Activar Chatbot</p>
              <p className="text-sm text-muted-foreground">
                {formData.enabled 
                  ? "El chatbot está visible para todos los usuarios" 
                  : "El chatbot está oculto"}
              </p>
            </div>
          </div>
          <Switch
            checked={formData.enabled}
            onCheckedChange={(checked) =>
              setFormData((prev) => ({ ...prev, enabled: checked }))
            }
          />
        </div>

        {/* Bot Identity */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="bot_name" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Nombre del Bot
            </Label>
            <Input
              id="bot_name"
              name="bot_name"
              value={formData.bot_name}
              onChange={handleInputChange}
              placeholder="Asistente Comercial"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="primary_color" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Color Principal
            </Label>
            <div className="flex gap-2">
              <Input
                id="primary_color"
                name="primary_color"
                type="color"
                value={formData.primary_color}
                onChange={handleInputChange}
                className="w-14 h-10 p-1 cursor-pointer"
              />
              <Input
                value={formData.primary_color}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, primary_color: e.target.value }))
                }
                placeholder="#1C67D8"
                className="flex-1"
              />
            </div>
          </div>
        </div>

        {/* Avatar */}
        <div className="space-y-2">
          <Label htmlFor="avatar_url">Avatar del Bot (URL de imagen)</Label>
          <div className="flex gap-4 items-start">
            <Avatar className="h-16 w-16 border-2">
              <AvatarImage src={formData.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary">
                <Bot className="h-8 w-8" />
              </AvatarFallback>
            </Avatar>
            <Input
              id="avatar_url"
              name="avatar_url"
              value={formData.avatar_url}
              onChange={handleInputChange}
              placeholder="https://ejemplo.com/avatar.png"
              className="flex-1"
            />
          </div>
        </div>

        {/* Welcome Message */}
        <div className="space-y-2">
          <Label htmlFor="welcome_message">Mensaje de Bienvenida</Label>
          <Textarea
            id="welcome_message"
            name="welcome_message"
            value={formData.welcome_message}
            onChange={handleInputChange}
            placeholder="¡Hola! Soy tu asistente virtual..."
            rows={2}
          />
        </div>

        {/* System Prompt */}
        <div className="space-y-2">
          <Label htmlFor="system_prompt" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Instrucciones del Bot (System Prompt)
          </Label>
          <Textarea
            id="system_prompt"
            name="system_prompt"
            value={formData.system_prompt}
            onChange={handleInputChange}
            placeholder="Eres un asistente virtual experto en..."
            rows={4}
            className="font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">
            Define el comportamiento, conocimiento y personalidad del bot. Aquí puedes incluir información específica sobre procesos comerciales.
          </p>
        </div>

        {/* Preview */}
        <div className="p-4 rounded-lg border bg-muted/30">
          <p className="text-sm font-medium mb-3">Vista previa:</p>
          <div className="flex items-center gap-3">
            <div 
              className="h-12 w-12 rounded-full flex items-center justify-center text-white shadow-lg"
              style={{ backgroundColor: formData.primary_color }}
            >
              <MessageCircle className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <p className="font-medium">{formData.bot_name || "Asistente"}</p>
              <p className="text-sm text-muted-foreground truncate">
                {formData.welcome_message || "Mensaje de bienvenida..."}
              </p>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <Button onClick={handleSave} disabled={isSaving} className="w-full gap-2">
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Guardar Configuración
        </Button>
      </CardContent>
    </Card>
  );
};
