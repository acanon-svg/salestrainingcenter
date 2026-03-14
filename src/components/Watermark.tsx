import React from "react";

export const Watermark: React.FC = () => {
  return (
    <>
      {/* Marca de agua diagonal ultra sutil */}
      <div 
        className="fixed inset-0 pointer-events-none z-[5] overflow-hidden opacity-[0.018]"
        aria-hidden="true"
      >
        {[12, 40, 68, 96].map((top, i) => (
          <div
            key={i}
            className="absolute text-lg font-normal text-foreground whitespace-nowrap select-none tracking-[0.5em]"
            style={{
              transform: "rotate(-30deg)",
              top: `${top}%`,
              left: "-15%",
            }}
          >
            {"Creado por Alexandra Cañon   •   ".repeat(10)}
          </div>
        ))}
      </div>

      {/* Badge discreto esquina inferior */}
      <div 
        className="fixed bottom-2 right-3 pointer-events-none z-40 opacity-20 hover:opacity-30 transition-opacity"
        aria-hidden="true"
      >
        <span className="text-[10px] text-muted-foreground font-normal italic">
          by A. Cañon
        </span>
      </div>
    </>
  );
};
