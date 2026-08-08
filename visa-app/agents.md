# agents.md

Guia de trabajo para devs y agentes de IA que colaboren en VisaGuide.

## Contexto del producto

VisaGuide es una aplicacion web para acompanar procesos de visa estadounidense. El flujo principal cubre registro/login, seleccion de perfil de visa, dashboard del tramite, formulario DS-160, cronologia, gestion de documentos, preparacion de entrevista, banco de preguntas, retroalimentacion y notificaciones.

El proyecto esta organizado como una app full-stack JavaScript:

- Frontend: React 19 + Vite, en `frontend/`.
- Backend: Node.js + Express 5 + PostgreSQL, en `backend/`.
- Base de datos local/contenedores: PostgreSQL 15 con `init.sql`.
- Archivos/documentos/audio: abstraccion `storage.js`, Cloudflare R2 en produccion y fallback local en desarrollo/test.
- Pruebas: Vitest/Testing Library para frontend, Jest/Supertest para backend.
- Documentacion academica y entregables: `docs/`.

## Estructura importante

```text
visa-app/
  backend/
    app.js                         # Express app, pool de Postgres, endpoints legacy y montaje de rutas
    index.js                       # Arranque del servidor
    r2.js                          # Cliente Cloudflare R2/S3 y helpers de upload/delete
    storage.js                     # Abstraccion de storage: R2 o fallback local
    upload.js                      # Multer memoryStorage
    routes/                        # Rutas modulares por dominio
    controllers/                   # Controladores HTTP modulares
    services/                      # Logica de dominio y SQL modular
    __tests__/                     # Pruebas Jest/Supertest
    coverage/                      # Artefacto generado, no editar
  frontend/
    src/
      App.jsx                      # Router principal, lazy routes, login y registro
      assets/                      # Imagenes estaticas de la app
      config/api.js                # buildApiUrl y VITE_API_URL
      components/                  # UI compartida
      components/auth/             # Layout y CSS de autenticacion
      hooks/                       # useRequireAuth, useTheme, useModoSenior
      pages/                       # Pantallas principales
      styles/                      # CSS por area
      __tests__/                   # Pruebas Vitest/Testing Library
    coverage/                      # Artefacto generado, no editar
    vite.config.js                 # Vite + Vitest
  docs/                            # Entregables, guiones, estrategia de pruebas
  tools/                           # Scripts para generar documentos academicos/PDF
  init.sql                         # Esquema y seed inicial para Postgres
  docker-compose.yml               # backend + frontend + db
  .env.example                     # Variables esperadas
```

Evita modificar `backend/coverage/`, `frontend/coverage/` y `docs/entregables/` salvo que el usuario pida regenerar entregables.

## Sprint 6 - Administracion de Documentos

Estado actual antes de SCRUM-127:

- SCRUM-125 (`DocumentsListAdmin`) dejo implementada la pantalla `/admin/documents` para administradores, reutilizando `AdminLayout`, Sidebar y Header del panel admin.
- SCRUM-125 agrego listado administrativo con `GET /admin/documents`, protegido por `requireAdmin`, para listar documentos de todos los usuarios con datos del solicitante.
- SCRUM-126 (`DocumentsReviewAdmin`) agrego acciones en la tabla: `Ver documento`, `Aprobar` y `Rechazar`.
- SCRUM-126 agrego `PUT /admin/documents/:id/status`, protegido por `requireAdmin`, para actualizar estados a `approved` o `correction`.
- El cliente usa `GET /documentos/:usuarioId` para ver sus documentos. Los estados `rejected` legados se presentan como `correction` para que el cliente muestre "Requiere Correccion".
- El backend ya tiene `GET /documentos/:id/archivo` para servir archivos desde `storage_key` o redirigir a `archivo_url` externo.
- Los documentos se almacenan en la tabla `documentos` con `archivo_url`, `storage_key`, `estado`, `feedback`, `creado_en` y `actualizado_en`.
- En desarrollo/test, `storage.js` usa fallback local y sirve archivos mediante `/local-files`; en produccion usa R2 cuando esta configurado.

