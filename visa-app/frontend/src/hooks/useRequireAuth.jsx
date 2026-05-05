import { useState, useEffect } from "react";
import { buildApiUrl } from "../config/api";

export default function useRequireAuth() {
  const [isValidating, setIsValidating] = useState(true);
  const [session, setSession] = useState(null);

  useEffect(() => {
    const checkSession = async () => {
      const sessionRaw = localStorage.getItem("visaguide_session");
      
      if (!sessionRaw) {
        window.location.href = "/login";
        return;
      }

      try {
        const sessionData = JSON.parse(sessionRaw);
        
        const res = await fetch(
          `${buildApiUrl("/validar-sesion")}?correo=${encodeURIComponent(sessionData.correo)}`
        );
        const data = await res.json();

        if (!data.valid) {
          localStorage.removeItem("visaguide_session");
          localStorage.removeItem("correoUsuario");
          localStorage.removeItem("perfilUsuario");
          window.location.href = "/login";
          return;
        }

        setSession(sessionData);
      } catch (err) {
        console.error("Error validando sesión:", err);
        window.location.href = "/login";
        return;
      }

      setIsValidating(false);
    };

    checkSession();
  }, []);

  return { isValidating, session };
}