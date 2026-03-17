import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, X, Minimize2, Maximize2, Send, Sparkles, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useChatbotConfig } from "@/hooks/useChatbotConfig";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTED_QUESTIONS = [
  "¿Cuál es mi progreso en los cursos?",
  "Quiero aprender sobre manejo de objeciones",
  "¿Cómo puedo mejorar mi ranking?",
  "Necesito un curso de técnicas de cierre",
];

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-training-bot`;

export const AITrainingBot: React.FC = () => {
  const { user } = useAuth();
  const { config, isLoading: configLoading } = useChatbotConfig();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, isMinimized]);

  // Don't render for unauthenticated users or when chatbot is disabled
  if (!user || configLoading || !config?.ai_bot_enabled) return null;

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: Msg = { role: "user", content: text.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    const apiMessages = [...messages, userMsg].map((m) => ({
      role: m.role,
      content: m.content,
    }));

    try {
      // Get the user's actual JWT for proper auth context
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ messages: apiMessages }),
      });

      if (!resp.ok) {
        const errorData = await resp.json().catch(() => null);
        throw new Error(errorData?.error || "Error al conectar con el asistente");
      }

      const data = await resp.json();

      if (data.error) {
        throw new Error(data.error);
      }

      const content = data.content || data.message || "Respuesta recibida.";
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content },
      ]);
    } catch (e) {
      console.error("AITrainingBot error:", e);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `⚠️ ${e instanceof Error ? e.message : "Error al conectar con el asistente. Intenta de nuevo."}`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  // Floating bubble
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-primary-foreground shadow-lg transition-all hover:scale-105 hover:shadow-xl"
        aria-label="Abrir asistente de entrenamiento"
      >
        <Bot className="h-5 w-5" />
        <span className="text-sm font-medium hidden sm:inline">Andy IA</span>
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
        </span>
      </button>
    );
  }

  // Minimized state
  if (isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-primary-foreground shadow-lg">
        <Bot className="h-5 w-5" />
        <span className="text-sm font-medium">Andy IA</span>
        <button onClick={() => setIsMinimized(false)} className="ml-1 hover:opacity-80">
          <Maximize2 className="h-4 w-4" />
        </button>
        <button onClick={() => { setIsOpen(false); setIsMinimized(false); }} className="hover:opacity-80">
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col rounded-2xl border border-border bg-background shadow-2xl animate-scale-in"
      style={{ width: 384, height: 580, maxHeight: "calc(100vh - 48px)", maxWidth: "calc(100vw - 32px)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between rounded-t-2xl bg-primary px-4 py-3 text-primary-foreground">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-foreground/20">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold leading-tight">Andy</h3>
            <p className="text-xs opacity-80 flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> Powered by IA - by Alexandra Cañon
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setIsMinimized(true)} className="rounded p-1 hover:bg-primary-foreground/20 transition-colors">
            <Minimize2 className="h-4 w-4" />
          </button>
          <button onClick={() => { setIsOpen(false); setIsMinimized(false); }} className="rounded p-1 hover:bg-primary-foreground/20 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-4 py-3">
        {messages.length === 0 && (
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Bot className="h-4 w-4" />
              </div>
              <div className="rounded-xl rounded-tl-sm bg-muted px-3 py-2 text-sm">
                ¡Hola! 👋 Soy tu asistente de entrenamiento con IA. Puedo ayudarte a revisar tu progreso, recomendarte cursos y resolver dudas sobre ventas. ¿En qué te puedo ayudar?
              </div>
            </div>

            <div className="space-y-2 pl-9">
              <p className="text-xs text-muted-foreground font-medium">Prueba preguntar:</p>
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="block w-full text-left rounded-lg border border-border px-3 py-2 text-xs text-foreground hover:bg-accent transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex items-start gap-2 mb-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
            <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
              msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"
            }`}>
              {msg.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
            </div>
            <div className={`rounded-xl px-3 py-2 text-sm max-w-[85%] ${
              msg.role === "user"
                ? "rounded-tr-sm bg-primary text-primary-foreground"
                : "rounded-tl-sm bg-muted"
            }`}>
              {msg.role === "assistant" ? (
                <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:m-0 [&>ul]:my-1 [&>ol]:my-1">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              ) : (
                msg.content
              )}
            </div>
          </div>
        ))}

        {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
          <div className="flex items-start gap-2 mb-3">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Bot className="h-4 w-4" />
            </div>
            <div className="rounded-xl rounded-tl-sm bg-muted px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <span className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
                <span className="text-xs text-muted-foreground">Pensando...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={scrollRef} />
      </ScrollArea>

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-border px-3 py-3">
        <Input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escribe tu pregunta..."
          disabled={isLoading}
          className="flex-1 text-sm"
        />
        <Button type="submit" size="icon" disabled={isLoading || !input.trim()} className="shrink-0">
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
};
