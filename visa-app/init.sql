CREATE TABLE IF NOT EXISTS usuario (
  id_usuario SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  correo TEXT NOT NULL UNIQUE,
  contrasena TEXT NOT NULL,
  rol VARCHAR(20) DEFAULT 'cliente' CHECK (rol IN ('cliente', 'asesor', 'admin'))
);

ALTER TABLE usuario
ADD COLUMN IF NOT EXISTS perfil VARCHAR(100);

ALTER TABLE usuario
ADD COLUMN IF NOT EXISTS rol VARCHAR(20) DEFAULT 'cliente';

UPDATE usuario SET rol = 'cliente'
WHERE rol IS NULL OR rol NOT IN ('cliente', 'asesor', 'admin');

ALTER TABLE usuario
  ALTER COLUMN rol SET DEFAULT 'cliente',
  ALTER COLUMN rol SET NOT NULL;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'usuario_rol_check' AND conrelid = 'usuario'::regclass
  ) THEN
    ALTER TABLE usuario ADD CONSTRAINT usuario_rol_check
    CHECK (rol IN ('cliente', 'asesor', 'admin'));
  END IF;
END $$;

-- Columnas extra para la pantalla "Perfil de Usuario"
ALTER TABLE usuario
  ADD COLUMN IF NOT EXISTS telefono            VARCHAR(40),
  ADD COLUMN IF NOT EXISTS ciudad              VARCHAR(120),
  ADD COLUMN IF NOT EXISTS pais                VARCHAR(120),
  ADD COLUMN IF NOT EXISTS notificaciones_email BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS idioma              VARCHAR(10)  DEFAULT 'es';

INSERT INTO usuario(nombre, correo, contrasena, rol)
SELECT seed.nombre, seed.correo, seed.contrasena, seed.rol
FROM (VALUES
  ('Norman', 'norman@prueba.cliente', '123456', 'cliente'),
  ('Juanfri', 'juanfri@prueba.cliente', '123456', 'cliente'),
  ('Yaya', 'yaya@prueba.cliente', '123456', 'cliente'),
  ('Quan', 'quan@prueba.cliente', '123456', 'cliente'),
  ('Usuario Prueba', 'usuario@prueba.com', '123456', 'cliente'),
  ('Admin Norman', 'admin.norman@prueba.com', '123456', 'admin'),
  ('Admin Juanfri', 'admin.juanfri@prueba.com', '123456', 'admin'),
  ('Admin Yaya', 'admin.yaya@prueba.com', '123456', 'admin'),
  ('Admin Quan', 'admin.quan@prueba.com', '123456', 'admin'),
  ('Admin General', 'admin@prueba.com', '123456', 'admin')
) AS seed(nombre, correo, contrasena, rol)
WHERE NOT EXISTS (
  SELECT 1 FROM usuario u WHERE u.correo = seed.correo
);

CREATE TABLE IF NOT EXISTS tramite (
  id_tramite SERIAL PRIMARY KEY,
  id_usuario INT UNIQUE REFERENCES usuario(id_usuario),
  estado VARCHAR(100) DEFAULT 'En proceso',
  etapa_actual VARCHAR(200) DEFAULT 'Configuración de perfil',
  progreso INT DEFAULT 0,
  siguiente_paso VARCHAR(200) DEFAULT 'Seleccionar perfil de visa',
  mensaje TEXT DEFAULT 'Configura tu perfil para comenzar'
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

CREATE TABLE IF NOT EXISTS notificaciones (
  id SERIAL PRIMARY KEY,
  id_usuario INT NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
  titulo VARCHAR(200) NOT NULL,
  mensaje TEXT NOT NULL,
  tipo VARCHAR(50) NOT NULL DEFAULT 'info',
  leido BOOLEAN NOT NULL DEFAULT FALSE,
  etapa_relacionada VARCHAR(200),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