Al implementar SCRUM-127 en `DocumentsCommentsAdmin`:

- No crear pantalla nueva; extender solo `frontend/src/pages/admin/AdminDocuments.jsx`.
- Reutilizar `GET /documentos/:id/archivo` para visualizar documentos; no crear rutas duplicadas para archivos.
- Reutilizar la columna `feedback` existente para observaciones del administrador.
- Reutilizar `PUT /admin/documents/:id/status` para persistir observaciones administrativas; acepta `feedback` sin cambiar estado.
- Presentar observaciones desde una accion dedicada en la tabla, idealmente con modal o panel, evitando textareas permanentes por fila.
- Mantener los cambios en la rama `DocumentsCommentsAdmin`; no hacer merge, rebase ni push.

Estado posterior a SCRUM-127 (`DocumentsCommentsAdmin`):

- Rama de trabajo: `DocumentsCommentsAdmin`.
- Ruta frontend afectada: `/admin/documents`.
- Pantalla afectada: `frontend/src/pages/admin/AdminDocuments.jsx`, dentro de `AdminLayout`.
- Componentes reutilizados: `AdminLayout`, Sidebar/Header administrativo, tabla y estilos de `frontend/src/styles/admin.css`, botones con iconos `lucide-react`.
- Visualizacion de documentos: el boton `Ver documento` abre una URL absoluta construida con `buildApiUrl` cuando `archivo_url` es relativo, evitando que React Router intente resolver `/documentos/:id/archivo` como ruta frontend.
- Endpoint de archivo reutilizado: `GET /documentos/:id/archivo`. Sirve PDFs e imagenes con `Content-Disposition: inline`; otros tipos quedan como descarga mediante `attachment`.
- Observaciones administrativas: se guardan en `documentos.feedback`; la tabla muestra un indicador `Tiene observaciones` o `Sin observaciones` y la edicion se hace desde la accion `Observaciones`.
- Interfaz de comentarios: modal administrativo con textarea, contador de caracteres, botones `Guardar` y `Cancelar`; al abrirlo carga el comentario existente para editarlo.
- Endpoint reutilizado para revision: `PUT /admin/documents/:id/status`, protegido por `requireAdmin`. Acepta `estado`, `feedback` o ambos; `rejected` se normaliza a `correction` para mantener compatibilidad con el cliente.
- Flujo administrador: listar documentos, abrir archivo, aprobar, rechazar, abrir observaciones, editar comentario, guardar sin recargar la pagina y refrescar la fila con la respuesta del backend.
- Arquitectura de revision: los cambios de estado (`Aprobar`/`Rechazar`) se mantienen separados del guardado de observaciones; el modal envia solo `feedback` al endpoint existente.
- Estados UI implementados: loading de listado, error, empty state, mensajes de exito/error, bloqueo de acciones mientras se actualiza estado o se guardan observaciones.

## Instalacion y ejecucion

Instalar dependencias por paquete:

```bash
cd backend
npm install

cd ../frontend
npm install
```

Variables de entorno:

```text
DB_HOST=db
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=change_me
DB_NAME=visa_db
R2_ACCESS_KEY=...
R2_SECRET_KEY=...
R2_BUCKET=...
R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
LOCAL_UPLOAD_DIR=backend/local_uploads
```

Notas:

- `.env.example` vive en la raiz.
- Docker Compose carga `.env` desde la raiz.
- `backend/app.js` tambien intenta cargar `backend/.env` con `dotenv`. En local fuera de Docker, asegurese de que el backend reciba las mismas variables.
- `LOCAL_UPLOAD_DIR` es opcional; Docker lo define como `/app/local_uploads` y monta el volumen `local_uploads`.
- En `NODE_ENV !== "production"`, si R2 no esta configurado, `storage.js` guarda archivos localmente y el backend expone `/local-files`.
- `frontend/src/config/api.js` usa `VITE_API_URL`. Si esta vacio, las llamadas quedan relativas, por ejemplo `/login`.

Con Docker:

```bash
docker compose up --build
```

