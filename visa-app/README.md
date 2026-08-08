# VisaGuide

Aplicacion web para acompanar procesos de visa estadounidense.

## Panel de administracion

El panel administrador vive bajo `/admin` y reutiliza `AdminLayout` para Sidebar,
Header y contenido principal. La vista `/admin/interviews` usa el componente
`InterviewReviewPanel` con estilos integrados al panel administrador, incluyendo
resumen de entrevistas, seleccion de sesiones, reproduccion de audios y guardado
de retroalimentacion.

Los audios de entrevistas se guardan mediante la abstraccion `storage.js`: en
desarrollo/Docker usan fallback local y en produccion pueden usar R2. El panel
admin reproduce los audios desde `GET /interview-sessions/:id/audio/:questionId`,
por lo que no depende de URLs publicas del bucket.

## Usuarios de prueba

Estas cuentas son unicamente para desarrollo y pruebas.

| Rol | Correo | Contrasena |
| --- | --- | --- |
| Cliente | norman@prueba.cliente | 123456 |
| Cliente | juanfri@prueba.cliente | 123456 |
| Cliente | yaya@prueba.cliente | 123456 |
| Cliente | quan@prueba.cliente | 123456 |
| Cliente | usuario@prueba.com | 123456 |
| Admin | admin.norman@prueba.com | 123456 |
| Admin | admin.juanfri@prueba.com | 123456 |
| Admin | admin.yaya@prueba.com | 123456 |
| Admin | admin.quan@prueba.com | 123456 |
| Admin | admin@prueba.com | 123456 |
