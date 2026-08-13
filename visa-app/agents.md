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

## Sprint 6 - Ajustes visuales del Panel Administrador

Estado posterior a `cambios-generales-admin`:

- Rama de trabajo: `cambios-generales-admin`.
- Pantalla afectada: `/admin/interviews`, usando `frontend/src/components/InterviewReviewPanel.jsx`.
- Layout afectado: `frontend/src/components/admin/AdminLayout.jsx` y estilos de `frontend/src/styles/admin.css`.
- La pantalla de entrevistas ya no depende visualmente de la pagina Banco de Preguntas cuando se renderiza dentro de `AdminLayout`; `admin.css` define el hero, tarjetas resumen, lista de sesiones, detalle, respuestas grabadas y formulario de retroalimentacion.
- El Sidebar administrativo tiene mas separacion entre logo, marca y subtitulo `Administrador`, ademas de un tratamiento visual con gradientes y acentos de color.
- Mantener cualquier ajuste futuro de apariencia admin dentro de `frontend/src/styles/admin.css` salvo que un modulo tenga un stylesheet propio ya establecido.

## Sprint 6 - Audios de Entrevistas para Administradores

Estado posterior a `audios-entrevistas-admin`:

- Rama de trabajo: `audios-entrevistas-admin`.
- El simulador sigue enviando audios como `FormData` a `POST /interview-sessions`.
- `backend/services/interviewSessionService.js` usa `uploadStoredFile` de `backend/storage.js` para guardar audios, con fallback local en desarrollo/Docker y R2 cuando este configurado.
- Los metadatos del audio quedan en `interview_sessions.responses[].audio` con `key`, `provider`, `mimetype`, `size` y una `url` presentada como endpoint backend.
- Endpoint de audio: `GET /interview-sessions/:id/audio/:questionId`.
- `frontend/src/components/InterviewReviewPanel.jsx` convierte rutas relativas de audio con `buildApiUrl`, por lo que el reproductor del admin apunta al backend y no a React Router.
- `frontend/src/pages/InterviewFeedback.jsx` tambien convierte rutas relativas de audio con `buildApiUrl`, para que el cliente pueda volver a escuchar sus grabaciones desde el backend.
- El endpoint de audio debe seguir siendo cargable directamente por `<audio src="...">`; no depender de headers `Authorization`, porque el elemento HTML no los envia.
- No guardar audio en base64 dentro de Postgres; mantener archivos en storage y metadatos en JSONB.

## Sprint 6 - Mejoras del Panel Administrador

Estado inicial antes de las ramas `DocumentsStatusFix`, `AdminSidebarCollapse` y `AdminSidebarScroll`:

- Rama principal del Sprint para estas mejoras: `Dashboard-admin`.
- El Panel Administrador usa `frontend/src/components/admin/AdminLayout.jsx` como layout compartido con Sidebar, Header, notificaciones, cambio de tema y logout.
- Las rutas administrativas estan registradas en `frontend/src/App.jsx` y protegidas con `RequireAdmin`.
- `/admin/documents` usa `frontend/src/pages/admin/AdminDocuments.jsx` y el endpoint `PUT /admin/documents/:id/status`.
- Se verifico una inconsistencia real en documentos: el frontend envia `{ status: "approved" }`, mientras `backend/controllers/adminDocumentController.js` solo normaliza `req.body.estado`.
- Las observaciones administrativas ya se guardan mediante `{ feedback }` y deben seguir funcionando sin cambiar estado.
- El Sidebar admin tiene comportamiento movil con `sidebarOpen`, boton hamburger, backdrop y cierre con Escape.
- El Sidebar admin no tiene colapso de escritorio persistente; el boton del header se oculta en desktop desde `frontend/src/styles/admin.css`.
- El Sidebar admin solo aplica `overflow-y: auto` en mobile; en escritorio la lista de navegacion puede quedar fuera de pantallas bajas.

Tareas planificadas:

- `DocumentsStatusFix`: hacer que el backend acepte tanto `status` como `estado` en `PUT /admin/documents/:id/status`, manteniendo compatibilidad con comentarios y estados `approved`, `correction` y `rejected`.
- `AdminSidebarCollapse`: agregar colapso/expansion de escritorio en `AdminLayout`, persistirlo con `localStorage`, conservar mobile y mostrar tooltips cuando el Sidebar este colapsado.
- `AdminSidebarScroll`: mejorar el scroll vertical de escritorio para que el header y footer del Sidebar queden fijos y solo se desplace la lista de navegacion.
- No hacer merge, rebase ni push desde estas ramas.

Estado final posterior a las mejoras:

