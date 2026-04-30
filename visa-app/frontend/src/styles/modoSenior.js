// Multiplicador de tamaño para Modo Senior
export const SENIOR_SCALE = 1.25;

// Función para obtener el tamaño de fuente ajustado
export const getFontSize = (baseSize, isSenior) => {
  const size = parseInt(baseSize);
  return isSenior ? `${Math.round(size * SENIOR_SCALE)}px` : `${size}px`;
};

// Estilos base que se pueden aplicar globalmente
export const seniorStyles = {
  // Textos pequeños (12-13px -> 15-16px)
  smallText: (isSenior) => ({
    fontSize: isSenior ? "16px" : "13px",
  }),

  // Textos normales (14-15px -> 18-19px)
  normalText: (isSenior) => ({
    fontSize: isSenior ? "19px" : "15px",
  }),

  // Títulos pequeños (18-20px -> 24-25px)
  smallTitle: (isSenior) => ({
    fontSize: isSenior ? "25px" : "20px",
  }),

  // Títulos grandes (24-28px -> 32-35px)
  largeTitle: (isSenior) => ({
    fontSize: isSenior ? "35px" : "28px",
  }),

  // Botones
  button: (isSenior) => ({
    fontSize: isSenior ? "18px" : "15px",
    padding: isSenior ? "16px 20px" : "14px 16px",
  }),

  // Labels de formulario
  label: (isSenior) => ({
    fontSize: isSenior ? "14px" : "11px",
  }),

  // Inputs
  input: (isSenior) => ({
    fontSize: isSenior ? "18px" : "15px",
    padding: isSenior ? "16px 18px" : "13px 16px",
  }),
};