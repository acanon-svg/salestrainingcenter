import React from "react";
import { Sparkles } from "lucide-react";
import addiTrainingLogo from "@/assets/addi-training-logo.svg";

const Index = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center max-w-md px-4">
        <img 
          src={addiTrainingLogo} 
          alt="Addi Training Center" 
          className="h-16 w-auto mx-auto mb-6"
        />
        <h1 className="mb-4 text-4xl font-bold text-foreground">
          Addi Training Center
        </h1>
        <p className="text-xl text-muted-foreground mb-2">
          Plataforma de entrenamiento y desarrollo
        </p>
        <div className="flex items-center justify-center gap-2 text-sm text-primary mb-8">
          <Sparkles className="h-4 w-4" />
          <span>Impulsado por IA</span>
        </div>
        
        {/* Footer con créditos */}
        <footer className="mt-12 pt-6 border-t border-border/50">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Addi Training Center
          </p>
          <p className="text-sm font-medium text-primary mt-1">
            Todos los derechos reservados - Creado por Alexandra Cañon 💙
          </p>
        </footer>
      </div>
    </div>
  );
};

export default Index;
