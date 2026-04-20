CREATE TABLE IF NOT EXISTS usuario (
  id_usuario SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  correo TEXT NOT NULL UNIQUE,
  contrasena TEXT NOT NULL
);

ALTER TABLE usuario
ADD COLUMN IF NOT EXISTS perfil VARCHAR(100);

CREATE TABLE IF NOT EXISTS tramite (
  id_tramite SERIAL PRIMARY KEY,
  id_usuario INT REFERENCES usuario(id_usuario),
  estado VARCHAR(100) DEFAULT 'En proceso',
  etapa_actual VARCHAR(200) DEFAULT 'Formulario DS-160',
  progreso INT DEFAULT 10,
  siguiente_paso VARCHAR(200) DEFAULT 'Completar formulario DS-160',
  mensaje TEXT DEFAULT 'Tu trámite ha comenzado correctamente'
);