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
    </>
  );
};
