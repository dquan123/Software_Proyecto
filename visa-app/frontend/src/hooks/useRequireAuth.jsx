import { useState, useEffect } from "react";
import { buildApiUrl } from "../config/api";

export default function useRequireAuth() {
  const [isValidating, setIsValidating] = useState(true);
  const [session, setSession] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    const checkSession = async () => {
      const sessionRaw = localStorage.getItem("visaguide_session");

      if (!sessionRaw) {
        window.location.href = "/login";
        return;
      }

      try {
        const sessionData = JSON.parse(sessionRaw);

        const res = await fetch(
          `${buildApiUrl("/validar-sesion")}?correo=${encodeURIComponent(sessionData.correo)}`,
          { signal: controller.signal }
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
        if (err.name === "AbortError") return;
        console.error("Error validando sesión:", err);
        window.location.href = "/login";
        return;
      }

      setIsValidating(false);
    };

    checkSession();
    return () => controller.abort();
  }, []);

  return { isValidating, session };
}
