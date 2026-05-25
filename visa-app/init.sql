CREATE TABLE IF NOT EXISTS usuario (
  id_usuario SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  correo TEXT NOT NULL UNIQUE,
  contrasena TEXT NOT NULL
);

ALTER TABLE usuario
ADD COLUMN IF NOT EXISTS perfil VARCHAR(100);

-- Columnas extra para la pantalla "Perfil de Usuario"
ALTER TABLE usuario
  ADD COLUMN IF NOT EXISTS telefono            VARCHAR(40),
  ADD COLUMN IF NOT EXISTS ciudad              VARCHAR(120),
  ADD COLUMN IF NOT EXISTS pais                VARCHAR(120),
  ADD COLUMN IF NOT EXISTS notificaciones_email BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS idioma              VARCHAR(10)  DEFAULT 'es';

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
  documento_key VARCHAR(80),
  estado VARCHAR(30) DEFAULT 'review',
  feedback TEXT,
  storage_key TEXT,
  usuario_id INT REFERENCES usuario(id_usuario),
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS documentos_usuario_documento_key_idx
ON documentos(usuario_id, documento_key)
WHERE usuario_id IS NOT NULL AND documento_key IS NOT NULL;

CREATE TABLE IF NOT EXISTS question_bank (
  id SERIAL PRIMARY KEY,
  question TEXT NOT NULL,
  category VARCHAR(100),
  difficulty VARCHAR(20),
  is_required BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO question_bank (question, category, difficulty, is_required)
SELECT seed.question, seed.category, seed.difficulty, seed.is_required
FROM (
  VALUES
    ('¿Cuál es el propósito principal de su viaje?', 'Viaje', 'Fácil', true),
    ('¿Cuánto tiempo planea permanecer en el país?', 'Viaje', 'Fácil', true),
    ('¿Quién financiará su viaje y estadía?', 'Finanzas', 'Media', true),
    ('¿Tiene familiares o conocidos viviendo en el país destino?', 'Relaciones', 'Media', false),
    ('¿Cuál es su ocupación actual?', 'Laboral', 'Fácil', true),
    ('¿Desde cuándo trabaja en su empleo actual?', 'Laboral', 'Media', false),
    ('¿Ha viajado anteriormente a este país?', 'Historial', 'Media', false),
    ('¿Ha visitado otros países en los últimos cinco años?', 'Historial', 'Media', false),
    ('¿Cuenta con reservación de hospedaje o dirección de estadía?', 'Viaje', 'Media', true),
    ('¿Cuál es su salario o ingreso mensual aproximado?', 'Finanzas', 'Alta', false),
    ('¿Tiene propiedades, negocios o activos en su país de origen?', 'Finanzas', 'Alta', false),
    ('¿Cuál es su estado civil?', 'Personal', 'Fácil', false),
    ('¿Viajará solo o acompañado?', 'Relaciones', 'Fácil', false),
    ('¿Qué actividades realizará durante su estadía?', 'Viaje', 'Media', true),
    ('¿Tiene intención de trabajar o estudiar durante su visita?', 'Migración', 'Alta', true)
) AS seed(question, category, difficulty, is_required)
WHERE NOT EXISTS (SELECT 1 FROM question_bank);

CREATE TABLE IF NOT EXISTS interview_sessions (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES usuario(id_usuario),
  user_name VARCHAR(200),
  user_email VARCHAR(200),
  status VARCHAR(30) DEFAULT 'pending',
  responses JSONB NOT NULL DEFAULT '[]',
  feedback TEXT,
  rating INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMP
);
