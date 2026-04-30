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

-- Tabla para guardar el formulario DS-160
CREATE TABLE IF NOT EXISTS formulario_ds160 (
  id_formulario SERIAL PRIMARY KEY,
  id_usuario INT REFERENCES usuario(id_usuario),
  datos JSONB NOT NULL DEFAULT '{}',
  seccion_actual INT DEFAULT 1,
  completado BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS documentos (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  tipo VARCHAR(100),
  archivo_url TEXT NOT NULL,
  usuario_id INT REFERENCES usuario(id_usuario),
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