- Rama `DocumentsStatusFix`: corrige el contrato de documentos en `backend/controllers/adminDocumentController.js`. El endpoint `PUT /admin/documents/:id/status` acepta `estado` y `status`; `estado` conserva precedencia si ambos llegan. Los comentarios via `feedback` siguen funcionando sin cambiar estado. Se agrego prueba backend en `backend/__tests__/app.test.js`.
- Rama `AdminSidebarCollapse`: agrega Sidebar colapsable de escritorio en `frontend/src/components/admin/AdminLayout.jsx` y `frontend/src/styles/admin.css`. El estado se persiste en `localStorage` con la llave `vg-admin-sidebar-collapsed`, se mantiene al recargar, conserva el comportamiento movil y muestra tooltips con `data-tooltip` cuando esta colapsado. Se agrego prueba en `frontend/src/__tests__/AdminPanel.test.jsx`.
- Rama `AdminSidebarScroll`: mejora el scroll vertical del Sidebar en `frontend/src/styles/admin.css`. En escritorio, el Sidebar usa alto fijo de viewport, header/logo y footer no se desplazan, y solo `.admin-sidebar__nav` tiene `overflow-y: auto`. En mobile se mantiene el scroll del panel completo.
- Componentes reutilizados: `AdminLayout`, `VisaGuideLogo`, `RequireAdmin`, `AdminShared`, rutas existentes y estilos de `admin.css`.
- Cambios de arquitectura: no se agregaron pantallas, rutas ni servicios nuevos; los cambios se limitaron a compatibilidad de payload backend y comportamiento visual del Sidebar.
- Validaciones ejecutadas por rama: backend `npm test`, frontend `npm run test:run -- src/__tests__/AdminPanel.test.jsx`, frontend `npm run test:run` y frontend `npm run build`. Las pruebas y builds pasaron; Vitest mantiene el aviso conocido de jsdom `Not implemented: navigation to another Document` por `window.open`.
- Las ramas quedaron separadas, sin merge, sin rebase y sin push.

## Sprint 6 - Branding y organizacion del Sidebar Administrador

Estado inicial antes de las tareas de Norman en `AdminSidebarIntegrated`:

- Rama de trabajo: `AdminSidebarIntegrated`.
- La rama ya contiene el Sidebar colapsable de escritorio y el scroll vertical de la lista administrativa.
- El Sidebar cliente usa `VisaGuideLogo`, tokens globales `--vg-*`, fondo oscuro `--vg-navy`, acento `--vg-red`, logo con mark rojo y texto blanco.
- El Sidebar administrador todavia mantiene overrides propios en `frontend/src/styles/admin.css`, incluyendo colores hex hardcodeados para logo, fondo, links activos, hover, header y superficies.
- `frontend/src/components/admin/AdminLayout.jsx` mantiene una lista plana de enlaces administrativos, mas acciones de tema, perfil y logout en el footer.
- Se debe alinear el branding del Panel Administrador al sistema visual oficial sin copiar codigo del Sidebar cliente ni cambiar logica de negocio.

Tareas planificadas:

- Branding admin: revisar `VisaGuideLogo`, `VisaGuideLogo.css`, `index.css`, `admin.css` y `AdminLayout.jsx`; reemplazar overrides innecesarios por tokens `--vg-*`; conservar componentes y rutas existentes.
- Organizacion del Sidebar: agrupar enlaces en secciones visuales `Dashboard`, `Gestion`, `Revision`, `Analisis` y `Sistema`; mantener colapso, persistencia, scroll, responsive, iconos, tooltips, opcion activa, teclado y focus visible.
- Commits esperados: `style(admin): align branding with design system` y `refactor(admin): improve sidebar organization`.
- No hacer merge, rebase ni push.

Estado posterior a las tareas de Norman:

- Rama de trabajo: `AdminSidebarIntegrated`.
- Commits realizados: `style(admin): align branding with design system` y `refactor(admin): improve sidebar organization`.
- Branding admin alineado con el sistema visual oficial usando `VisaGuideLogo` y tokens `--vg-*` en `frontend/src/styles/admin.css`: `--vg-bg`, `--vg-text`, `--vg-card`, `--vg-border`, `--vg-navy`, `--vg-navy-mid`, `--vg-red`, `--vg-on-strong`, `--vg-strong-muted`, `--vg-text-muted`, `--vg-danger-text` y `--vg-slate`.
- Sidebar administrativo reorganizado en grupos visuales: `Dashboard`, `Gestion`, `Revision`, `Analisis` y `Sistema`, sin submenus ni rutas nuevas.
- `frontend/src/components/admin/AdminLayout.jsx` mantiene `AdminLayout`, `RequireAdmin`, `VisaGuideLogo`, `useTheme`, `useAdminSession`, `useAdminResource`, `NavLink` y los iconos de `lucide-react`.
- Se conserva el Sidebar colapsable de escritorio con persistencia en `localStorage` mediante la llave `vg-admin-sidebar-collapsed`.
- En estado colapsado se muestran solo iconos, la opcion activa permanece visible y los tooltips se muestran con `data-tooltip` al pasar mouse o enfocar con teclado.
- El scroll vertical de escritorio queda limitado a `.admin-sidebar__nav`; el header de marca permanece fijo arriba y el footer de sistema permanece visible abajo.
- Se conserva el comportamiento movil: drawer lateral, backdrop, cierre por click y sin boton de colapso de escritorio.
- Accesibilidad pulida con `aria-label`, `aria-controls`, `aria-expanded`, `aria-pressed`, foco visible en links/botones y navegacion por teclado.
- Prueba agregada en `frontend/src/__tests__/AdminPanel.test.jsx` para validar los grupos visibles y enlaces principales del Sidebar.
- Validacion enfocada ejecutada: `npm run test:run -- src/__tests__/AdminPanel.test.jsx` en `frontend/`, con 23 pruebas exitosas. El aviso conocido de jsdom sobre navegacion externa no bloquea la suite.
- Sin cambios de arquitectura, sin merge, sin rebase y sin push.

## SCRUM-141 - Notificaciones Automaticas

Estado inicial antes de implementar `AutomaticNotifications`:

- Rama de trabajo esperada: `AutomaticNotifications`.
- La app ya tiene infraestructura de notificaciones: tabla `notificaciones`, `backend/services/notificacionService.js`, `backend/routes/notificacionRoutes.js`, `backend/controllers/notificacionController.js`, `NotificationCenter`, pagina `/notificaciones` y contador del Sidebar cliente.
- Ya existe una notificacion automatica para cambios de etapa mediante `notificarCambioEtapa` en `backend/app.js`, usada por `PUT /tramite` y por flujos legacy de avance.
- La historia SCRUM-141 debe reutilizar el servicio existente `crearNotificacion` y, para cambios de etapa, reutilizar `existeNotificacionEtapa` o helpers existentes para evitar duplicados.
- Alcance: generar notificaciones automaticas por revision de documentos, feedback/calificacion de entrevistas y cambios administrativos de tramite, incluyendo cambio de estado, cambio de etapa y asignacion de asesor.
- No crear endpoints nuevos salvo que sea estrictamente necesario; los eventos deben colgarse de los endpoints existentes de documentos, entrevistas y tramites administrativos.
- Mantener commits separados por fase: documentos, entrevistas y tramites.

Estado final posterior a SCRUM-141 (`AutomaticNotifications`):

- Rama de trabajo: `AutomaticNotifications`.
- Servicios reutilizados: `backend/services/notificacionService.js` con `crearNotificacion`, `existeNotificacionEtapa` y el helper compartido `notificarCambioEtapa`.
- Endpoints reutilizados: `PUT /admin/documents/:id/status`, `PUT /interview-sessions/:id/feedback`, `PUT /admin/processes/:id`, `POST /admin/assignments` y el flujo legacy `PUT /tramite`.
- Componentes reutilizados: `frontend/src/components/NotificationCenter.jsx`, `frontend/src/pages/Notificaciones.jsx` y el contador de notificaciones del Sidebar cliente. No se agregaron pantallas ni endpoints frontend.
- Documentos: al aprobar, rechazar/enviar a correccion o guardar observaciones administrativas se crea una notificacion de tipo `documento` para el usuario propietario del documento. El endpoint admin conserva compatibilidad con `estado` y `status`.
- Entrevistas: al guardar retroalimentacion o calificacion desde el panel admin se crea una notificacion de tipo `entrevista` para el usuario de la sesion.
- Tramites: al cambiar estado se crea una notificacion informativa; al cambiar etapa se reutiliza `notificarCambioEtapa` para evitar duplicados recientes por `etapa_relacionada`; al asignar asesor desde gestion de tramite o desde asignaciones se crea una notificacion informativa.
- No se creo infraestructura nueva de notificaciones ni tablas nuevas; la historia queda integrada sobre la tabla `notificaciones` existente.
- Commits realizados: `feat(notifications): add document review notifications`, `feat(notifications): add interview feedback notifications` y `feat(notifications): add process update notifications`.

## SCRUM-140 - Detalle de Solicitud Administrativa