Puertos por defecto:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3000`
- Postgres del host: `localhost:5433`, mapeado al contenedor `5432`

Sin Docker:

```bash
cd backend
npm start
```

```bash
cd frontend
npm run dev
```

Si se ejecuta sin Docker, use un `DB_HOST` accesible desde el host, normalmente `localhost`, no `db`.

## Comandos de calidad

Backend:

```bash
cd backend
npm test
npm run test:coverage
```

Frontend:

```bash
cd frontend
npm run lint
npm run test:run
npm run test:coverage
npm run build
```

Antes de cerrar una tarea, ejecute al menos las pruebas relacionadas con el area tocada. Para cambios transversales, corra backend tests, frontend tests, lint y build.

## Backend

### Patrones actuales

El backend usa CommonJS. Mantenga `require`/`module.exports`; no mezcle ESM.

Hay dos estilos conviviendo:

- Endpoints legacy/directos en `backend/app.js`: auth, perfil, tramite, DS-160 y documentos.
- Dominios modulares en `routes/`, `controllers/`, `services/`: banco de preguntas, sesiones de entrevista y notificaciones.

Para funcionalidad nueva, prefiera el patron modular:

```text
routes/<dominio>Routes.js
controllers/<dominio>Controller.js
services/<dominio>Service.js
```

Monte la ruta en `app.js` con `app.use(...)`.

### Base de datos

La app usa `pg.Pool` creado en `backend/app.js`. Las tablas base estan en `init.sql`:

- `usuario`
- `tramite`
- `formulario_ds160`
- `documentos`
- `question_bank`
- `interview_sessions`
- `notificaciones`

Ademas, varios servicios hacen `ensureSchema()` o `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` al arrancar. Si cambia esquema:

- Actualice `init.sql`.
- Actualice tambien los `ensureSchema()` o migraciones ligeras existentes si la app depende de que se autocorrija en ambientes ya creados.
- Use queries parametrizadas con `$1`, `$2`, etc. No concatene valores del usuario en SQL.

### Rutas principales

Auth/sesion:

- `POST /register`
- `POST /login`
- `GET /validar-sesion?correo=...`

Perfil/tramite:

- `POST /guardar-perfil`
- `GET /estado-tramite?correo=...`
- `GET /usuario-perfil?correo=...`
- `PUT /usuario-perfil`
- `PUT /tramite`

DS-160:

- `GET /ds160?correo=...`
- `POST /ds160`

Documentos/uploads:

- `POST /upload`
- `POST /documentos`
- `GET /documentos/:usuarioId`
- `DELETE /documentos/:id?usuario_id=...`

Banco de preguntas:

- `GET /questions`
- `POST /questions`
- `PUT /questions/:id`
- `DELETE /questions/:id`

Entrevistas:

- `GET /interview-sessions`
- `POST /interview-sessions`
- `GET /interview-sessions/user/:userId`
- `GET /interview-sessions/:id`
- `PUT /interview-sessions/:id/feedback`

Notificaciones:

- `POST /notificaciones`
- `GET /notificaciones/:userId/no-leidas`
- `GET /notificaciones/:userId`
- `PUT /notificaciones/:id/leer`
- `PUT /notificaciones/:userId/leer-todas`

### Storage, R2 y archivos

Uploads usan `multer.memoryStorage()` y deben pasar por `backend/storage.js`, no directamente por `r2.js`. La abstraccion decide:

- Produccion o R2 bien configurado: sube a Cloudflare R2.
- Desarrollo/test sin R2 valido: guarda en `LOCAL_UPLOAD_DIR` o `backend/local_uploads`.

`app.js` sirve archivos locales solo fuera de produccion:

```js
if (process.env.NODE_ENV !== "production") {
  app.use("/local-files", express.static(LOCAL_STORAGE_DIR));
}
```

`r2.js` valida que estas variables existan y no sean placeholders:

- `R2_ACCESS_KEY`
- `R2_SECRET_KEY`
- `R2_BUCKET`
- `R2_ENDPOINT`

En pruebas, `storage.js` y/o R2 se mockean. No llame R2 real desde tests unitarios/integracion local.

Cuando cree endpoints de upload:

- Valide archivo requerido antes de subir.
- Use `uploadStoredFile(file, { baseUrl })` antes de persistir si necesita URL final.
- Si falla la persistencia despues del upload, haga cleanup con `deleteStoredFile`.
- Guarde `storage_key` cuando se necesite eliminar/reemplazar archivos.
- Guarde y respete `provider` cuando el caller lo necesite, pero la llave `storage_key` debe bastar para eliminar.

### Manejo de errores

Los servicios modulares usan `error.statusCode` para respuestas esperadas. Los controladores convierten errores no esperados en mensajes genericos y registran `console.error`.

Mantenga ese patron:

```js
const error = new Error("Mensaje para el cliente");
error.statusCode = 400;
throw error;
```

## Frontend

### Patrones actuales

El frontend usa React 19, Vite, React Router y `lucide-react`. No hay TypeScript.

`App.jsx` carga paginas con `lazy`/`Suspense`. La ruta `/` redirige a `/login`; ya no existe una pantalla de onboarding como landing inicial. Login y registro usan `AuthLayout` en `frontend/src/components/auth/`.

Rutas principales estan en `frontend/src/App.jsx`. Al agregar una pantalla:

1. Crear pagina en `frontend/src/pages/`.
2. Importarla en `App.jsx`.
3. Registrar `<Route path="..." element={<... />} />`.
4. Si debe aparecer en navegacion autenticada, actualizar `frontend/src/components/Sidebar.jsx`.
5. Agregar CSS en `frontend/src/styles/` o junto al componente si el area ya usa ese patron.

Para llamadas HTTP, use siempre:

```js
import { buildApiUrl } from "../config/api";

