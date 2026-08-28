# Estrategia de pruebas automatizadas

Proyecto: App de Apoyo y Orientacion para Solicitantes de Visa.

## 1. Alcance de las pruebas

La estrategia cubre pruebas unitarias y de componente para el frontend React/Vite, y pruebas HTTP automatizadas para endpoints reales del backend Express. El alcance implementado evita usar PostgreSQL, Cloudflare R2, buckets, credenciales o servicios externos reales.

En frontend se prueban:

- `frontend/src/config/api.js`
- `frontend/src/hooks/useRequireAuth.jsx`
- `frontend/src/hooks/useTheme.jsx`
- `frontend/src/pages/ProfileSelection/ProfileSelection.jsx`
- `frontend/src/components/QuestionBankModal.jsx`
- `frontend/src/components/QuestionBankCard.jsx`
- `frontend/src/components/DocumentCard.jsx`

En backend se prueban endpoints reales usando `backend/app.js` con Supertest:

- `GET /validar-sesion`
- `POST /register`
- `POST /login`
- `GET /questions`
- `POST /questions`
- `PUT /questions/:id`
- `DELETE /questions/:id`
- `GET /notificaciones/:userId`
- `PUT /notificaciones/:id/leer`
- `POST /interview-sessions`
- `PUT /interview-sessions/:id/feedback`

## 2. Elementos que no se probaran todavia

- Flujos end-to-end con navegador real.
- Conexion real a PostgreSQL.
- Upload real hacia Cloudflare R2.
- Validacion visual de estilos CSS.
- Grabacion real de audio con `MediaRecorder`.
- Autenticacion segura con tokens, porque el repositorio actual usa sesion en `localStorage` y validacion por correo.
- Pruebas de rendimiento.

## 3. Riesgos

- `backend/app.js` ejecuta migraciones ligeras y semillas al importarse; por eso el mock de `pg.Pool` debe cubrir consultas de inicializacion.
- Algunas pantallas usan `window.location.href`; en jsdom puede aparecer el aviso `Not implemented: navigation to another Document`.
- `frontend/src/pages/ds160.jsx` contiene validaciones internas no exportadas; probarlas de forma unitaria exigiria refactor adicional.
- El proyecto presenta textos con mojibake al inspeccionarse desde PowerShell; no se corrigieron para evitar modificar comportamiento.
- `npm install` reporto vulnerabilidades de auditoria: frontend 7 y backend 4. No se aplico `npm audit fix` porque podria cambiar versiones fuera del alcance.

## 4. Dependencias simuladas

- `fetch` en pruebas de frontend.
- `localStorage` y `sessionStorage` en pruebas de hooks y pantallas.
- `pg.Pool` en backend.
- Funciones de `backend/r2.js`.
- Uploads multipart con Supertest sin usar R2 real.

## 5. Criterios de seleccion

Los casos se priorizaron porque:

- Validan contratos reales visibles para el usuario.
- Cubren rutas criticas de autenticacion, registro, login, banco de preguntas, notificaciones y entrevista.
- No dependen de datos reales.
- Permiten mocks claros y mantenibles.
- Cubren casos positivos y negativos.
- Ejercen componentes usados directamente en el flujo de visa.

## 6. Matriz completa de pruebas

