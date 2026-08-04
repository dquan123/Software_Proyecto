# Bugs corregidos en RF-98

## Registro aceptaba correos incompletos

- **Problema:** el formulario permitía registrar direcciones como `usuario@dominio`.
- **Causa:** Registro solo comprobaba la presencia de `@`, mientras Login también exigía un punto.
- **Solución:** se unificó la validación básica para exigir contenido, `@` y `.` antes del envío.
- **Archivos:** `frontend/src/App.jsx`, `frontend/src/__tests__/Auth.test.jsx`.

## Dashboard mostraba etapas fuera del proceso

- **Problema:** un progreso negativo, no numérico o superior a 100 podía producir una etapa fuera del rango 1–6.
- **Causa:** el valor recibido se utilizaba directamente para calcular la etapa.
- **Solución:** se normaliza el progreso al rango 0–100 y la etapa al rango 1–6.
- **Archivos:** `frontend/src/pages/Dashboard.jsx`, `frontend/src/__tests__/Dashboard.test.jsx`.