fetch(buildApiUrl("/ruta"))
```

Evite construir URLs con `import.meta.env.VITE_API_URL` directamente. Hay una excepcion legacy en `DocumentList.jsx`; si toca ese componente, considere migrarlo a `buildApiUrl`.

### Sesion y auth

La sesion del usuario se guarda en `localStorage`:

- `visaguide_session`: JSON con `id`, `nombre`, `correo`, `perfil`, `loginTime`.
- `correoUsuario`: compatibilidad con flujos antiguos.
- `perfilUsuario`: compatibilidad con seleccion de perfil.

Para pantallas privadas use `useRequireAuth()`:

```js
const { isValidating, session } = useRequireAuth();
```

Ese hook valida contra `GET /validar-sesion` y redirige a `/login` si la sesion no existe o no es valida.

Flujo actual:

- `/` redirige a `/login`.
- Login exitoso envia a `/dashboard` si el usuario ya tiene `perfil`; de lo contrario a `/seleccion-perfil`.
- Registro exitoso guarda `visaguide_session`, actualiza `correoUsuario` y envia directo a `/seleccion-perfil`.
- Auth usa formularios reales, `Link`/`useNavigate` donde aplica y controles de mostrar/ocultar contrasena.

### UI y estilos

Convenciones visibles:

- Layout autenticado con `Sidebar`.
- Acciones superiores compartidas con `TopActions` y `NotificationCenter`.
- Marca reutilizable con `VisaGuideLogo`.
- Auth reutilizable con `AuthLayout` y `components/auth/auth.css`.
- Modo oscuro via `useTheme()` y atributo `data-theme` en `document.documentElement`.
- Modo Senior via `useModoSenior()` y `localStorage.modoSenior`.
- Tokens globales de layout, color y tipografia en `frontend/src/index.css` usando variables `--vg-*`.
- Muchas pantallas usan CSS por dominio en `frontend/src/styles/*.css`.
- Algunas pantallas y componentes todavia usan estilos inline extensos. Si edita una pantalla, siga el patron local de esa pantalla en lugar de reestructurar todo.
- Use iconos de `lucide-react` para componentes nuevos cuando haya un icono equivalente. Mantenga SVG inline solo si el componente existente ya los usa y el cambio es local.
- Mantenga etiquetas y textos en espanol.
- Tenga cuidado con responsive/mobile: `Sidebar` tiene comportamiento especial en <= 768px.

### Paginas principales

- `Dashboard.jsx`: estado del tramite.
- `InformationSection.jsx`: bloque reutilizado en Dashboard para informacion del proceso.
- `ProfileSelection/ProfileSelection.jsx`: seleccion de tipo de perfil/visa.
- `Perfil/Perfil.jsx`: datos personales, preferencias y resumen del tramite.
- `ds160.jsx`: formulario DS-160 por secciones.
- `Documents.jsx`: documentos requeridos y estado de revision.
- `Entrevista.jsx`: preparacion y resumen de sesiones.
- `InterviewSimulator.jsx`: simulador con grabacion/audio y envio a backend.
- `InterviewFeedback.jsx`: revision de sesiones/feedback.
- `QuestionBank.jsx`: CRUD de preguntas y revision de entrevistas.
- `Notificaciones.jsx`: lista y marcado de notificaciones.
- `Cronologia.jsx`, `Informacion.jsx`, `Chat.jsx`: pantallas informativas/de apoyo.

## Pruebas

### Backend

Jest esta configurado en `backend/jest.config.js`.

- `pg` se mockea en `backend/__tests__/app.test.js`.
- `storage.js` se mockea en `backend/__tests__/app.test.js`.
- R2 se mockea para no tocar servicios reales.
- `backend/__tests__/storage.test.js` valida el fallback local de desarrollo/test.
- Las pruebas usan Supertest contra `require("../app")`.

Al agregar endpoints:

- Agregue casos felices y errores de validacion.
- Mockee queries nuevas en `defaultQueryHandler`.
- Si agrega servicios puros, considere pruebas enfocadas de servicio.

### Frontend

Vitest esta configurado en `frontend/vite.config.js` con:

- `globals: true`
- `environment: "jsdom"`
- `setupFiles: "./src/setupTests.js"`

`setupTests.js` limpia `localStorage`, `sessionStorage`, env vars y mocks despues de cada prueba.

Al agregar UI:

- Testee estados importantes: loading, error, datos renderizados y acciones del usuario.
- Mockee `fetch` cuando el componente consuma backend.
- Para hooks que redirigen con `window.location.href`, revise los tests existentes de `useRequireAuth`.
- Para cambios de auth, revise `Auth.test.jsx`.
- Para componentes compartidos de marca, revise `VisaGuideLogo.test.jsx`.
- Para persistencia del DS-160, revise `DS160Persistence.test.jsx`.

## Datos y seguridad

Atencion: este proyecto actualmente guarda contrasenas en texto plano y no tiene autenticacion por token. No trate `visaguide_session` como seguridad real; es estado de cliente para el prototipo. Si el usuario pide endurecer seguridad, priorice:

- Hash de contrasenas con bcrypt/argon2.
- Login con token/sesion del servidor.
- Middleware de autenticacion para endpoints privados.
- Validacion de propiedad del recurso en backend.
- Configuracion CORS restrictiva por ambiente.

No registre secretos ni datos sensibles en consola. No commitee `.env`, `backend/.env`, `node_modules`, `dist` ni nuevos artefactos de coverage.

## Documentacion y entregables

`docs/` contiene material academico:

- `documento-academico.md`
- `estrategia-pruebas.md`
- `presentacion.md`
- `guion-video.md`
- `checklist-rubrica.md`
- `prompt-presentacion.md`
- `entregables/` con PDF/DOCX/imagenes generadas

`tools/` contiene scripts Python para generar documentos y PDFs. Use esos scripts si el usuario pide regenerar entregables; no edite binarios manualmente.

## Flujo recomendado para agentes

Antes de editar:

1. Lea los archivos relevantes con `rg`/`rg --files`.
2. Identifique si el cambio cae en frontend, backend, DB, docs o varios.
3. Revise pruebas existentes del mismo patron.
4. Si toca esquema, actualice `init.sql` y cualquier `ensureSchema()`.
5. Si toca API, actualice tanto backend como consumidores frontend.

Durante la edicion:

- Mantenga cambios pequenos y enfocados.
- Respete CommonJS en backend y ESM en frontend.
- Use `buildApiUrl` para requests frontend.
- No cambie rutas, nombres de campos ni estructura de respuestas sin revisar consumidores.
- No borre cambios ajenos ni regenere coverage sin necesidad.

Antes de entregar:

1. Ejecute pruebas relacionadas.
2. Ejecute lint/build si toca frontend.
3. Verifique manualmente rutas criticas si hubo cambios visuales o de flujo.
4. Reporte comandos ejecutados y cualquier cosa que no se pudo validar.

## Checklist por tipo de cambio

Backend endpoint nuevo:

- Ruta en `routes/`.
- Controlador con errores consistentes.
- Servicio con validacion y SQL parametrizado.
- Montaje en `app.js`.
- Pruebas con Supertest.
- Actualizacion de `init.sql` si hay tabla/columna nueva.

Frontend pantalla nueva:

- Pagina creada en `src/pages/`.
- Ruta agregada en `App.jsx`.
- Sidebar actualizado si aplica.
- CSS siguiendo el patron local.
- Estados de loading/error/success.
- Prueba de render y acciones principales.

Integracion frontend-backend:

- Endpoint backend validado.
- `buildApiUrl` en frontend.
- Manejo de `response.ok`.
- Mensajes de error utiles.
- Tests de API/componentes actualizados.

Upload/documentos/audio:

- Validacion de archivo y metadatos.
- Uso de `uploadStoredFile`, no llamadas directas a R2 desde endpoints nuevos.
- Configuracion R2 validada en produccion; fallback local permitido solo fuera de produccion.
- Cleanup con `deleteStoredFile` si falla persistencia.
- `storage_key` guardado para reemplazo/eliminacion.
- Tests sin tocar R2 real.

Base de datos:

- `init.sql` actualizado.
- `ensureSchema()` actualizado si aplica.
- Indices/constraints para consultas frecuentes o unicidad.
- Compatibilidad con datos existentes.

## Riesgos conocidos y trampas

- `docker-compose.yml` tiene `VITE_API_URL=http://3.14.12.212:3000` como build arg del frontend. Para local puede convenir cambiarlo temporalmente o usar env adecuado, pero no lo cambie sin pedido del usuario.
- `docker-compose.yml` define `NODE_ENV=development`, `LOCAL_UPLOAD_DIR=/app/local_uploads` y un volumen `local_uploads`; los archivos locales no deben asumirse persistidos en el filesystem del host salvo que el volumen se conserve.
- El root `package.json` solo declara `cors`; los scripts reales estan en `backend/package.json` y `frontend/package.json`.
- Algunos archivos muestran caracteres mojibake en terminal Windows si la consola no esta en UTF-8. Antes de "corregir" textos, confirme que el archivo realmente este mal y no sea solo la salida de PowerShell.
- `app.js` es grande y tiene muchos endpoints legacy. Para cambios grandes, evite meter mas logica ahi salvo que el dominio ya este ahi.
- Los endpoints de documentos existen como `/upload` y `/documentos`; revise consumidores antes de consolidar.
- El fallback local expone `/local-files` solo con `NODE_ENV !== "production"`; no construya flujos de produccion que dependan de esa ruta.
- `localStorage` tiene llaves legacy usadas por varias pantallas. No las elimine sin migracion.
- Coverage esta presente en el repo; no lo use como fuente editable.

## Estado esperado de calidad

Una contribucion lista deberia:

- Mantener el flujo de usuario existente.
- No introducir llamadas directas a URLs hardcodeadas desde componentes nuevos.
- Usar componentes compartidos existentes para auth, marca, top actions y notificaciones cuando aplique.
- No romper modo oscuro ni modo Senior en pantallas autenticadas.
- Validar inputs del backend antes de tocar DB o storage.
- Incluir pruebas proporcionales al cambio.
- Documentar cualquier limitacion o validacion no ejecutada.
