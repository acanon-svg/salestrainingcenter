import React, { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Rocket,
  BookOpen,
  Sparkles,
  BarChart3,
  ArrowRight,
  ArrowLeft,
  Check,
  Target,
  TrendingUp,
  Calculator,
  MessageSquare,
  Zap,
  GraduationCap,
  CalendarCheck,
  Trophy,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const ONBOARDING_KEY = "addi_onboarding_completed";

interface OnboardingStep {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  bullets: { icon: React.ReactNode; title: string; desc: string }[];
  gradient: string;
  emoji: string;
}

const steps: OnboardingStep[] = [
  {
    icon: <Rocket className="h-7 w-7" />,
    title: "Tu plataforma de crecimiento",
    subtitle: "Todo lo que necesitas para ser el mejor en tu rol, en un solo lugar.",
    bullets: [
      { icon: <GraduationCap className="h-4 w-4" />, title: "Cursos y materiales", desc: "Contenido práctico organizado por tema para consultar en cualquier momento del día." },
      { icon: <Target className="h-4 w-4" />, title: "Personalizado para ti", desc: "El contenido se adapta a tu equipo, rol y necesidades específicas." },
      { icon: <Trophy className="h-4 w-4" />, title: "Gamificación", desc: "Gana puntos, badges y compite en el ranking completando cursos y quizzes." },
    ],
    gradient: "from-primary to-blue-600",
    emoji: "🚀",
  },
  {
    icon: <Sparkles className="h-7 w-7" />,
    title: "IA + Resultados a tu alcance",
    subtitle: "Inteligencia artificial que te guía y métricas claras para medir tu impacto.",
    bullets: [
      { icon: <Zap className="h-4 w-4" />, title: "Andy, tu asistente IA", desc: "Resuelve dudas, genera planes de entrenamiento y sugiere cursos de refuerzo." },
      { icon: <BarChart3 className="h-4 w-4" />, title: "KPIs y seguimientos", desc: "Consulta tus indicadores de desempeño, calidad y acompañamientos de campo." },
      { icon: <Calculator className="h-4 w-4" />, title: "Calculadora de comisiones", desc: "Proyecta tus ingresos con metas personalizadas y aceleradores." },
    ],
    gradient: "from-violet-500 to-purple-600",
    emoji: "🤖",
  },
  {
    icon: <CalendarCheck className="h-7 w-7" />,
    title: "Úsalo todos los días",
    subtitle: "El Training Center está diseñado para acompañarte en cada momento de tu jornada.",
    bullets: [
      { icon: <BookOpen className="h-4 w-4" />, title: "Antes de una reunión", desc: "Consulta materiales y guías de producto para llegar preparado." },
      { icon: <MessageSquare className="h-4 w-4" />, title: "Cuando tengas una duda", desc: "Pregúntale a Andy o busca en el catálogo de materiales." },
      { icon: <TrendingUp className="h-4 w-4" />, title: "Al final del día", desc: "Revisa tu progreso, completa un curso pendiente y sigue subiendo de nivel." },
    ],
    gradient: "from-orange-500 to-amber-600",
    emoji: "📆",
  },
  {
    icon: <Check className="h-7 w-7" />,
    title: "¿Por dónde empezar?",
    subtitle: "Te sugerimos estos primeros pasos para sacarle el máximo provecho:",
    bullets: [
      { icon: <GraduationCap className="h-4 w-4" />, title: "1. Explora tus cursos", desc: "Ve a Cursos y empieza con el que más te interese o el que tengas asignado." },
      { icon: <Sparkles className="h-4 w-4" />, title: "2. Genera tu plan IA", desc: "Abre 'Mi Plan IA' en el menú y obtén una hoja de ruta personalizada." },
      { icon: <BarChart3 className="h-4 w-4" />, title: "3. Revisa tu dashboard", desc: "Tu dashboard muestra pendientes, progreso y logros. Consúltalo cada mañana." },
    ],
    gradient: "from-emerald-500 to-teal-600",
    emoji: "🎯",
  },
];

export const OnboardingFlow: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (!user) return;
    const key = `${ONBOARDING_KEY}_${user.id}`;
    const completed = localStorage.getItem(key);
    if (!completed) {
      const timer = setTimeout(() => setOpen(true), 600);
      return () => clearTimeout(timer);
    }
  }, [user]);

  const handleComplete = (navigateTo?: string) => {
    if (!user) return;
    localStorage.setItem(`${ONBOARDING_KEY}_${user.id}`, "true");
    setOpen(false);
    if (navigateTo) navigate(navigateTo);
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  };

  const step = steps[currentStep];
  const isLast = currentStep === steps.length - 1;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleComplete(); }}>
      <DialogContent className="max-w-md p-0 gap-0 overflow-hidden border-none shadow-2xl [&>button]:hidden">
        {/* Header */}
        <div className={`relative bg-gradient-to-br ${step.gradient} p-5 pb-8 text-white`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm rounded-full px-2.5 py-0.5 text-xs font-medium">
              {currentStep + 1} / {steps.length}
            </div>
            {!isLast && (
              <Button
                variant="ghost"
                size="sm"
                className="text-white/60 hover:text-white hover:bg-white/10 text-xs h-7"
                onClick={() => handleComplete()}
              >
                Omitir
              </Button>
            )}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              transition={{ duration: 0.2 }}
              className="flex items-start gap-3"
            >
              <div className="text-4xl mt-0.5">{step.emoji}</div>
              <div>
                <h2 className="text-lg font-bold leading-tight">{step.title}</h2>
                <p className="text-xs text-white/80 mt-1 leading-relaxed">{step.subtitle}</p>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Progress */}
          <div className="absolute bottom-0 left-0 right-0 flex gap-1 px-5 -mb-0.5">
            {steps.map((_, i) => (
              <div key={i} className="flex-1 h-1 rounded-full overflow-hidden bg-white/20">
                <motion.div
                  className="h-full bg-white/90 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: i <= currentStep ? "100%" : "0%" }}
                  transition={{ duration: 0.3, delay: i === currentStep ? 0.1 : 0 }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="p-5">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-2.5"
            >
              {step.bullets.map((b, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 + i * 0.07 }}
                  className="flex items-start gap-3 p-2.5 rounded-lg bg-muted/50 border border-border/40"
                >
                  <div className={`mt-0.5 bg-gradient-to-br ${step.gradient} text-white rounded-md p-1.5 shrink-0`}>
                    {b.icon}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground leading-tight">{b.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{b.desc}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between gap-3 mt-5">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrev}
              disabled={currentStep === 0}
              className="gap-1"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Anterior
            </Button>

            {isLast ? (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleComplete("/courses")}
                  className="gap-1 text-xs"
                >
                  <GraduationCap className="h-3.5 w-3.5" />
                  Ir a Cursos
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleComplete()}
                  className={`gap-1 bg-gradient-to-r ${step.gradient} text-white border-none hover:opacity-90`}
                >
                  ¡Entendido!
                  <Check className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : (
              <Button
                size="sm"
                onClick={handleNext}
                className={`gap-1 bg-gradient-to-r ${step.gradient} text-white border-none hover:opacity-90`}
              >
                Siguiente
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
