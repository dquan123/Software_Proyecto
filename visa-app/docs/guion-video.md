# Guion de video: 8 a 10 minutos

| Minuto | Persona sugerida | Pantalla | Archivo | Comando | Explicacion literal | Resultado esperado |
|---|---|---|---|---|---|---|
| 0:00-0:40 | Diego Quan | Portada o README | `docs/documento-academico.md` | Ninguno | "Somos el equipo del proyecto App de Apoyo y Orientacion para Solicitantes de Visa. En este video mostraremos la implementacion y ejecucion de pruebas automatizadas para frontend y backend." | Contexto inicial |
| 0:40-1:20 | Diego Sebastian Guevara | Explorador de archivos | `frontend/package.json`, `backend/package.json` | Ninguno | "El frontend usa React con Vite, por eso seleccionamos Vitest y React Testing Library. El backend usa Node.js con Express y CommonJS, por eso usamos Jest y Supertest." | Herramientas claras |
| 1:20-2:00 | Juan Francisco Orozco | Estructura frontend | `frontend/src/__tests__` | Ninguno | "Las pruebas de frontend se ubicaron en una carpeta `__tests__` para centralizar la suite sin modificar componentes reales." | Carpeta visible |
| 2:00-2:40 | Juan Francisco Orozco | Editor | `frontend/src/__tests__/api.test.js` | Ninguno | "Esta prueba valida `buildApiUrl`, una utilidad real usada para construir URLs del backend." | Codigo visible |
| 2:40-3:20 | Juan Francisco Orozco | Editor | `frontend/src/__tests__/ProfileSelection.test.jsx` | Ninguno | "Esta prueba simula una sesion valida, selecciona el perfil Turismo / Negocios y verifica el envio a `/guardar-perfil`." | Prueba visible |
| 3:20-3:50 | Norman Aguirre | Terminal frontend | N/A | `npm run test:run` | "Ejecutamos la suite de frontend. No se usa backend real; las llamadas HTTP se simulan con mocks de fetch." | 12 pruebas aprobadas |
| 3:50-4:30 | Diego Quan | Estructura backend | `backend/app.js`, `backend/index.js` | Ninguno | "Para probar Express con Supertest se hizo un refactor minimo: `app.js` exporta la app y `index.js` solo ejecuta `listen`." | Refactor visible |
| 4:30-5:10 | Diego Quan | Editor | `backend/__tests__/app.test.js` | Ninguno | "Aqui se mockea `pg.Pool`, de forma que ninguna prueba usa PostgreSQL real. El mock responde segun la consulta SQL." | Mock visible |
| 5:10-5:50 | Diego Quan | Editor | `backend/__tests__/app.test.js` | Ninguno | "Tambien mockeamos R2 para evitar credenciales, buckets o archivos reales." | Mock R2 visible |
| 5:50-6:20 | Diego Sebastian Guevara | Terminal backend | N/A | `npm test` | "Ejecutamos la suite backend. Supertest envia requests a `app` sin abrir un puerto." | 14 pruebas aprobadas |
| 6:20-7:00 | Diego Sebastian Guevara | Editor frontend | `frontend/src/__tests__/QuestionBankCard.test.jsx` | Ninguno | "Ahora provocaremos una falla intencional cambiando temporalmente una expectativa, por ejemplo `Editar` por `Editar pregunta`." | Cambio temporal |
| 7:00-7:25 | Diego Sebastian Guevara | Terminal frontend | N/A | `npm run test:run` | "La prueba falla porque el texto esperado no coincide con el boton real. Este mensaje ayuda a detectar desalineacion entre prueba e interfaz." | Falla intencional |
| 7:25-7:50 | Diego Sebastian Guevara | Editor frontend | `frontend/src/__tests__/QuestionBankCard.test.jsx` | Ninguno | "Corregimos la expectativa para que vuelva a coincidir con el texto real del componente." | Prueba corregida |
| 7:50-8:20 | Norman Aguirre | Terminal frontend | N/A | `npm run test:run` | "Ejecutamos de nuevo y confirmamos que la suite vuelve a quedar exitosa." | 12 aprobadas |
| 8:20-9:00 | Norman Aguirre | Terminales | N/A | `npm run test:coverage` | "Finalmente ejecutamos cobertura en frontend y backend para obtener porcentajes de statements, branches, functions y lines." | Reportes visibles |
| 9:00-9:40 | Todos | Documento o diapositiva final | `docs/documento-academico.md` | Ninguno | "Concluimos que Vitest, React Testing Library, Jest y Supertest se integran correctamente con la arquitectura real del proyecto." | Cierre |

Nota: despues de provocar la falla intencional, se debe deshacer el cambio para dejar el repositorio con pruebas aprobadas.
