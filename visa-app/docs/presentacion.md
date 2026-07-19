# Presentacion: Tarea 3 - Pruebas Automatizadas

## Diapositiva 1. Portada

Texto visible: Tarea 3: Pruebas Automatizadas. App de Apoyo y Orientacion para Solicitantes de Visa. UVG, CC3091, Semestre II 2026.  
Visual sugerido: portada sobria con diagrama simple frontend-backend-BD.  
Captura requerida: no aplica.  
Notas: presentar equipo y objetivo.  
Tiempo: 30 s.

## Diapositiva 2. Problema y descripcion del proyecto

Texto visible: Orientacion para solicitantes de visa; gestion de perfil, DS-160, documentos, entrevista y notificaciones.  
Visual sugerido: flujo de usuario.  
Captura requerida: [INSERTAR CAPTURA REAL DE LA APP].  
Notas: explicar valor del sistema.  
Tiempo: 35 s.

## Diapositiva 3. Arquitectura tecnologica

Texto visible: React + Vite, Express + Node.js, PostgreSQL, multer, R2, Docker Compose.  
Visual sugerido: arquitectura cliente-servidor.  
Captura requerida: [INSERTAR CAPTURA REAL DE `docker-compose.yml`].  
Notas: destacar archivos reales.  
Tiempo: 40 s.

## Diapositiva 4. Importancia de las pruebas automatizadas

Texto visible: reducen regresiones, validan contratos, protegen flujos criticos, permiten cambios seguros.  
Visual sugerido: piramide de pruebas.  
Captura requerida: no aplica.  
Notas: relacionar con solicitudes de visa.  
Tiempo: 35 s.

## Diapositiva 5. Tipos de pruebas

Texto visible: unitarias, componente, integracion HTTP, E2E.  
Visual sugerido: tabla breve.  
Captura requerida: no aplica.  
Notas: aclarar que E2E queda recomendado.  
Tiempo: 35 s.

## Diapositiva 6. Herramientas investigadas para frontend

Texto visible: Vitest, Jest, React Testing Library, Cypress, Playwright.  
Visual sugerido: tarjetas comparativas.  
Captura requerida: [INSERTAR CAPTURA REAL DE `frontend/package.json`].  
Notas: Cypress/Playwright no son puramente unitarias.  
Tiempo: 40 s.

## Diapositiva 7. Herramientas investigadas para backend

Texto visible: Jest, Vitest, Mocha, Chai, Supertest, Node Test Runner, Sinon.  
Visual sugerido: matriz de compatibilidad.  
Captura requerida: [INSERTAR CAPTURA REAL DE `backend/package.json`].  
Notas: explicar CommonJS.  
Tiempo: 40 s.

## Diapositiva 8. Comparacion

Texto visible: criterios: compatibilidad, comunidad, mocks, cobertura, mantenimiento.  
Visual sugerido: tabla resumida.  
Captura requerida: [INSERTAR CAPTURA REAL DE MATRIZ EN DOCUMENTO].  
Notas: mostrar por que se descartan alternativas para esta etapa.  
Tiempo: 45 s.

## Diapositiva 9. Herramientas seleccionadas

Texto visible: Frontend: Vitest + RTL. Backend: Jest + Supertest.  
Visual sugerido: dos columnas.  
Captura requerida: no aplica.  
Notas: destacar razones tecnicas.  
Tiempo: 35 s.

## Diapositiva 10. Arquitectura de pruebas

Texto visible: `frontend/src/__tests__`, `backend/__tests__`, mocks de fetch, localStorage, pg y R2.  
Visual sugerido: arbol de carpetas.  
Captura requerida: [INSERTAR CAPTURA REAL DE ESTRUCTURA].  
Notas: explicar aislamiento.  
Tiempo: 45 s.

## Diapositiva 11. Configuracion de frontend

Texto visible: jsdom, globals, setupFiles, coverage V8.  
Visual sugerido: fragmento de `vite.config.js`.  
Captura requerida: [INSERTAR CAPTURA REAL DEL CODIGO].  
Notas: indicar scripts.  
Tiempo: 40 s.

## Diapositiva 12. Pruebas de frontend

Texto visible: 12 pruebas: API, auth, theme, perfil, modal, card, documentos.  
Visual sugerido: lista de casos FE.  
Captura requerida: [INSERTAR CAPTURA REAL DE PRUEBAS FRONTEND].  
Notas: abrir dos pruebas representativas.  
Tiempo: 50 s.

## Diapositiva 13. Resultados de frontend

Texto visible: 7 archivos, 12 pruebas, 12 aprobadas, 0 fallidas, 3.08 s. Cobertura: 65.95/48.40/75.29/68.91.  
Visual sugerido: mini dashboard.  
Captura requerida: [INSERTAR CAPTURA REAL DE LA TERMINAL].  
Notas: mencionar aviso jsdom.  
Tiempo: 35 s.

## Diapositiva 14. Configuracion de backend

Texto visible: `app.js` exporta app; `index.js` ejecuta listen; Jest + Supertest.  
Visual sugerido: antes/despues.  
Captura requerida: [INSERTAR CAPTURA REAL DE `backend/app.js` Y `backend/index.js`].  
Notas: refactor minimo sin cambiar endpoints.  
Tiempo: 45 s.

## Diapositiva 15. Pruebas de backend

Texto visible: 14 pruebas sobre endpoints reales con mocks de `pg.Pool` y R2.  
Visual sugerido: tabla endpoint-resultado.  
Captura requerida: [INSERTAR CAPTURA REAL DE `backend/__tests__/app.test.js`].  
Notas: explicar Supertest sin puerto.  
Tiempo: 50 s.

## Diapositiva 16. Resultados y cobertura

Texto visible: Backend: 14/14 aprobadas, 1.225 s. Cobertura: 36.81/20.75/50.00/37.55.  
Visual sugerido: barras de cobertura.  
Captura requerida: [INSERTAR CAPTURA REAL DE COBERTURA].  
Notas: cobertura baja por `app.js` grande.  
Tiempo: 40 s.

## Diapositiva 17. Ventajas, desventajas y experiencia

Texto visible: ventajas: rapidez, aislamiento, mocks; desventajas: navegacion jsdom, cobertura pendiente, app centralizado.  
Visual sugerido: balance.  
Captura requerida: no aplica.  
Notas: mencionar aprendizaje tecnico.  
Tiempo: 45 s.

## Diapositiva 18. Conclusiones y referencias

Texto visible: herramientas adecuadas, pruebas reales implementadas, base para CI y E2E.  
Visual sugerido: cierre con referencias.  
Captura requerida: no aplica.  
Notas: cerrar con recomendaciones.  
Tiempo: 45 s.
