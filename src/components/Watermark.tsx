import React from "react";

export const Watermark: React.FC = () => {
  return (
    <>
      {/* Marca de agua sutil en el fondo - versión diagonal */}
      <div 
        className="fixed inset-0 pointer-events-none z-[5] overflow-hidden opacity-[0.03]"
        aria-hidden="true"
      >
        <div 
          className="absolute text-2xl font-semibold text-foreground whitespace-nowrap select-none"
          style={{
            transform: "rotate(-45deg)",
            top: "10%",
            left: "-10%",
          }}
        >
          Creado por Alexandra Cañon • Creado por Alexandra Cañon • Creado por Alexandra Cañon • Creado por Alexandra Cañon • Creado por Alexandra Cañon • Creado por Alexandra Cañon • Creado por Alexandra Cañon • Creado por Alexandra Cañon • 
        </div>
        <div 
          className="absolute text-2xl font-semibold text-foreground whitespace-nowrap select-none"
          style={{
            transform: "rotate(-45deg)",
            top: "35%",
            left: "-20%",
          }}
        >
          Creado por Alexandra Cañon • Creado por Alexandra Cañon • Creado por Alexandra Cañon • Creado por Alexandra Cañon • Creado por Alexandra Cañon • Creado por Alexandra Cañon • Creado por Alexandra Cañon • Creado por Alexandra Cañon • 
        </div>
        <div 
          className="absolute text-2xl font-semibold text-foreground whitespace-nowrap select-none"
          style={{
            transform: "rotate(-45deg)",
            top: "60%",
            left: "-30%",
          }}
        >
          Creado por Alexandra Cañon • Creado por Alexandra Cañon • Creado por Alexandra Cañon • Creado por Alexandra Cañon • Creado por Alexandra Cañon • Creado por Alexandra Cañon • Creado por Alexandra Cañon • Creado por Alexandra Cañon • 
        </div>
        <div 
          className="absolute text-2xl font-semibold text-foreground whitespace-nowrap select-none"
          style={{
            transform: "rotate(-45deg)",
            top: "85%",
            left: "-15%",
          }}
        >
          Creado por Alexandra Cañon • Creado por Alexandra Cañon • Creado por Alexandra Cañon • Creado por Alexandra Cañon • Creado por Alexandra Cañon • Creado por Alexandra Cañon • Creado por Alexandra Cañon • Creado por Alexandra Cañon • 
        </div>
      </div>

      {/* Marca de agua sutil en la esquina inferior derecha */}
      <div 
        className="fixed bottom-4 right-4 pointer-events-none z-50 opacity-40"
        aria-hidden="true"
      >
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/80 backdrop-blur-sm border border-border/50">
          <span className="text-xs font-medium text-muted-foreground">
            Created by Alexandra Cañon
          </span>
        </div>
      </div>
    </>
  );
};