Estado inicial antes de implementar `AdminRequestDetail`:

- Rama de trabajo esperada: `AdminRequestDetail`.
- La pantalla `/admin/processes` existe en `frontend/src/pages/admin/AdminProcesses.jsx` y ya permite listar, filtrar, paginar y gestionar tramites mediante `GET /admin/processes` y `PUT /admin/processes/:id`.
- No existe ruta frontend `/admin/processes/:id` ni endpoint backend `GET /admin/processes/:id` para consolidar una solicitud individual.
- Componentes reutilizables identificados: `AdminLayout`, `RequireAdmin`, `AdminPageHeader`, `AdminResourceState`, `AdminSearch`, `AdminTabs`, tabla y tarjetas de `frontend/src/styles/admin.css`, `AdminDocuments` para contrato visual/logica de documentos, `AdminDS160` para estado DS-160 e `InterviewReviewPanel` para contrato visual de entrevistas.
- Endpoints reutilizables existentes: `GET /interview-sessions/user/:userId`, `GET /documentos/:usuarioId`, `GET /notificaciones/:userId`, `GET /documentos/:id/archivo`, `PUT /admin/processes/:id`, `PUT /interview-sessions/:id/feedback` y `PUT /admin/documents/:id/status`.
- Para evitar multiples llamadas innecesarias desde el frontend, se evaluara crear `GET /admin/processes/:id` en `backend/routes/adminProcessRoutes.js` con JOINs y consultas agregadas de usuario, tramite, DS-160, documentos, entrevistas y notificaciones.
- La vista debe integrarse al Panel Administrador con el mismo Sidebar/Header, estados de carga/error/empty y acciones de navegacion hacia gestion de tramite, documentos, entrevistas y DS-160 sin duplicar pantallas.
- No hacer merge, rebase ni push desde esta rama.

Estado final posterior a SCRUM-140 (`AdminRequestDetail`):

- Rama de trabajo: `AdminRequestDetail`.
- Nueva ruta frontend: `/admin/processes/:id`, registrada en `frontend/src/App.jsx` y protegida con `RequireAdmin`.
- Nueva pantalla: `frontend/src/pages/admin/AdminProcessDetail.jsx`, renderizada dentro de `AdminLayout` y usando `AdminPageHeader`, `AdminResourceState`, tarjetas, tablas, estados visuales y estilos de `frontend/src/styles/admin.css`.
- Navegacion: `frontend/src/pages/admin/AdminProcesses.jsx` mantiene la accion `Gestionar` y agrega el enlace `Ver detalle` para abrir `/admin/processes/:id`.
- Endpoint creado: `GET /admin/processes/:id` en `backend/routes/adminProcessRoutes.js`, protegido por `requireAdmin`; consolida tramite, solicitante, resumen DS-160, documentos, entrevistas y notificaciones del usuario.
- Endpoints reutilizados desde la vista: `GET /documentos/:id/archivo` para abrir archivos mediante `frontend/src/utils/documentPreview.js`; enlaces a `/admin/processes`, `/admin/documents`, `/admin/interviews` y `/admin/ds160` para gestionar modulos existentes sin duplicar pantallas.
- Componentes/logica reutilizados: `AdminLayout`, Sidebar/Header administrativo, `AdminPageHeader`, `AdminResourceState`, patrones de tabla/card de `admin.css`, contrato de documentos de `AdminDocuments`, resumen DS-160 existente y estructura de entrevistas compatible con `InterviewReviewPanel`.
- Utilidad compartida creada: `frontend/src/utils/documentPreview.js`, usada por `AdminProcessDetail` y `AdminDocuments` para construir URLs absolutas de documentos con `buildApiUrl` y abrirlos sin que React Router capture rutas backend.
- Backend presenta datos normalizados: `tramite`, `solicitante`, `ds160`, `documentos`, `entrevistas` y `notificaciones`; los audios de entrevistas conservan rutas `/interview-sessions/:id/audio/:questionId`.
- Estados UI implementados: loading, error con reintento, empty states por modulo, resumen superior, progreso del tramite, resumen DS-160, documentos, entrevistas, notificaciones y accesos rapidos.
- Pruebas agregadas/actualizadas: `backend/__tests__/adminProcesses.test.js` cubre el detalle consolidado y 404; `frontend/src/__tests__/AdminPanel.test.jsx` cubre el boton `Ver detalle` y la ruta `/admin/processes/:id`.
- Commits realizados: `feat(admin-processes): add request detail route`, `docs(agents): note SCRUM-140 start`, `feat(admin-processes): implement request detail page` y `feat(admin-processes): integrate request detail modules`.

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
