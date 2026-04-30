import { useState, useEffect } from "react";

export default function useModoSenior() {
  const [modoSenior, setModoSenior] = useState(() => {
    return localStorage.getItem("modoSenior") === "true";
  });

  useEffect(() => {
    // Escuchar cambios del toggle en el Sidebar
    const handleChange = (e) => {
      setModoSenior(e.detail);
    };

    window.addEventListener("modoSeniorChange", handleChange);

    // También escuchar cambios en localStorage (por si se cambia en otra pestaña)
    const handleStorage = () => {
      setModoSenior(localStorage.getItem("modoSenior") === "true");
    };

    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("modoSeniorChange", handleChange);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  return modoSenior;
}