| ID | Capa | Archivo real | Funcion, componente o endpoint | Objetivo | Precondicion | Entrada | Accion | Resultado esperado | Tipo | Mock requerido | Prioridad |
|---|---|---|---|---|---|---|---|---|---|---|---|
| FE-01 | Frontend | `frontend/src/config/api.js` | `buildApiUrl` | Validar normalizacion de rutas y base URL | Variable `VITE_API_URL` simulada | `/login`, `login`, base con `/` final | Importar modulo y llamar funcion | URL sin doble slash y base normalizada | Unitaria | `vi.stubEnv` | Alta |
| FE-02 | Frontend | `frontend/src/hooks/useRequireAuth.jsx` | `useRequireAuth` | Mantener sesion valida | `localStorage` con sesion | `valid: true` | Renderizar hook | `isValidating=false` y sesion cargada | Hook | `fetch`, `localStorage` | Alta |
| FE-03 | Frontend | `frontend/src/hooks/useRequireAuth.jsx` | `useRequireAuth` | Limpiar sesion expirada | `localStorage` con sesion | `valid: false` | Renderizar hook | Sesion removida de storage | Hook | `fetch`, `localStorage` | Alta |
| FE-04 | Frontend | `frontend/src/hooks/useTheme.jsx` | `useTheme` | Alternar tema visual | `vg-theme=dark` | Click logico de toggle | Ejecutar `toggleTheme` | `data-theme=light`, storage actualizado | Hook | `localStorage` | Media |
| FE-05 | Frontend | `frontend/src/pages/ProfileSelection/ProfileSelection.jsx` | `ProfileSelection` | Guardar perfil seleccionado | Sesion local valida | Perfil `turismo_negocios` | Click en tarjeta y continuar | `POST /guardar-perfil`, storage actualizado | Componente | `fetch`, `localStorage` | Alta |
| FE-06 | Frontend | `frontend/src/components/QuestionBankModal.jsx` | `QuestionBankModal` | Crear pregunta desde formulario | Props reales requeridas | Pregunta, categoria, dificultad, requerido | Llenar y enviar | `onSubmit` recibe objeto correcto | Componente | Ninguno | Alta |
| FE-07 | Frontend | `frontend/src/components/QuestionBankCard.jsx` | `QuestionBankCard` | Validar acciones editar/eliminar | Pregunta realista | Click editar/eliminar | Ejecutar callbacks | Callback recibe pregunta completa | Componente | Ninguno | Media |
| FE-08 | Frontend | `frontend/src/pages/QuestionBank.jsx` | `QuestionBank` | Cargar banco y sesiones | Sesion valida | Respuesta `/questions` y `/interview-sessions` | Renderizar pantalla | Preguntas, estadisticas y filtros visibles | Componente | `fetch`, `localStorage` | Media |
| FE-09 | Frontend | `frontend/src/components/DocumentCard.jsx` | `DocumentCard` | Rechazar archivo incorrecto | Documento tipo PDF | Archivo PNG | Cambiar input file | Error de tipo y no llama `fetch` | Componente | `File`, `fetch` spy | Alta |
| FE-10 | Frontend | `frontend/src/pages/Notificaciones.jsx` | `Notificaciones` | Listar y marcar notificaciones | Sesion valida | Notificaciones simuladas | Click marcar leida | Estado `leido=true` y evento emitido | Componente | `fetch`, `localStorage` | Media |
| BE-01 | Backend | `backend/app.js` | `GET /validar-sesion` | Validar sesión con token existente | `pg.Pool` mockeado | `Authorization: Bearer <token>` | GET | `200`, `{ valid: true }` | HTTP | `pg.Pool` | Alta |
| BE-02 | Backend | `backend/app.js` | `GET /validar-sesion` | Rechazar sesión sin token válido | `pg.Pool` mockeado | Sin token o token inválido | GET | `401`, `{ valid: false }` | HTTP | `pg.Pool` | Alta |
| BE-03 | Backend | `backend/app.js` | `POST /register` | Registrar usuario | Insert simulado | nombre, correo, contrasena | POST | `200`, mensaje y usuario | HTTP | `pg.Pool` | Alta |
| BE-04 | Backend | `backend/app.js` | `POST /register` | Manejar error de BD | Error simulado | correo duplicado | POST | `500`, error simulado | HTTP | `pg.Pool` | Alta |
| BE-05 | Backend | `backend/app.js` | `POST /login` | Login correcto | Select simulado con fila | credenciales validas | POST | `200`, `Login exitoso` | HTTP | `pg.Pool` | Alta |
| BE-06 | Backend | `backend/app.js` | `POST /login` | Login incorrecto | Select simulado vacio | credenciales invalidas | POST | `401`, error | HTTP | `pg.Pool` | Alta |
| BE-07 | Backend | `backend/routes/questionBankRoutes.js` | `GET /questions` | Listar preguntas | Query simulada | Ninguna | GET | `200`, arreglo `questions` | HTTP | `pg.Pool` | Alta |
| BE-08 | Backend | `backend/routes/questionBankRoutes.js` | `POST /questions` | Crear pregunta | Insert simulado | pregunta valida | POST | `201`, pregunta creada | HTTP | `pg.Pool` | Alta |
| BE-09 | Backend | `backend/routes/questionBankRoutes.js` | `PUT /questions/:id` | Actualizar pregunta | Update simulado | id y body valido | PUT | `200`, pregunta actualizada | HTTP | `pg.Pool` | Media |
| BE-10 | Backend | `backend/routes/questionBankRoutes.js` | `DELETE /questions/:id` | Eliminar pregunta | Delete simulado | id valido | DELETE | `200`, mensaje | HTTP | `pg.Pool` | Media |
| BE-11 | Backend | `backend/routes/notificacionRoutes.js` | `GET /notificaciones/:userId` | Listar notificaciones | Select simulado | `userId=1` | GET | `200`, arreglo | HTTP | `pg.Pool` | Media |
| BE-12 | Backend | `backend/routes/notificacionRoutes.js` | `PUT /notificaciones/:id/leer` | Marcar como leida | Update simulado | `{ userId: 1 }` | PUT | `200`, `leido=true` | HTTP | `pg.Pool` | Media |
| BE-13 | Backend | `backend/routes/interviewSessionRoutes.js` | `POST /interview-sessions` | Crear sesion de entrevista | Insert simulado | multipart con `session` | POST | `201`, sesion pendiente | HTTP | `pg.Pool`, R2 mock | Alta |
| BE-14 | Backend | `backend/routes/interviewSessionRoutes.js` | `PUT /interview-sessions/:id/feedback` | Guardar feedback | Update simulado | feedback, rating | PUT | `200`, `status=reviewed` | HTTP | `pg.Pool` | Alta |
| BE-15 | Backend | `backend/app.js` | `POST /upload` | Subir archivo sin R2 real | R2 simulado | multipart file | POST | URL y documento simulados | HTTP | `pg.Pool`, R2 | Media |

## 7. Archivos modificados

- `frontend/package.json`
- `frontend/package-lock.json`
- `frontend/vite.config.js`
- `backend/package.json`
- `backend/package-lock.json`
- `backend/index.js`
- `backend/app.js`

## 8. Archivos creados

- `frontend/src/setupTests.js`
- `frontend/src/__tests__/api.test.js`
- `frontend/src/__tests__/useRequireAuth.test.jsx`
- `frontend/src/__tests__/useTheme.test.jsx`
- `frontend/src/__tests__/QuestionBankModal.test.jsx`
- `frontend/src/__tests__/QuestionBankCard.test.jsx`
- `frontend/src/__tests__/DocumentCard.test.jsx`
- `frontend/src/__tests__/ProfileSelection.test.jsx`
- `backend/jest.config.js`
- `backend/__tests__/app.test.js`

## 9. Comandos

Instalacion:

```bash
cd frontend
npm install

cd ../backend
npm install
```

Ejecucion:

```bash
cd frontend
npm run test:run
npm run test:coverage

cd ../backend
npm test
npm run test:coverage
```
