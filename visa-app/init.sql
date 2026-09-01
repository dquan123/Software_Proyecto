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

ALTER TABLE usuario
  ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS capacidad_asesor INT DEFAULT 50,
  ADD COLUMN IF NOT EXISTS disponible_asesor BOOLEAN DEFAULT TRUE;

CREATE TABLE IF NOT EXISTS tramite (
  id_tramite SERIAL PRIMARY KEY,
  id_usuario INT UNIQUE REFERENCES usuario(id_usuario),
  estado VARCHAR(100) DEFAULT 'En proceso',
  etapa_actual VARCHAR(200) DEFAULT 'Configuración de perfil',
  progreso INT DEFAULT 0,
  siguiente_paso VARCHAR(200) DEFAULT 'Seleccionar perfil de visa',
  mensaje TEXT DEFAULT 'Configura tu perfil para comenzar',
  id_asesor INT REFERENCES usuario(id_usuario),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE tramite ADD COLUMN IF NOT EXISTS id_asesor INT REFERENCES usuario(id_usuario);
ALTER TABLE tramite
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
CREATE INDEX IF NOT EXISTS tramite_asesor_idx ON tramite(id_asesor);

CREATE TABLE IF NOT EXISTS process_change_history (
  id SERIAL PRIMARY KEY,
  process_id INT NOT NULL REFERENCES tramite(id_tramite) ON DELETE CASCADE,
  field_name VARCHAR(100) NOT NULL,
  old_value TEXT,
  new_value TEXT,
  changed_by INT REFERENCES usuario(id_usuario) ON DELETE SET NULL,
  changed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS process_change_history_process_idx
ON process_change_history(process_id, changed_at DESC, id DESC);

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
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  activo BOOLEAN DEFAULT TRUE,
  uso_count INT DEFAULT 0
);

ALTER TABLE formulario_ds160
  ADD COLUMN IF NOT EXISTS estado_revision VARCHAR(30) DEFAULT 'en_progreso',
  ADD COLUMN IF NOT EXISTS feedback_revision TEXT,
  ADD COLUMN IF NOT EXISTS id_asesor INT REFERENCES usuario(id_usuario);

CREATE TABLE IF NOT EXISTS admin_settings (
  id INT PRIMARY KEY,
  nombre_comercial VARCHAR(160),
  razon_social VARCHAR(200),
  sitio_web TEXT,
  idioma VARCHAR(20) DEFAULT 'es',
  zona_horaria VARCHAR(80) DEFAULT 'America/Guatemala',
  notificaciones_automaticas BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admin_activity (
  id SERIAL PRIMARY KEY,
  actor_id INT REFERENCES usuario(id_usuario),
  accion VARCHAR(180) NOT NULL,
  detalle TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

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
