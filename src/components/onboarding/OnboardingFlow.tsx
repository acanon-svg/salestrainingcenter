import React, { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Rocket,
  BookOpen,
  Sparkles,
  BarChart3,
  CalendarCheck,
  GraduationCap,
  ArrowRight,
  ArrowLeft,
  Check,
  Target,
  TrendingUp,
  Calculator,
  MessageSquare,
  Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";

const ONBOARDING_KEY = "addi_onboarding_completed";

interface OnboardingStep {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  description: string;
  features: { icon: React.ReactNode; text: string }[];
  gradient: string;
  illustration: string;
}

const steps: OnboardingStep[] = [
  {
    icon: <Rocket className="h-8 w-8" />,
    title: "¡Bienvenido al Training Center!",
    subtitle: "Tu plataforma de entrenamiento comercial",
    description:
      "Esta es tu herramienta principal para crecer profesionalmente. Aquí encontrarás todo lo que necesitas para mejorar tus habilidades de venta, conocer nuestros productos y alcanzar tus metas.",
    features: [
      { icon: <GraduationCap className="h-4 w-4" />, text: "Cursos interactivos con quizzes y certificaciones" },
      { icon: <Target className="h-4 w-4" />, text: "Contenido personalizado para tu equipo y rol" },
      { icon: <TrendingUp className="h-4 w-4" />, text: "Seguimiento de tu progreso y crecimiento" },
    ],
    gradient: "from-primary to-blue-600",
    illustration: "🚀",
  },
  {
    icon: <BookOpen className="h-8 w-8" />,
    title: "Contenidos para tu día a día",
    subtitle: "Material de consulta y formación continua",
    description:
      "Accede a materiales de entrenamiento, guías de producto y recursos diseñados para resolver dudas en tiempo real durante tu jornada. Todo el conocimiento que necesitas, disponible cuando lo necesites.",
    features: [
      { icon: <BookOpen className="h-4 w-4" />, text: "Materiales de consulta rápida organizados por categoría" },
      { icon: <MessageSquare className="h-4 w-4" />, text: "Chatbot inteligente que responde tus dudas al instante" },
      { icon: <GraduationCap className="h-4 w-4" />, text: "Cursos con contenido práctico aplicable inmediatamente" },
    ],
    gradient: "from-emerald-500 to-teal-600",
    illustration: "📚",
  },
  {
    icon: <Sparkles className="h-8 w-8" />,
    title: "Inteligencia Artificial a tu servicio",
    subtitle: "IA que potencia tu aprendizaje",
    description:
      "La plataforma usa IA para personalizar tu experiencia: genera planes de entrenamiento adaptados a tus necesidades, identifica brechas de conocimiento y sugiere cursos de refuerzo automáticamente.",
    features: [
      { icon: <Sparkles className="h-4 w-4" />, text: "Plan de entrenamiento personalizado con IA" },
      { icon: <Zap className="h-4 w-4" />, text: "Andy, tu asistente IA para resolver dudas complejas" },
      { icon: <Target className="h-4 w-4" />, text: "Sugerencias inteligentes basadas en tu desempeño" },
    ],
    gradient: "from-violet-500 to-purple-600",
    illustration: "🤖",
  },
  {
    icon: <BarChart3 className="h-8 w-8" />,
    title: "Tus resultados e indicadores",
    subtitle: "Mide tu desempeño y calcula tus comisiones",
    description:
      "Consulta tus KPIs de desempeño comercial, revisa el cumplimiento de metas y utiliza la calculadora de comisiones para proyectar tus ingresos. Todo en un solo lugar para que tengas claridad total.",
    features: [
      { icon: <BarChart3 className="h-4 w-4" />, text: "Dashboard con indicadores clave de rendimiento (KPIs)" },
      { icon: <Calculator className="h-4 w-4" />, text: "Calculadora de comisiones con metas personalizadas" },
      { icon: <TrendingUp className="h-4 w-4" />, text: "Seguimientos de calidad y acompañamientos de campo" },
    ],
    gradient: "from-orange-500 to-amber-600",
    illustration: "📊",
  },
  {
    icon: <CalendarCheck className="h-8 w-8" />,
    title: "Tu herramienta del día a día",
    subtitle: "Haz del Training Center un hábito",
    description:
      "Esta plataforma está diseñada para acompañarte todos los días. Revisa tus cursos pendientes, consulta materiales antes de una reunión, verifica tus metas y gana puntos por cada logro. ¡Tu crecimiento comienza hoy!",
    features: [
      { icon: <CalendarCheck className="h-4 w-4" />, text: "Revisa tu dashboard cada mañana para ver pendientes" },
      { icon: <Target className="h-4 w-4" />, text: "Completa cursos y quizzes para ganar puntos y badges" },
      { icon: <TrendingUp className="h-4 w-4" />, text: "Compite en el ranking y sube de nivel constantemente" },
    ],
    gradient: "from-pink-500 to-rose-600",
    illustration: "🏆",
  },
  {
    icon: <Check className="h-8 w-8" />,
    title: "¡Estás listo para comenzar!",
    subtitle: "Tu camino de crecimiento empieza ahora",
    description:
      "Ya conoces las herramientas principales de la plataforma. Explora a tu ritmo, completa cursos, consulta materiales y no olvides revisar tu plan de entrenamiento personalizado. ¡Éxito! 💪",
    features: [
      { icon: <Rocket className="h-4 w-4" />, text: "Explora el catálogo de cursos disponibles" },
      { icon: <Sparkles className="h-4 w-4" />, text: "Genera tu plan de entrenamiento con IA" },
      { icon: <BarChart3 className="h-4 w-4" />, text: "Revisa tu dashboard y empieza a crecer" },
    ],
    gradient: "from-primary to-cyan-500",
    illustration: "🎉",
  },
];

export const OnboardingFlow: React.FC = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (!user) return;
    const key = `${ONBOARDING_KEY}_${user.id}`;
    const completed = localStorage.getItem(key);
    if (!completed) {
      // Small delay so dashboard renders first
      const timer = setTimeout(() => setOpen(true), 800);
      return () => clearTimeout(timer);
    }
  }, [user]);

  const handleComplete = () => {
    if (!user) return;
    localStorage.setItem(`${ONBOARDING_KEY}_${user.id}`, "true");
    setOpen(false);
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

  const handleSkip = () => {
    handleComplete();
  };

  const step = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleSkip(); }}>
      <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden border-none shadow-2xl [&>button]:hidden">
        {/* Header gradient */}
        <div className={`relative bg-gradient-to-br ${step.gradient} p-6 pb-10 text-white`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-medium">
              Paso {currentStep + 1} de {steps.length}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-white/70 hover:text-white hover:bg-white/10 text-xs"
              onClick={handleSkip}
            >
              Omitir
            </Button>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-2.5">
                  {step.icon}
                </div>
                <div className="text-5xl">{step.illustration}</div>
              </div>
              <h2 className="text-xl font-bold mt-3">{step.title}</h2>
              <p className="text-sm text-white/80 mt-1">{step.subtitle}</p>
            </motion.div>
          </AnimatePresence>

          {/* Progress bar */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
            <motion.div
              className="h-full bg-white/80 rounded-r-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25, delay: 0.05 }}
            >
              <p className="text-sm text-muted-foreground leading-relaxed mb-5">
                {step.description}
              </p>

              <div className="space-y-3">
                {step.features.map((feature, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + i * 0.08 }}
                    className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-border/50"
                  >
                    <div className={`mt-0.5 bg-gradient-to-br ${step.gradient} text-white rounded-md p-1.5 shrink-0`}>
                      {feature.icon}
                    </div>
                    <span className="text-sm text-foreground">{feature.text}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Step indicators */}
          <div className="flex items-center justify-center gap-1.5 mt-6 mb-4">
            {steps.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentStep(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === currentStep
                    ? "w-6 bg-primary"
                    : i < currentStep
                    ? "w-1.5 bg-primary/40"
                    : "w-1.5 bg-border"
                }`}
              />
            ))}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrev}
              disabled={currentStep === 0}
              className="gap-1.5"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Anterior
            </Button>

            <Button
              size="sm"
              onClick={handleNext}
              className={`gap-1.5 bg-gradient-to-r ${step.gradient} text-white border-none hover:opacity-90`}
            >
              {currentStep === steps.length - 1 ? (
                <>
                  ¡Comenzar!
                  <Check className="h-3.5 w-3.5" />
                </>
              ) : (
                <>
                  Siguiente
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
